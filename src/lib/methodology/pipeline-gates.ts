// In-app pipeline_gates ledger — the cockpit's server-side analog of
// cais-shared-services/scripts/gate-check.mjs (which writes the same table from the CLI).
//
// Build #4 phase 1 uses this to record the `office-hours` PASS the moment the pool-discovery
// dialogue lands both pool hypotheses on the card — the long-stubbed office-hours slot, now wired.
// Same table, same shape; an in-app write so the gate is recorded as part of the cockpit flow
// rather than only via the external CLI.

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
  artifactRef?: string | null
  reason?: string | null
  isOverride?: boolean
  recordedBy?: string
}): Promise<void> {
  const supabase = supabaseAdmin()
  const { error } = await supabase.from('pipeline_gates').insert({
    product_slug: opts.slug,
    gate: opts.gate,
    status: opts.status,
    artifact_ref: opts.artifactRef ?? null,
    reason: opts.reason ?? null,
    is_override: opts.isOverride ?? false,
    recorded_by: opts.recordedBy ?? 'cockpit',
  })
  if (error) {
    console.error('[pipeline-gates] recordGate insert failed:', error)
    throw new Error(`recordGate failed: ${error.message}`)
  }
}
