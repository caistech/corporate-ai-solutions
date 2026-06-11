/**
 * Cost-source + organisation management (full CRUD).
 *
 * The Cost Dashboard lets an operator set up tracking from scratch — add any provider
 * (Anthropic, OpenAI, Unipile, ElevenLabs, …), assign it to an organisation/client, choose
 * its billing model, record a balance + alert threshold, then edit or retire it later. This
 * module is the data layer for that; the /api/admin/ops/sources + /orgs routes wrap it with
 * operator auth. All reads/writes run with the SERVICE-ROLE client (cost tables are
 * admin/service-role-only under RLS), so callers must pass a service-role SupabaseClient.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  getProviderMeta,
  providerHasKey,
  type SyncCapability,
  type SyncStatus,
} from '@/lib/ops/providers'

export const INTERNAL_ORG_ID = '00000000-0000-0000-0000-000000000001'

export const BILLING_MODELS = ['fixed', 'per-use', 'tiered'] as const
export type BillingModel = (typeof BILLING_MODELS)[number]

export interface CostSource {
  id: string
  provider: string
  name: string
  source_ref: string | null
  organisation_id: string | null
  organisation_name: string | null
  billing_model: BillingModel | null
  fixed_cost_usd: number | null
  balance_usd: number | null
  alert_threshold_usd: number | null
  balance_updated_at: string | null
  is_active: boolean
  notes: string | null
  created_at: string
  // Auto-sync surface (billing_url is a per-source override of the registry default).
  billing_url: string | null
  last_sync_at: string | null
  last_sync_status: SyncStatus | null
  last_sync_detail: string | null
  // Derived (server-side) from the provider registry — never persisted.
  capability: SyncCapability
  auto_capable: boolean
  key_configured: boolean
  effective_billing_url: string | null
}

export interface Organisation {
  id: string
  name: string
  type: 'internal' | 'client' | 'partner'
  fixed_mrr_usd: number | null
  status: 'active' | 'paused' | 'archived'
}

/** Fields an operator may set when creating a source. */
export interface SourceInput {
  provider: string
  name: string
  organisation_id?: string | null
  billing_model?: BillingModel
  fixed_cost_usd?: number | null
  balance_usd?: number | null
  alert_threshold_usd?: number | null
  source_ref?: string | null
  notes?: string | null
  billing_url?: string | null
  is_active?: boolean
}

export async function listSources(db: SupabaseClient): Promise<CostSource[]> {
  const { data, error } = await db
    .from('cost_sources')
    .select(
      'id, provider, name, source_ref, organisation_id, billing_model, fixed_cost_usd, balance_usd, alert_threshold_usd, balance_updated_at, is_active, notes, created_at, billing_url, last_sync_at, last_sync_status, last_sync_detail, organisations(name)',
    )
    .order('is_active', { ascending: false })
    .order('provider', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('[ops/sources] listSources error:', error)
    return []
  }
  return (data ?? []).map((r) => {
    const org = (r as { organisations?: { name?: string } | null }).organisations
    const meta = getProviderMeta(r.provider as string)
    const billingOverride = (r.billing_url as string | null) ?? null
    return {
      id: r.id as string,
      provider: r.provider as string,
      name: r.name as string,
      source_ref: (r.source_ref as string | null) ?? null,
      organisation_id: (r.organisation_id as string | null) ?? null,
      organisation_name: org?.name ?? null,
      billing_model: (r.billing_model as BillingModel | null) ?? null,
      fixed_cost_usd: r.fixed_cost_usd as number | null,
      balance_usd: r.balance_usd as number | null,
      alert_threshold_usd: r.alert_threshold_usd as number | null,
      balance_updated_at: (r.balance_updated_at as string | null) ?? null,
      is_active: Boolean(r.is_active),
      notes: (r.notes as string | null) ?? null,
      created_at: r.created_at as string,
      billing_url: billingOverride,
      last_sync_at: (r.last_sync_at as string | null) ?? null,
      last_sync_status: (r.last_sync_status as SyncStatus | null) ?? null,
      last_sync_detail: (r.last_sync_detail as string | null) ?? null,
      capability: meta.capability,
      auto_capable: meta.capability !== 'none',
      key_configured: providerHasKey(meta),
      effective_billing_url: billingOverride ?? meta.billingUrl,
    }
  })
}

