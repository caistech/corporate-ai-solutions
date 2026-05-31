// Survey-gate scorer — the post-build twin of the Gate-1 readiness scorer (score.ts).
//
// Where scoreCard judges a card's spec against the 45-check readiness rubric, this judges a
// BUILT product against what the live site/repo actually evidences. It answers the three-door
// question: does this build go forward (RENOVATION → Stage 5), back to the workshop
// (TEARDOWN → re-enter Stage 2 design→build), or is the spec itself not even complete yet
// (INCOMPLETE-SPEC → back to Stage 1/2 to fill the card)?
//
// Pure function over (the 14 synched field values, the per-field evidence the survey skill
// read off the site/repo, the PRE-HARD check results, and the mvp_url status). The route
// fetches + supplies the skill output; this computes. No I/O. Mirrors score.ts deliberately:
//   spec presence  → each of the 14 fields is "present" when its column is non-null and
//                    non-blank (trim<>''). Fewer than 14 present ⇒ INCOMPLETE-SPEC; no further
//                    judgement is meaningful (you can't survey a build against a half-spec).
//   site evidence  → survey_pct = evidenced / 14. A field is "evidenced" only when the skill
//                    cited exact DOM text or a repo path:line for it (no citation ⇒ false).
//                    The build must evidence >= 80% (>= 12/14) to be a RENOVATION.
//   PRE-HARD gate  → P1/P2/P3 must PASS (the same hard-gate-then-rest discipline score.ts
//                    encodes). P4 is recorded + surfaced but does NOT gate the verdict.
//   mvp_url        → no live site (url null / not HTTP 200) ⇒ TEARDOWN regardless of the spec.

export type SurveyVerdict = 'INCOMPLETE-SPEC' | 'TEARDOWN' | 'RENOVATION'

/** The 14 synched fields — flat columns on product_validation_status. icp_partner_type is the
 *  alias of "Prospect Type" (the column is NOT renamed; only its display label differs). */
export type SurveyField =
  | 'promise'
  | 'friction'
  | 'core_mechanism'
  | 'icp_geography'
  | 'icp_partner_type'
  | 'icp_buyer_title'
  | 'icp_verticals'
  | 'icp_company_size'
  | 'icp_stage'
  | 'exclusions'
  | 'distributor'
  | 'distributor_outcomes'
  | 'end_user'
  | 'end_user_outcomes'

export type PreHardCode = 'P1' | 'P2' | 'P3' | 'P4'
export type CheckStatus = 'pass' | 'fail' | 'unknown'

/** The 14 fields, in the plan's field-map order, with display labels. */
export const SURVEY_FIELDS: { field: SurveyField; label: string }[] = [
  { field: 'promise', label: 'Promise' },
  { field: 'friction', label: 'Friction' },
  { field: 'core_mechanism', label: 'Core mechanism' },
  { field: 'icp_geography', label: 'ICP geography' },
  { field: 'icp_partner_type', label: 'Prospect type' }, // alias of "Prospect Type"
  { field: 'icp_buyer_title', label: 'ICP buyer title' },
  { field: 'icp_verticals', label: 'ICP verticals' },
  { field: 'icp_company_size', label: 'ICP company size' },
  { field: 'icp_stage', label: 'ICP stage' },
  { field: 'exclusions', label: 'Exclusions' },
  { field: 'distributor', label: 'Distributor' },
  { field: 'distributor_outcomes', label: 'Distributor outcomes' },
  { field: 'end_user', label: 'End user' },
  { field: 'end_user_outcomes', label: 'End-user outcomes' },
]

export const SURVEY_FIELD_COUNT = SURVEY_FIELDS.length // 14
/** RENOVATION needs the site to evidence >= 80% of the 14 fields. */
export const SURVEY_THRESHOLD = 0.8
/** ceil(0.8 * 14) = 12 — the ">= 12/14" the plan states, kept in lockstep with the ratio. */
export const MIN_EVIDENCED = Math.ceil(SURVEY_THRESHOLD * SURVEY_FIELD_COUNT)
/** PRE-HARD checks that gate the verdict. P4 is informational (surfaced, not gating). */
export const GATING_PRE_HARD: PreHardCode[] = ['P1', 'P2', 'P3']

