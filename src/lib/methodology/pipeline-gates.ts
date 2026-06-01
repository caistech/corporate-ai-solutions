// In-app pipeline_gates ledger — the cockpit's server-side analog of
// cais-shared-services/scripts/gate-check.mjs (which writes the same table from the CLI).
//
// Build #4 phase 1 uses this to record the `office-hours` PASS the moment the pool-discovery
// dialogue lands both pool hypotheses on the card — the long-stubbed office-hours slot, now wired.
// Same table, same shape; an in-app write so the gate is recorded as part of the cockpit flow
// rather than only via the external CLI.
//
// Deployment binding (plan §3 edit #2): like the CLI's recordGate, this now accepts an optional
// deploymentId and writes it to deployment_id. Resolution stays in the CLI (gate-check.mjs
// `prod-deployment <slug>` / getLiveProductionDeployment) per §2.4 — the web app never calls
// Vercel; it only PERSISTS an id a caller hands it. Omit it (e.g. a cockpit button) → null →
// unbound/provisional, exactly the prior behaviour. Pass it (e.g. the survey skill, which fetches
// the live id first) → the gate is bound to that build (Delta 2).

import { supabaseAdmin } from '@/lib/supabase'

export type GateName =
  | 'office-hours'
  | 'ceo-review'
  | 'eng-review'
  | 'design-review'
  | 'gate-1'
  | 'gate-2'
  | 'naive-tester'
  | 'provisioned'
  | 'survey'

/** Latest record for (slug, gate) — true when the most recent one is a PASS. */
export async function hasPassedGate(slug: string, gate: GateName): Promise<boolean> {
  const supabase = supabaseAdmin()
  const { data, error } = await supabase
    .from('pipeline_gates')
    .select('status')
    .eq('product_slug', slug)
    .eq('gate', gate)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) {
    console.error('[pipeline-gates] hasPassedGate read failed:', error)
    return false
  }
  return data?.status === 'pass'
}

export async function recordGate(opts: {
  slug: string
  gate: GateName
  status: 'pass' | 'fail'
  /** Deployment this verdict judges (Delta 2). null/omitted → unbound/provisional. */
  deploymentId?: string | null
  artifactRef?: string | null
  reason?: string | null
  /** Full structured verdict (SurveyResult etc.) persisted to the `result` jsonb column so
   *  consumers can render per-field evidence + remediation, not just the one-line reason. */
  result?: unknown
  isOverride?: boolean
  recordedBy?: string
}): Promise<void> {
  const supabase = supabaseAdmin()
  const { error } = await supabase.from('pipeline_gates').insert({
    product_slug: opts.slug,
    gate: opts.gate,
    status: opts.status,
    deployment_id: opts.deploymentId ?? null,
    artifact_ref: opts.artifactRef ?? null,
    reason: opts.reason ?? null,
    result: opts.result ?? null,
    is_override: opts.isOverride ?? false,
    recorded_by: opts.recordedBy ?? 'cockpit',
  })
  if (error) {
    console.error('[pipeline-gates] recordGate insert failed:', error)
    throw new Error(`recordGate failed: ${error.message}`)
  }
}