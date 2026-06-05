// Survey marker deriver — the executable form of SURVEY_MARKER_CONTRACT.md.
//
// This is the half that REPLACES the LLM. Where the old path asked a model to read the site and
// emit per-field evidence + P1–P4 (non-deterministically — deal-findrs flipped 12/10/9 across
// identical runs), this greps machine-checkable `data-*` markers the build plants and DERIVES the
// same survey.ts inputs in plain code. Same DOM in ⇒ same evidence out, structurally.
//
// Pure: takes raw DOM strings (the route does the fetching) and returns { evidence, preHard }
// in exactly the shape loadCardSurvey/survey.ts already consume. No model, no I/O, no judgement.

import type {SurveyField, PreHardResult, FieldEvidence} from './survey'

export type MarkerClass =
    | 'PRESENCE' // marker exists with any non-empty value; slug content not inspected
    | 'NAMED' //    marker exists AND value ∉ banlist (the P2 standard, applied per-field)
    | 'ENUM' //     marker exists AND value ∈ a closed set

export interface MarkerDef {
    field: SurveyField
    attr: string
    cls: MarkerClass
    enum?: readonly string[]
}

/** The 14 field markers — SURVEY_MARKER_CONTRACT §2. Order mirrors SURVEY_FIELDS. */
export const SURVEY_MARKERS: readonly MarkerDef[] = [
    {field: 'promise', attr: 'data-promise', cls: 'PRESENCE'},
    {field: 'friction', attr: 'data-friction', cls: 'PRESENCE'},
    {field: 'core_mechanism', attr: 'data-core-mechanism', cls: 'PRESENCE'},
    {field: 'icp_geography', attr: 'data-icp-geography', cls: 'PRESENCE'},
    {field: 'icp_partner_type', attr: 'data-icp-partner-type', cls: 'NAMED'},
    {field: 'icp_buyer_title', attr: 'data-icp-buyer-title', cls: 'NAMED'},
    {field: 'icp_verticals', attr: 'data-icp-verticals', cls: 'NAMED'},
    {field: 'icp_company_size', attr: 'data-icp-company-size', cls: 'PRESENCE'},
    {
        field: 'icp_stage',
        attr: 'data-icp-stage',
        cls: 'ENUM',
        enum: ['seed', 'growth', 'scale', 'operating-business', 'enterprise'],
    },
    {field: 'exclusions', attr: 'data-exclusions', cls: 'PRESENCE'},
    {field: 'distributor', attr: 'data-distributor', cls: 'NAMED'},
    {field: 'distributor_outcomes', attr: 'data-distributor-outcomes', cls: 'PRESENCE'},
    {field: 'end_user', attr: 'data-end-user', cls: 'NAMED'},
    {field: 'end_user_outcomes', attr: 'data-end-user-outcomes', cls: 'PRESENCE'},
] as const

/** P3-only derivation marker (not one of the 14 scored fields). */
export const WHY_NOW_ATTR = 'data-why-now'

/**
 * The generic-value banlist — SURVEY_MARKER_CONTRACT §3. A NAMED marker whose value is in here
 * scores false. This is the mechanical form of the old prose rule "'SMBs' is an automatic false",
 * and it now ALSO bans `reseller` — which is exactly the lazy value the live deal-findrs build
 * emits (`data-icp-partner-type="reseller"`). The build must emit the named archetype instead.
 */
export const BANLIST: ReadonlySet<string> = new Set([
    'smbs', 'smb', 'sme', 'businesses', 'business', 'users', 'user',
    'customers', 'customer', 'companies', 'company', 'clients', 'client',
    'partners', 'partner', 'resellers', 'reseller', 'distributors', 'distributor',
    'buyers', 'sellers', 'any', 'any-industry', 'all-industries',
    'everyone', 'anyone', 'general', 'generic',
])

export interface DeriveInput {
    /** Raw HTML of every fetched manifest route (markers may live on any of them). */
    doms: string[]
    /** Did the homepage answer HTTP 200? Drives P1 (the route does the live fetch). */
    rootOk: boolean
}

export interface MarkerReportRow {
    field: SurveyField
    attr: string
    raw: string | null
    evidenced: boolean
    reason: string
}

