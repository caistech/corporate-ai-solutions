// Gate-1 readiness scorer — the methodology-harness keystone (HARNESS_BUILD_WORKLIST.md #1).
//
// Turns the seeded 45-check rubric (readiness_criteria) + a card's recorded per-check
// verdicts (readiness_results) into a transparent, explainable Gate-1 readiness score — so
// `mvp_ready` becomes harness-PROVEN, not an operator tickbox.
//
// Pure function over (criteria, card.features, latest verdicts). The route fetches; this
// computes. Policy is THIN_MVP_RUBRIC v2 §6:
//   applicability  → a CONDITIONAL-* check is N/A when the card lacks its applies_when feature;
//                    DEFER checks are never scored at Gate 1.
//   HARD gate      → every applicable HARD + CONDITIONAL-HARD check must PASS, else the slice is
//                    not Gate-1-ready and NO weighted score is computed.
//   TOO-MUCH guard → scale-infra present pre-GO is itself a flag (the inverse failure).
//   WEIGHTED score → applicable WEIGHTED + CONDITIONAL-WEIGHTED checks, High/Med/Low → 3/2/1,
//                    normalised to 0–10. Bands GO ≥6.5 / REDESIGN 5.0–6.4 / NO-GO <5.0
//                    (calibrate on the first real run — the tiers are firm, the arithmetic is the knob).

export type Tier =
  | 'HARD'
  | 'CONDITIONAL-HARD'
  | 'WEIGHTED'
  | 'CONDITIONAL-WEIGHTED'
  | 'TOO-MUCH'
  | 'DEFER'

export type Weight = 'High' | 'Med' | 'Low' | null
export type CheckStatus = 'pass' | 'fail' | 'na'
export type ResultSource = 'auto' | 'naive-tester' | 'voice-auditor' | 'judge'
export type Band = 'GO' | 'REDESIGN' | 'NO-GO'

export interface Criterion {
  code: string
  check_label: string
  tier: Tier
  weight: Weight
  method?: string | null
  applies_when: string | null
  notes?: string | null
}

/** A readiness_results row — the latest recorded verdict for a check. */
export interface CheckVerdict {
  check_code: string
  status: CheckStatus
  source: ResultSource
  evidence?: string | null
  scored_at?: string
}

export interface ScoreInput {
  /** The conditional features this product has (voice|auth|supabase|...). */
  features: string[]
  /** The seeded readiness_criteria catalogue. */
  criteria: Criterion[]
  /** readiness_results verdicts (the route passes scored_at-desc; latest-per-code is taken). */
  verdicts: CheckVerdict[]
}

export interface CheckResult {
  code: string
  label: string
  tier: Tier
  weight: Weight
  applicable: boolean
  reason?: string // why N/A (only when !applicable)
  status: CheckStatus | 'unknown' // 'unknown' = applicable but no verdict recorded yet
  source: ResultSource | null
  evidence: string | null
  weightPoints: number // > 0 only for an applicable weighted check
  earned: number // weightPoints when status==='pass', else 0
}

export interface ScoreResult {
  gate1Ready: boolean
  hardGate: {
    passed: boolean
    total: number // applicable HARD + CONDITIONAL-HARD checks
    failing: { code: string; label: string; status: string }[] // fail OR unknown
  }
  tooMuch: {
    flagged: boolean
    checks: { code: string; label: string; evidence: string | null }[]
  }
  score: number | null // 0–10; null until the HARD gate passes (not computed before)
  band: Band | null
  weighted: { earned: number; possible: number }
  checks: CheckResult[] // every criterion, with applicability + status
  toReachGo: { code: string; label: string; need: string }[]
}

const WEIGHT_POINTS: Record<'High' | 'Med' | 'Low', number> = { High: 3, Med: 2, Low: 1 }
const GO_BAND = 6.5
const REDESIGN_BAND = 5.0

const isHardTier = (t: Tier): boolean => t === 'HARD' || t === 'CONDITIONAL-HARD'
const isWeightedTier = (t: Tier): boolean => t === 'WEIGHTED' || t === 'CONDITIONAL-WEIGHTED'

/** Latest verdict per check_code (dedupe a scored_at-desc result set, keeping the first seen). */
export function latestVerdicts(rows: CheckVerdict[]): CheckVerdict[] {
  const seen = new Set<string>()
  const out: CheckVerdict[] = []
  for (const r of rows) {
    if (seen.has(r.check_code)) continue
    seen.add(r.check_code)
    out.push(r)
  }
  return out
}

