// ⚑ Gate-critical enforcement — make the idea-card's claim true.
//
// The detail page states "a card cannot pass its review gates while [the ⚑ fields]
// are blank." The self-audit (Anneke, 2026-05-27) found the claim wasn't enforced —
// singify reached validation with every ⚑ field blank. This is the single source of
// truth both the PATCH guard (blocks the advance) and the UI badge (shows completeness)
// read, so the claim and the behaviour can't disagree.
//
// Required ⚑ fields vary by build-type (BUSINESS_MODEL §6 / Rule 15):
//   product                  → named demand, build-vs-buy, the distributor, the go/no-go asks
//   infra-product-candidate  → distributor DEFERRED (re-enters the product path later)
//   shared-service           → justified on leverage, not demand (no distributor/demand gate)

export const GATE_CRITICAL_BY_TYPE: Record<string, string[]> = {
  // `distributor` + `end_user_pool` are the TWO research-pool hypotheses (build #4): a product
  // cannot reach validation without BOTH — they are what the dual-stream outreach sources against.
  'product': ['demand_evidence', 'architecture', 'distributor', 'end_user_pool', 'decisions_needed'],
  'infra-product-candidate': ['demand_evidence', 'architecture', 'decisions_needed'],
  'shared-service': ['architecture', 'decisions_needed'],
}

const LABELS: Record<string, string> = {
  demand_evidence: 'Demand evidence',
  architecture: 'Architecture (build vs buy)',
  distributor: 'Distributor pool (who would onsell)',
  end_user_pool: 'End-user pool (who would use)',
  decisions_needed: 'Decisions needed',
}

/** The two research-pool hypothesis fields the dual-stream outreach sources against. */
export const POOL_FIELDS = ['distributor', 'end_user_pool'] as const

/**
 * True when BOTH pool hypotheses are substantively captured on the card — the signal that the
 * phase-1 office-hours pool-discovery dialogue has concluded (used to record the office-hours gate).
 */
export function poolsCaptured(ideaCard: Record<string, string> | null | undefined): boolean {
  const ic = ideaCard ?? {}
  return POOL_FIELDS.every((k) => typeof ic[k] === 'string' && ic[k].trim().length >= MIN_LEN)
}

const STAGE_ORDER = ['ideation', 'feasibility', 'validation', 'go-no-go', 'build', 'ship']

// A field counts as "filled" only if it's substantive — a stray word doesn't clear the
// gate (the "present-but-hand-wavy fails as surely as blank" bar).
const MIN_LEN = 12

export function requiredGateCritical(buildType?: string | null): string[] {
  return GATE_CRITICAL_BY_TYPE[buildType ?? 'product'] ?? GATE_CRITICAL_BY_TYPE['product']
}

export function missingGateCritical(
  buildType: string | null | undefined,
  ideaCard: Record<string, string> | null | undefined,
): string[] {
  const ic = ideaCard ?? {}
  return requiredGateCritical(buildType).filter(
    (k) => !(typeof ic[k] === 'string' && ic[k].trim().length >= MIN_LEN),
  )
}

export function missingLabels(keys: string[]): string[] {
  return keys.map((k) => LABELS[k] ?? k)
}

/** Completeness for the UI badge: filled vs required. */
export function gateCriticalStatus(
  buildType: string | null | undefined,
  ideaCard: Record<string, string> | null | undefined,
): { required: number; filled: number; missing: string[] } {
  const required = requiredGateCritical(buildType)
  const missing = missingGateCritical(buildType, ideaCard)
  return { required: required.length, filled: required.length - missing.length, missing }
}

/** True when the target stage is at validation or beyond — i.e. past the review gates. */
export function advancesPastReview(stage?: string | null): boolean {
  if (!stage) return false
  return STAGE_ORDER.indexOf(stage) >= STAGE_ORDER.indexOf('validation')
}