export async function listOrganisations(db: SupabaseClient): Promise<Organisation[]> {
  const { data, error } = await db
    .from('organisations')
    .select('id, name, type, fixed_mrr_usd, status')
    .order('type', { ascending: true })
    .order('name', { ascending: true })
  if (error) {
    console.error('[ops/sources] listOrganisations error:', error)
    return []
  }
  return (data ?? []) as Organisation[]
}

export async function createSource(
  db: SupabaseClient,
  input: SourceInput,
): Promise<{ id: string } | { error: string }> {
  const row: Record<string, unknown> = {
    provider: input.provider.trim().toLowerCase(),
    name: input.name.trim(),
    organisation_id: input.organisation_id ?? INTERNAL_ORG_ID,
    billing_model: input.billing_model ?? 'per-use',
    is_active: input.is_active ?? true,
  }
  if (input.fixed_cost_usd != null) row.fixed_cost_usd = input.fixed_cost_usd
  if (input.balance_usd != null) {
    row.balance_usd = input.balance_usd
    row.balance_updated_at = new Date().toISOString()
  }
  if (input.alert_threshold_usd != null) row.alert_threshold_usd = input.alert_threshold_usd
  if (input.source_ref) row.source_ref = input.source_ref.trim()
  if (input.notes) row.notes = input.notes.trim()
  if (input.billing_url) row.billing_url = input.billing_url.trim()

  const { data, error } = await db.from('cost_sources').insert(row as never).select('id').single()
  if (error) {
    console.error('[ops/sources] createSource error:', error)
    return { error: error.message }
  }
  return { id: (data as { id: string }).id }
}

export async function updateSource(
  db: SupabaseClient,
  id: string,
  patch: Partial<SourceInput>,
): Promise<{ id: string } | { error: string }> {
  const row: Record<string, unknown> = {}
  if (patch.provider !== undefined) row.provider = patch.provider.trim().toLowerCase()
  if (patch.name !== undefined) row.name = patch.name.trim()
  if (patch.organisation_id !== undefined) row.organisation_id = patch.organisation_id
  if (patch.billing_model !== undefined) row.billing_model = patch.billing_model
  if (patch.fixed_cost_usd !== undefined) row.fixed_cost_usd = patch.fixed_cost_usd
  if (patch.alert_threshold_usd !== undefined) row.alert_threshold_usd = patch.alert_threshold_usd
  if (patch.source_ref !== undefined) row.source_ref = patch.source_ref?.trim() || null
  if (patch.notes !== undefined) row.notes = patch.notes?.trim() || null
  if (patch.billing_url !== undefined) row.billing_url = patch.billing_url?.trim() || null
  if (patch.is_active !== undefined) row.is_active = patch.is_active
  if (patch.balance_usd !== undefined) {
    row.balance_usd = patch.balance_usd
    row.balance_updated_at = new Date().toISOString()
    // Clear the low-balance alert latch when the balance is back at/above the threshold so a
    // recovered source can re-alert if it drops again. Uses the patched threshold if provided,
    // else leaves the latch alone (the cron re-evaluates against the stored threshold).
    if (patch.balance_usd != null && patch.alert_threshold_usd != null && patch.balance_usd >= patch.alert_threshold_usd) {
      row.low_balance_alerted_at = null
    }
  }

  if (Object.keys(row).length === 0) return { error: 'No fields to update' }

  const { data, error } = await db
    .from('cost_sources')
    .update(row as never)
    .eq('id', id)
    .select('id')
    .single()
  if (error) {
    console.error('[ops/sources] updateSource error:', error)
    return { error: error.message }
  }
  return { id: (data as { id: string }).id }
}

export async function deleteSource(db: SupabaseClient, id: string): Promise<{ error?: string }> {
  const { error } = await db.from('cost_sources').delete().eq('id', id)
  if (error) {
    console.error('[ops/sources] deleteSource error:', error)
    return { error: error.message }
  }
  return {}
}

export async function createOrganisation(
  db: SupabaseClient,
  input: { name: string; type?: Organisation['type']; fixed_mrr_usd?: number | null },
): Promise<{ id: string } | { error: string }> {
  const row: Record<string, unknown> = {
    name: input.name.trim(),
    type: input.type ?? 'client',
    status: 'active',
  }
  if (input.fixed_mrr_usd != null) row.fixed_mrr_usd = input.fixed_mrr_usd
  const { data, error } = await db.from('organisations').insert(row as never).select('id').single()
  if (error) {
    console.error('[ops/sources] createOrganisation error:', error)
    return { error: error.message }
  }
  return { id: (data as { id: string }).id }
}