function applicability(c: Criterion, features: string[]): { applicable: boolean; reason?: string } {
  if (c.tier === 'DEFER') return { applicable: false, reason: 'DEFER — scale-infra, not scored at Gate 1' }
  if (c.applies_when && !features.includes(c.applies_when)) {
    return { applicable: false, reason: `N/A — product has no "${c.applies_when}"` }
  }
  return { applicable: true }
}

function bandFor(score: number): Band {
  if (score >= GO_BAND) return 'GO'
  if (score >= REDESIGN_BAND) return 'REDESIGN'
  return 'NO-GO'
}

/**
 * Score a card's Gate-1 readiness. Pure — no I/O. The HARD gate must pass before a
 * weighted score is reported (score/band stay null otherwise), mirroring the §5
 * dimension-3 hard-gate discipline extended to readiness.
 */
export function scoreCard(input: ScoreInput): ScoreResult {
  const { features, criteria } = input
  const verdicts = latestVerdicts(input.verdicts)
  const byCode = new Map(verdicts.map((v) => [v.check_code, v]))

  const checks: CheckResult[] = criteria.map((c) => {
    const { applicable, reason } = applicability(c, features)
    const v = byCode.get(c.code)
    const status: CheckStatus | 'unknown' = !applicable ? 'na' : v ? v.status : 'unknown'
    const weightPoints = applicable && isWeightedTier(c.tier) && c.weight ? WEIGHT_POINTS[c.weight] : 0
    const earned = status === 'pass' ? weightPoints : 0
    return {
      code: c.code,
      label: c.check_label,
      tier: c.tier,
      weight: c.weight,
      applicable,
      reason,
      status,
      source: v?.source ?? null,
      evidence: v?.evidence ?? null,
      weightPoints,
      earned,
    }
  })

  // HARD gate — every applicable HARD + CONDITIONAL-HARD check must PASS (unknown blocks).
  const hardChecks = checks.filter((c) => c.applicable && isHardTier(c.tier))
  const failing = hardChecks
    .filter((c) => c.status !== 'pass')
    .map((c) => ({ code: c.code, label: c.label, status: c.status }))
  const gate1Ready = failing.length === 0

  // TOO-MUCH — scale-infra present pre-GO is the inverse flag (a 'fail' verdict = present).
  const tooMuchChecks = checks
    .filter((c) => c.applicable && c.tier === 'TOO-MUCH' && c.status === 'fail')
    .map((c) => ({ code: c.code, label: c.label, evidence: c.evidence }))

  // WEIGHTED composite from the applicable weighted checks.
  const weightedChecks = checks.filter((c) => c.applicable && isWeightedTier(c.tier) && c.weightPoints > 0)
  const possible = weightedChecks.reduce((s, c) => s + c.weightPoints, 0)
  const earned = weightedChecks.reduce((s, c) => s + c.earned, 0)
  const rawScore = possible > 0 ? (earned / possible) * 10 : 0

  // The score/band is only meaningful once the HARD gate passes (rubric §6).
  const score = gate1Ready ? Math.round(rawScore * 10) / 10 : null
  const band = gate1Ready ? bandFor(rawScore) : null

  // What to fix to reach GO: failing HARD checks first (must pass), then the
  // highest-weight unmet weighted checks (each lifts the score).
  const toReachGo = [
    ...failing.map((f) => ({
      code: f.code,
      label: f.label,
      need: `HARD — must pass (currently ${f.status})`,
    })),
    ...weightedChecks
      .filter((c) => c.status !== 'pass')
      .sort((a, b) => b.weightPoints - a.weightPoints)
      .map((c) => ({
        code: c.code,
        label: c.label,
        need: `${c.weight} — pass to add ${c.weightPoints} pt${c.weightPoints === 1 ? '' : 's'} (currently ${c.status})`,
      })),
  ]

  return {
    gate1Ready,
    hardGate: { passed: gate1Ready, total: hardChecks.length, failing },
    tooMuch: { flagged: tooMuchChecks.length > 0, checks: tooMuchChecks },
    score,
    band,
    weighted: { earned, possible },
    checks,
    toReachGo,
  }
}