/** What the survey skill returns per field — a citation, or nothing. No citation ⇒ false. */
export interface FieldEvidence {
  evidenced: boolean
  /** Exact DOM text or repo path:line that evidences the field; null when !evidenced. */
  evidence: string | null
}

export interface PreHardResult {
  code: PreHardCode
  status: CheckStatus
  evidence?: string | null
}

export interface SurveyInput {
  /** The 14 synched column values, as read from product_validation_status. */
  fields: Partial<Record<SurveyField, string | null>>
  /** Per-field evidence the survey skill read off the live site/repo (survey.json fields[]). */
  evidence: Partial<Record<SurveyField, FieldEvidence>>
  /** PRE-HARD results (survey.json pre_hard{}). P1/P2/P3 gate; P4 is informational. */
  preHard: PreHardResult[]
  /** The build's URL (product_validation_status.mvp_url). */
  mvpUrl: string | null
  /** Whether mvpUrl answered HTTP 200 (the loader does the live check; pure here). */
  mvpUrlOk: boolean
}

export interface SurveyFieldResult {
  field: SurveyField
  label: string
  /** Column non-null AND trim<>'' — is the spec field filled at all? */
  present: boolean
  /** Did the live site/repo evidence it (with a citation)? */
  evidenced: boolean
  evidence: string | null
}

export interface SurveyResult {
  verdict: SurveyVerdict
  /** Where the verdict routes the product next (for the panel + the gate reason). */
  nextStage: string
  spec: {
    present: number
    total: number
    /** The fields that are NOT yet filled (drive INCOMPLETE-SPEC). */
    missing: { field: SurveyField; label: string }[]
  }
  site: {
    evidencedCount: number
    total: number
    /** survey_pct, 0–1. */
    pct: number
    /** evidencedCount >= MIN_EVIDENCED (>= 80%). */
    meetsThreshold: boolean
  }
  mvp: { url: string | null; ok: boolean }
  preHard: {
    /** Every gating check (P1/P2/P3) passed. */
    passed: boolean
    results: PreHardResult[]
    /** Gating checks that did not pass (fail OR unknown). */
    failing: PreHardResult[]
  }
  fields: SurveyFieldResult[]
  /** What to fix to reach RENOVATION — missing spec, un-evidenced fields, failing PRE-HARDs. */
  toReach: { code: string; label: string; need: string }[]
}

const isPresent = (v: string | null | undefined): boolean =>
  typeof v === 'string' && v.trim().length > 0

const NEXT_STAGE: Record<SurveyVerdict, string> = {
  'INCOMPLETE-SPEC': 'Stage 1/2 — fill the card (spec incomplete)',
  TEARDOWN: 'Stage 2 — re-enter design→build',
  RENOVATION: 'Stage 5',
}

/**
 * Survey a built product. Pure — no I/O. INCOMPLETE-SPEC short-circuits (you can't judge a
 * build against a half-spec); otherwise the build is RENOVATION only when it clears every
 * forward bar (live site, >= 80% evidenced, P1/P2/P3 pass), else TEARDOWN. This mirrors
 * score.ts's "HARD gate before anything else" shape: spec-presence is the survey's hard gate.
 */
