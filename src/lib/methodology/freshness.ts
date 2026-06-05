// Per-check verdict freshness — the truthful-card half of the re-score loop.
//
// readiness_results carries scored_at + deployment_id (no commit_sha —
// 20260527000000_readiness_scoring.sql:43). deployment_id is the freshness key: for
// every APPLICABLE check (the SAME applies_when/features rule scoreCard uses —
// score.ts:110-116) we compare its latest verdict's deployment_id against a reference
// deployment:
//   current  — the verdict was scored against the reference deploy.
//   stale    — the verdict was scored against a DIFFERENT (older) deploy than the
//              reference — i.e. a newer deploy exists than this check was scored on.
//   missing  — applicable but never scored.
//   unknown  — no reference deploy is known (nothing stamps a deployment_id yet), so
//              "newer-than" cannot be decided; a scored check is left 'unknown' rather
//              than falsely 'current'.
//
// The reference deploy is the caller's post-fix deploymentId when supplied (the
// re-score path), else the deployment_id of the product's most-recently-scored verdict
// (the card-render path) — the best self-contained "what deploy are we on" proxy until
// a live deploy feed exists.

import { supabaseAdmin } from '@/lib/supabase'

export type Freshness = 'current' | 'stale' | 'missing' | 'unknown'

export interface CheckFreshness {
  code: string
  freshness: Freshness
  status: 'pass' | 'fail' | 'na' | 'unknown'
  source: string | null
  deploymentId: string | null
  scoredAt: string | null
}

export interface CardFreshness {
  referenceDeploymentId: string | null
  summary: { current: number; stale: number; missing: number; unknown: number }
  /** True when an applicable check is scored against a deploy older than the reference. */
  hasStale: boolean
  checks: CheckFreshness[]
}

interface ResultRow {
  check_code: string
  status: string
  source: string
  deployment_id: string | null
  scored_at: string
}

interface CriterionRow {
  code: string
  tier: string
  applies_when: string | null
}

/** Mirror of score.ts:110-116 applicability (kept local so freshness never drifts from scoring). */
function isApplicable(tier: string, appliesWhen: string | null, features: string[]): boolean {
  if (tier === 'DEFER') return false
  if (appliesWhen && !features.includes(appliesWhen)) return false
  return true
}

export async function loadCardFreshness(
  slug: string,
  referenceDeploymentId?: string | null,
): Promise<CardFreshness> {
  const supabase = supabaseAdmin()

  const { data: card } = await supabase
    .from('methodology_hypothesis_cards')
    .select('features')
    .eq('product_slug', slug)
    .maybeSingle()
  const features: string[] = (card?.features as string[] | null) ?? []

  const [{ data: criteria }, { data: results }] = await Promise.all([
    supabase
      .from('readiness_criteria')
      .select('code, tier, applies_when')
      .order('sort_order', { ascending: true }),
    supabase
      .from('readiness_results')
      .select('check_code, status, source, deployment_id, scored_at')
      .eq('product_slug', slug)
      .order('scored_at', { ascending: false }),
  ])

  const rows = (results ?? []) as ResultRow[]

  // Latest verdict per check (rows are scored_at-desc; first seen wins).
  const latest = new Map<string, ResultRow>()
  for (const r of rows) {
    if (!latest.has(r.check_code)) latest.set(r.check_code, r)
  }

  // Reference deploy: caller-supplied, else the newest verdict carrying a deployment_id.
  let reference: string | null = referenceDeploymentId ?? null
  if (reference == null) {
    for (const r of rows) {
      if (r.deployment_id) {
        reference = r.deployment_id
        break
      }
    }
  }

  const checks: CheckFreshness[] = []
  for (const c of (criteria ?? []) as CriterionRow[]) {
    if (!isApplicable(c.tier, c.applies_when, features)) continue
    const v = latest.get(c.code)

    let freshness: Freshness
    if (!v) freshness = 'missing'
    else if (reference == null) freshness = 'unknown'
    else if (v.deployment_id === reference) freshness = 'current'
    else freshness = 'stale'

    checks.push({
      code: c.code,
      freshness,
      status: (v?.status as CheckFreshness['status']) ?? 'unknown',
      source: v?.source ?? null,
      deploymentId: v?.deployment_id ?? null,
      scoredAt: v?.scored_at ?? null,
    })
  }

  const summary = { current: 0, stale: 0, missing: 0, unknown: 0 }
  for (const c of checks) summary[c.freshness]++

  return {
    referenceDeploymentId: reference,
    summary,
    hasStale: summary.stale > 0,
    checks,
  }
}