export interface DeriveOutput {
    evidence: Partial<Record<SurveyField, FieldEvidence>>
    preHard: PreHardResult[]
    /** Per-field grep trace — for the response + logs ("hard, but legible"). */
    report: MarkerReportRow[]
    whyNowPresent: boolean
}

/** First `attr="value"` across the combined DOM, trimmed; null if absent or empty. */
function readMarker(dom: string, attr: string): string | null {
    // attr names are [a-z-]+ (no regex specials); value is everything up to the closing quote.
    const m = dom.match(new RegExp(`${attr}\\s*=\\s*"([^"]*)"`, 'i'))
    if (!m) return null
    const v = m[1].trim()
    return v.length ? v : null
}

function judge(def: MarkerDef, raw: string | null): { evidenced: boolean; evidence: string | null; reason: string } {
    if (raw === null) {
        return {evidenced: false, evidence: null, reason: `${def.attr} absent`}
    }
    const v = raw.toLowerCase()
    if (def.cls === 'NAMED' && BANLIST.has(v)) {
        // Present but generic — the P2 failure class. Keep a diagnostic so the build knows WHY.
        return {
            evidenced: false,
            evidence: `${def.attr}="${raw}" — generic value (banlist); build must emit a named archetype`,
            reason: 'banlist',
        }
    }
    if (def.cls === 'ENUM' && def.enum && !def.enum.includes(v)) {
        return {
            evidenced: false,
            evidence: `${def.attr}="${raw}" — off-enum (allowed: ${def.enum.join(' | ')})`,
            reason: 'off-enum',
        }
    }
    return {evidenced: true, evidence: `${def.attr}="${raw}"`, reason: 'present'}
}

/**
 * Derive survey.ts inputs from the live DOM. The output plugs straight into
 * loadCardSurvey(slug, { evidence, preHard }) — no shape change anywhere downstream.
 *
 * P2/P3 are DERIVED from the field results, never re-judged — which is what kills the
 * intra-run self-contradiction (the model evidencing an archetype, then failing P2 for "no
 * archetype"). P2 *is* the distributor field check; it cannot disagree with itself.
 */
export function deriveSurveyFromDom(input: DeriveInput): DeriveOutput {
    const dom = input.doms.join('\n')

    const evidence: Partial<Record<SurveyField, FieldEvidence>> = {}
    const report: MarkerReportRow[] = []

    for (const def of SURVEY_MARKERS) {
        const raw = readMarker(dom, def.attr)
        const j = judge(def, raw)
        evidence[def.field] = {evidenced: j.evidenced, evidence: j.evidence}
        report.push({field: def.field, attr: def.attr, raw, evidenced: j.evidenced, reason: j.reason})
    }

    const whyNowPresent = readMarker(dom, WHY_NOW_ATTR) !== null

    // PRE-HARD — derived, not judged (SURVEY_MARKER_CONTRACT §5).
    const distOk = evidence.distributor?.evidenced ?? false
    const distOutOk = evidence.distributor_outcomes?.evidenced ?? false

    const preHard: PreHardResult[] = [
        {
            code: 'P1',
            status: input.rootOk ? 'pass' : 'fail',
            evidence: input.rootOk ? 'homepage answered HTTP 200' : 'homepage did not answer 200',
        },
        {
            code: 'P2',
            status: distOk ? 'pass' : 'fail',
            evidence: distOk
                ? `derived from distributor marker (${evidence.distributor?.evidence})`
                : 'no named distributor archetype (distributor marker absent or generic)',
        },
        {
            code: 'P3',
            status: distOk && distOutOk && whyNowPresent ? 'pass' : 'fail',
            evidence:
                distOk && distOutOk && whyNowPresent
                    ? 'distributor + distributor_outcomes + why-now all present'
                    : `missing: ${[
                        !distOk && 'distributor',
                        !distOutOk && 'distributor_outcomes',
                        !whyNowPresent && 'data-why-now',
                    ]
                        .filter(Boolean)
                        .join(', ')}`,
        },
        {
            // Informational only (not in GATING_PRE_HARD) — not marker-derivable, so 'unknown' is
            // honest and harmless to the verdict. A scale-infra heuristic could set this later.
            code: 'P4',
            status: 'unknown',
            evidence: 'informational — TOO-MUCH guard is not marker-derived',
        },
    ]

    return {evidence, preHard, report, whyNowPresent}
}