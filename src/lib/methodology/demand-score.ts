// §5 demand scorer — Build #3 of the methodology harness (HARNESS_BUILD_WORKLIST.md #3).
//
// PRE-STAGED logic-first (like #1's score.ts was): this is the pure §5 five-dimension demand
// rubric from BUSINESS_MODEL.md §5. It is NOT yet wired to a route/UI — that wiring (the
// evidence-proposed triage + Gate-2 decision) depends on Build #4's pool-discovery + real
// two-stream interview evidence flowing. This module is testable today on mock evidence so it's
// proven and ready to wire the moment evidence flows.
//
// Distinct from score.ts: that scores Gate-1 *readiness* ("is the thin MVP ready to send?").
// THIS scores Gate-2 *demand* ("did the validation come back GO?") from the two interview streams.
//
// Policy (BUSINESS_MODEL.md §5), applied uniformly by the machine — not per-product gut calls:
//   Five dimensions, scored 0–10, TWICE with the same rubric:
//     - 'hypothesis' mode — desk research by the ideation agent at stage 1 (confidence-flagged).
//     - 'evidence' mode   — the two interview streams at the stage-4 go/no-go.
//   A. End-user demand:        (1) pain severity      (2) market gap strength
//   B. Distribution leverage:  (3) distributor onsell opportunity  ← HARD GATE
//   C. Economics:              (4) reachable market size  (5) factory build-fit
//   Decision logic:
//     - Dimension 3 (onsell) is a HARD GATE: score < 5 → default NO-GO, with a personal-interest
//       override lane (Dennis can greenlight a passion/strategic bet — the kira/storyverse lane).
//     - The other four → weighted composite (Pain 30 / Gap 20 / Reach 25 / Build-fit 25 → 0–10).
//     - Bands: GO ≥ 6.5 / REDESIGN 5.0–6.4 / NO-GO < 5.0.
//   Missing evidence is never silently N/A (engine policy, SCORING_ENGINE_OPEN_QUESTIONS knob 3):
//     an absent dimension counts as 0 (fail / gate-fail) — prove, don't assume.

export type DemandBand = 'GO' | 'REDESIGN' | 'NO-GO'
export type ScoringMode = 'hypothesis' | 'evidence'
export type Confidence = 'high' | 'medium' | 'low'

/** The five §5 dimensions. `onsell` is the hard gate; the other four are weighted. */
export type DimensionKey = 'pain' | 'gap' | 'onsell' | 'reach' | 'build_fit'

export interface DimensionInput {
  key: DimensionKey
  /** 0–10. Clamped. An absent dimension is treated as 0 (prove, don't assume). */
  score: number
  /** Flagged in hypothesis mode (desk research); informational in evidence mode. */
  confidence?: Confidence
  rationale?: string | null
}

export interface DemandScoreInput {
  mode: ScoringMode
  dimensions: DimensionInput[]
  /** The §5 personal-interest override lane — bypasses the onsell gate with a logged reason. */
  personalInterestOverride?: { reason: string } | null
}

export interface DimensionResult {
  key: DimensionKey
  label: string
  score: number // 0–10, clamped
  weight: number // % weight in the composite (0 for the onsell gate)
  /** score × weight/100 — this dimension's points toward the 0–10 composite (0 for onsell). */
  contribution: number
  confidence: Confidence | null
  rationale: string | null
  /** true when no dimension was supplied for this key (counted as 0). */
  missing: boolean
}

export interface DemandScoreResult {
  mode: ScoringMode
  gate: {
    dimension: 'onsell'
    score: number
    threshold: number
    /** true when onsell ≥ threshold OR the personal-interest override is set. */
    passed: boolean
    overridden: boolean
    overrideReason: string | null
  }
  /** 0–10 weighted composite of the four non-gate dimensions. Always computed (for transparency). */
  composite: number
  /** The verdict. Forced NO-GO when the onsell gate fails and is not overridden. */
  band: DemandBand
  dimensions: DimensionResult[]
  /** In hypothesis mode, the weakest confidence among supplied dimensions (the desk-research caveat). */
  lowestConfidence: Confidence | null
  /** Biggest levers to reach GO: the gate first (if failing), then highest weight×deficit dims. */
  toReachGo: { key: DimensionKey; label: string; need: string }[]
}

const DIMENSION_LABELS: Record<DimensionKey, string> = {
  pain: 'Pain severity',
  gap: 'Market gap strength',
  onsell: 'Distributor onsell opportunity',
  reach: 'Reachable market size',
  build_fit: 'Factory build-fit',
}

/** §5 weights — the four non-gate dimensions sum to 100. onsell is the gate, not weighted. */
const DIMENSION_WEIGHTS: Record<DimensionKey, number> = {
  pain: 30,
  gap: 20,
  onsell: 0,
  reach: 25,
  build_fit: 25,
}

