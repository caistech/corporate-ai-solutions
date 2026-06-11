/**
 * runCostSync — the shared cost-sync engine, called by BOTH the daily cron
 * (/api/cron/cost-sync) and the operator "Sync now" button (/api/admin/ops/sync).
 *
 * What it does, in order:
 *  1. Supabase per-project discovery + compute-cost estimate (Management API) — auto-creates a
 *     cost_source per project and writes a daily cost_entry.
 *  2. For every ACTIVE cost_source row, dispatch through the provider registry (providers.ts):
 *       - spendUsd  → upsert today's cost_entry (feeds "This Month" / "By Provider")
 *       - balanceUsd → recordBalance (feeds the balance column + low-balance alerts)
 *       - ALWAYS record last_sync_status/detail on the row, so the dashboard shows WHY a source
 *         is/ isn't syncing (ok / key_missing / error / no_api / manual) instead of a silent $0.
 *  3. Evaluate every recorded balance against its threshold and email the admin about low ones.
 *
 * Fail-soft throughout: one provider's outage records an `error` on its row and never aborts the run.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  listProjects as listSupabaseProjects,
  getProjectAddons,
  getProjectUsage,
  getComputeSizeFromAddons,
} from '@/lib/ops/supabase-management'
import { monthlyComputeUsd } from '@/lib/ops/compute-pricing'
import { recordBalance, evaluateLowBalancesAndAlert } from '@/lib/ops/balances'
import { syncProviderData, recordSyncOutcome, getProviderMeta } from '@/lib/ops/providers'

const INTERNAL_ORG_ID = '00000000-0000-0000-0000-000000000001'

function today(): string {
  return new Date().toISOString().split('T')[0]
}

async function syncSupabaseProjects(db: SupabaseClient): Promise<number> {
  if (!process.env.SUPABASE_MANAGEMENT_TOKEN) return 0
  const projects = await listSupabaseProjects()
  const day = today()
  let synced = 0

  for (const project of projects) {
    try {
      const addons = await getProjectAddons(project.ref)
      const computeSize = getComputeSizeFromAddons(addons)
      const estMonthlyUsd = monthlyComputeUsd(computeSize)
      const requests24h = await getProjectUsage(project.ref)

      const { data: existing } = await db
        .from('cost_sources')
        .select('id')
        .eq('source_ref', project.ref)
        .maybeSingle()

      let sourceId = existing?.id as string | undefined
      if (!sourceId) {
        const { data: inserted } = await db
          .from('cost_sources')
          .insert({
            provider: 'supabase',
            source_ref: project.ref,
            name: project.name || project.ref,
            organisation_id: INTERNAL_ORG_ID,
            billing_model: 'fixed',
            fixed_cost_usd: estMonthlyUsd,
            is_active: project.status === 'ACTIVE_HEALTHY',
          } as never)
          .select('id')
          .single()
        sourceId = (inserted as { id: string } | null)?.id
      }

      if (sourceId) {
        await db.from('cost_entries').upsert(
          {
            source_id: sourceId,
            entry_date: day,
            cost_usd: estMonthlyUsd,
            usage_json: { requests: requests24h, compute_size: computeSize },
          } as never,
          { onConflict: 'source_id,entry_date' },
        )
        await recordSyncOutcome(db, sourceId, {
          status: 'ok',
          detail: `compute estimate synced ($${estMonthlyUsd.toFixed(2)}/mo, ${computeSize})`,
        })
        synced++
      }
    } catch (err) {
      console.error(`[run-sync] Supabase project ${project.ref} error:`, err)
    }
  }
  return synced
}

interface SourceRow {
  id: string
  provider: string
}

/** Run the full cost sync. Returns a results summary for the response body. */
export async function runCostSync(db: SupabaseClient): Promise<Record<string, unknown>> {
  const results: Record<string, unknown> = {}
  const day = today()

  // 1. Supabase per-project discovery.
  results.supabase_projects = await syncSupabaseProjects(db)

  // 2. Every active, non-Supabase source through the registry.
  const { data: sources } = await db
    .from('cost_sources')
    .select('id, provider')
    .eq('is_active', true)
    .neq('provider', 'supabase')
    .returns<SourceRow[]>()

  const perProvider: Record<string, string> = {}
  for (const source of sources ?? []) {
    try {
      const outcome = await syncProviderData(source.provider)
      perProvider[source.provider] = outcome.status

      if (typeof outcome.spendUsd === 'number') {
        await db.from('cost_entries').upsert(
          {
            source_id: source.id,
            entry_date: day,
            cost_usd: outcome.spendUsd,
            usage_json: outcome.usage ?? {},
          } as never,
          { onConflict: 'source_id,entry_date' },
        )
      }
      if (typeof outcome.balanceUsd === 'number') {
        await recordBalance(db, {
          provider: source.provider,
          name: getProviderMeta(source.provider).label,
          balanceUsd: outcome.balanceUsd,
          organisationId: INTERNAL_ORG_ID,
        })
      }
      await recordSyncOutcome(db, source.id, outcome)
    } catch (err) {
      console.error(`[run-sync] provider ${source.provider} error:`, err)
      await recordSyncOutcome(db, source.id, {
        status: 'error',
        detail: err instanceof Error ? err.message : 'unexpected sync error',
      })
      perProvider[source.provider] = 'error'
    }
  }
  results.providers = perProvider

  // 3. Low-balance evaluation + alerting across every recorded balance.
  results.low_balance_alerts = await evaluateLowBalancesAndAlert(db)

  return results
}