export function survey(input: SurveyInput): SurveyResult {
  const verdictPreHard = latestPreHard(input.preHard)
  const byCode = new Map(verdictPreHard.map((p) => [p.code, p]))

  // Per-field: present (spec filled) + evidenced (site cited it).
  const fields: SurveyFieldResult[] = SURVEY_FIELDS.map(({ field, label }) => {
    const present = isPresent(input.fields[field])
    const ev = input.evidence[field]
    return {
      field,
      label,
      present,
      evidenced: ev?.evidenced ?? false,
      evidence: ev?.evidence ?? null,
    }
  })

  // Spec presence — the survey's hard gate.
  const missing = fields.filter((f) => !f.present).map((f) => ({ field: f.field, label: f.label }))
  const presentCount = SURVEY_FIELD_COUNT - missing.length
  const specComplete = missing.length === 0

  // Site evidence — survey_pct over the 14.
  const evidencedCount = fields.filter((f) => f.evidenced).length
  const pct = evidencedCount / SURVEY_FIELD_COUNT
  const meetsThreshold = evidencedCount >= MIN_EVIDENCED

  // PRE-HARD gate — P1/P2/P3 must pass (unknown blocks, as in score.ts).
  const gating = GATING_PRE_HARD.map(
    (code) => byCode.get(code) ?? ({ code, status: 'unknown' as CheckStatus, evidence: null }),
  )
  const failingPreHard = gating.filter((p) => p.status !== 'pass')
  const preHardPassed = failingPreHard.length === 0

  // mvp_url — a live site is required to call anything a RENOVATION.
  const mvpOk = isPresent(input.mvpUrl) && input.mvpUrlOk

  // Three-door verdict.
  let verdict: SurveyVerdict
  if (!specComplete) {
    verdict = 'INCOMPLETE-SPEC'
  } else if (!mvpOk || !meetsThreshold || !preHardPassed) {
    verdict = 'TEARDOWN'
  } else {
    verdict = 'RENOVATION'
  }

  // What to fix to reach RENOVATION: spec gaps first (they short-circuit), then the live-site
  // requirement, then the un-evidenced fields, then the failing PRE-HARD checks.
  const toReach = [
    ...missing.map((m) => ({
      code: m.field,
      label: m.label,
      need: 'INCOMPLETE-SPEC — fill this field on the card (spec must be complete first)',
    })),
    ...(specComplete && !mvpOk
      ? [
          {
            code: 'mvp_url',
            label: 'Live MVP URL',
            need: input.mvpUrl
              ? `site did not answer HTTP 200 (${input.mvpUrl}) — deploy a reachable build`
              : 'no mvp_url set — the survey judges a specific build, so a live URL is required',
          },
        ]
      : []),
    ...(specComplete
      ? fields
          .filter((f) => !f.evidenced)
          .map((f) => ({
            code: f.field,
            label: f.label,
            need: `not evidenced on the live site/repo — need >= ${MIN_EVIDENCED}/${SURVEY_FIELD_COUNT} (${evidencedCount}/${SURVEY_FIELD_COUNT} now)`,
          }))
      : []),
    ...(specComplete
      ? failingPreHard.map((p) => ({
          code: p.code,
          label: `PRE-HARD ${p.code}`,
          need: `must pass (currently ${p.status})`,
        }))
      : []),
  ]

  return {
    verdict,
    nextStage: NEXT_STAGE[verdict],
    spec: { present: presentCount, total: SURVEY_FIELD_COUNT, missing },
    site: { evidencedCount, total: SURVEY_FIELD_COUNT, pct, meetsThreshold },
    mvp: { url: input.mvpUrl, ok: mvpOk },
    preHard: { passed: preHardPassed, results: verdictPreHard, failing: failingPreHard },
    fields,
    toReach,
  }
}

/** Latest result per PRE-HARD code (dedupe a recency-ordered set, keeping the first seen) —
 *  the PRE-HARD analog of score.ts's latestVerdicts. */
export function latestPreHard(rows: PreHardResult[]): PreHardResult[] {
  const seen = new Set<string>()
  const out: PreHardResult[] = []
  for (const r of rows) {
    if (seen.has(r.code)) continue
    seen.add(r.code)
    out.push(r)
  }
  return out
}

/** A built product is survey-PASSED (clear to Stage 5) only on a RENOVATION verdict —
 *  the survey analog of isMvpReady. */
export function isRenovation(result: SurveyResult | null | undefined): boolean {
  return !!result && result.verdict === 'RENOVATION'
}