const ONSELL_GATE = 5 // D3 ≥ 5, else default NO-GO (§5)
const GO_BAND = 6.5
const REDESIGN_BAND = 5.0

const ALL_KEYS: DimensionKey[] = ['pain', 'gap', 'onsell', 'reach', 'build_fit']
const CONFIDENCE_RANK: Record<Confidence, number> = { low: 0, medium: 1, high: 2 }

const clamp10 = (n: number): number => (Number.isFinite(n) ? Math.max(0, Math.min(10, n)) : 0)

function bandFor(composite: number): DemandBand {
  if (composite >= GO_BAND) return 'GO'
  if (composite >= REDESIGN_BAND) return 'REDESIGN'
  return 'NO-GO'
}

/** Demand verdict is GO — both the onsell gate cleared (or overridden) and the composite reached GO. */
export function isDemandGo(result: DemandScoreResult | null | undefined): boolean {
  return !!result && result.band === 'GO'
}

/**
 * Score a product's §5 demand. Pure — no I/O. Scores the same rubric in either mode; the caller
 * runs it as hypotheses at stage 1 and again as evidence at the stage-4 go/no-go.
 *
 * The onsell gate is evaluated first (mirroring §5 dimension-3): a sub-threshold onsell forces
 * NO-GO unless the personal-interest override is supplied. The composite is always computed so the
 * card shows *why* — a strong product killed only by no distributor reads differently from a weak one.
 */
export function scoreDemand(input: DemandScoreInput): DemandScoreResult {
  const supplied = new Map(input.dimensions.map((d) => [d.key, d]))

  const dimensions: DimensionResult[] = ALL_KEYS.map((key) => {
    const d = supplied.get(key)
    const weight = DIMENSION_WEIGHTS[key]
    const score = d ? clamp10(d.score) : 0
    return {
      key,
      label: DIMENSION_LABELS[key],
      score,
      weight,
      contribution: Math.round(((score * weight) / 100) * 100) / 100,
      confidence: d?.confidence ?? null,
      rationale: d?.rationale ?? (d ? null : 'no evidence recorded — counted as 0'),
      missing: !d,
    }
  })

  // The onsell gate (dimension 3).
  const onsell = dimensions.find((x) => x.key === 'onsell')!
  const overrideReason = input.personalInterestOverride?.reason?.trim() || null
  const overridden = Boolean(overrideReason)
  const gatePassed = onsell.score >= ONSELL_GATE || overridden

  // Weighted composite of the four non-gate dimensions (weights sum to 100 → 0–10 directly).
  const rawComposite = dimensions
    .filter((x) => x.key !== 'onsell')
    .reduce((s, x) => s + (x.score * x.weight) / 100, 0)
  const composite = Math.round(rawComposite * 10) / 10

  // §5: no credible distributor → default NO-GO. The composite band applies only once the gate clears.
  const band: DemandBand = gatePassed ? bandFor(rawComposite) : 'NO-GO'

  // Lowest confidence among SUPPLIED dimensions (the hypothesis-mode desk-research caveat).
  const confidences = dimensions
    .filter((x) => !x.missing && x.confidence)
    .map((x) => x.confidence as Confidence)
  const lowestConfidence = confidences.length
    ? confidences.reduce((lo, c) => (CONFIDENCE_RANK[c] < CONFIDENCE_RANK[lo] ? c : lo), confidences[0])
    : null

  // Biggest levers to reach GO: the gate first (if failing + not overridden), then the
  // non-gate dimensions ranked by weight×deficit (the most composite points unlocked).
  const toReachGo: DemandScoreResult['toReachGo'] = []
  if (!gatePassed) {
    toReachGo.push({
      key: 'onsell',
      label: onsell.label,
      need: `HARD GATE — onsell must reach ${ONSELL_GATE}/10 (currently ${onsell.score}); or apply the personal-interest override`,
    })
  }
  dimensions
    .filter((x) => x.key !== 'onsell' && x.score < 10)
    .map((x) => ({ x, lever: ((10 - x.score) * x.weight) / 100 }))
    .sort((a, b) => b.lever - a.lever)
    .forEach(({ x, lever }) => {
      toReachGo.push({
        key: x.key,
        label: x.label,
        need: `weight ${x.weight}% — currently ${x.score}/10; raising to 10 adds +${Math.round(lever * 10) / 10} to the composite`,
      })
    })

  return {
    mode: input.mode,
    gate: {
      dimension: 'onsell',
      score: onsell.score,
      threshold: ONSELL_GATE,
      passed: gatePassed,
      overridden,
      overrideReason,
    },
    composite,
    band,
    dimensions,
    lowestConfidence,
    toReachGo,
  }
}
