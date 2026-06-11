/**
 * Per-product / per-API usage metering — Phase 1 of the smart Cost Dashboard.
 *
 * This is the analytics engine the provider-billing layer (cost_sources/cost_entries) can't be:
 * provider dashboards report a per-provider total but never attribute spend to one of our ~38
 * products. Here, each product reports its own usage (token counts, API calls, characters) via
 * recordUsage(); we resolve the price from model_prices AT WRITE TIME and store the computed
 * cost, so the daily rollup is a trivial SUM and a later price change never rewrites history.
 *
 * The three exports:
 *  - priceForUsage()    — resolve the latest effective USD-per-unit for a provider/model/unit.
 *  - recordUsage()      — price + insert one or many usage events (the product-facing entry point).
 *  - getUsageAnalytics()— server-side sort/filter/aggregate for the dashboard charts.
 *
 * All reads/writes use the SERVICE-ROLE client (usage tables are admin/service-role-only under RLS),
 * so callers pass a service-role SupabaseClient — same contract as lib/ops/sources.ts.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export const INTERNAL_ORG_ID = '00000000-0000-0000-0000-000000000001'

/** A single usage record a product reports. One LLM call typically emits two (input + output). */
export interface UsageEventInput {
  productSlug: string
  provider: string
  /** Specific model / SKU (e.g. claude-opus-4-8). Null/omitted for non-LLM providers. */
  model?: string | null
  /** Logical operation for grouping (e.g. messages, tts, search). */
  api?: string | null
  /** input_tokens | output_tokens | cache_read_tokens | characters | requests | credits | … */
  unitType: string
  units: number
  organisationId?: string | null
  occurredAt?: string
  metadata?: Record<string, unknown>
}

export interface RecordUsageResult {
  inserted: number
  /** Events for which no price was found — recorded with priced=false, cost_usd=null (not $0). */
  unpriced: number
}

/**
 * Latest USD-per-unit in effect on `onDate` for a provider/model/unit_type. Precedence:
 *   1. exact (provider, model, unit_type)
 *   2. provider-wide default (provider, model IS NULL, unit_type)
 * Returns null when nothing matches — the caller records the event as unpriced rather than $0.
 */
export async function priceForUsage(
  db: SupabaseClient,
  provider: string,
  model: string | null,
  unitType: string,
  onDate: string,
): Promise<number | null> {
  const base = db
    .from('model_prices')
    .select('usd_per_unit, model, effective_from')
    .eq('provider', provider.trim().toLowerCase())
    .eq('unit_type', unitType)
    .lte('effective_from', onDate)
    .order('effective_from', { ascending: false })

  const { data, error } = await base
  if (error) {
    console.error('[ops/usage] priceForUsage error:', error)
    return null
  }
  const rows = (data ?? []) as Array<{ usd_per_unit: number; model: string | null }>
  if (rows.length === 0) return null

  // Prefer an exact model match (rows are already newest-first), else a provider-wide default.
  const wanted = model?.trim() ?? null
  const exact = rows.find((r) => r.model === wanted)
  if (exact) return Number(exact.usd_per_unit)
  const generic = rows.find((r) => r.model === null)
  return generic ? Number(generic.usd_per_unit) : null
}

/**
 * Price and insert usage events. The product-facing entry point: a product (or a metered shared
 * client) calls this with one or many events; each is priced from model_prices at its event date
 * and stored with its computed cost. Never throws on a pricing miss — the event is recorded
 * unpriced so the gap is visible in the dashboard, not swallowed as $0.
 */
export async function recordUsage(
  db: SupabaseClient,
  events: UsageEventInput | UsageEventInput[],
): Promise<RecordUsageResult> {
  const list = Array.isArray(events) ? events : [events]
  if (list.length === 0) return { inserted: 0, unpriced: 0 }

  const rows: Record<string, unknown>[] = []
  let unpriced = 0

  for (const e of list) {
    const provider = e.provider.trim().toLowerCase()
    const model = e.model?.trim() || null
    const occurredAt = e.occurredAt ?? new Date().toISOString()
    const onDate = occurredAt.split('T')[0]

    const usdPerUnit = await priceForUsage(db, provider, model, e.unitType, onDate)
    const priced = usdPerUnit !== null
    if (!priced) unpriced++

    rows.push({
      product_slug: e.productSlug.trim().toLowerCase(),
      provider,
      model,
      api: e.api?.trim() || null,
      unit_type: e.unitType,
      units: e.units,
      usd_per_unit: usdPerUnit,
      cost_usd: priced ? Number((e.units * (usdPerUnit as number)).toFixed(6)) : null,
      priced,
      organisation_id: e.organisationId ?? INTERNAL_ORG_ID,
      occurred_at: occurredAt,
      metadata: e.metadata ?? {},
    })
  }

  const { error } = await db.from('usage_events').insert(rows as never)
  if (error) {
    console.error('[ops/usage] recordUsage insert error:', error)
    return { inserted: 0, unpriced }
  }
  return { inserted: rows.length, unpriced }
}

// ── Analytics (dashboard) ────────────────────────────────────────────────────────────────────

export interface UsageFilter {
  from?: string // ISO date (inclusive)
  to?: string // ISO date (inclusive)
  productSlug?: string
  provider?: string
  api?: string
}

export interface UsageRollupRow {
  key: string
  cost_usd: number
  units: number
  events: number
}

export interface UsageAnalytics {
  totalCostUsd: number
  totalEvents: number
  unpricedEvents: number
  byProduct: UsageRollupRow[]
  byApi: UsageRollupRow[]
  daily: Array<{ day: string; cost_usd: number }>
}

interface RawUsageRow {
  product_slug: string
  provider: string
  model: string | null
  api: string | null
  units: number | null
  cost_usd: number | null
  priced: boolean
  occurred_at: string
}

/**
 * Fetch usage in a window and aggregate it for the dashboard — totals, by-product, by-API, and a
 * daily time-series. Filtering (product / provider / API / date range) is applied in the query so
 * the operator can narrow spend to a single product or API. Aggregation is done in TS rather than
 * in SQL so the same filtered fetch feeds every chart in one round trip.
 */
export async function getUsageAnalytics(
  db: SupabaseClient,
  filter: UsageFilter = {},
): Promise<UsageAnalytics> {
  let query = db
    .from('usage_events')
    .select('product_slug, provider, model, api, units, cost_usd, priced, occurred_at')

  if (filter.from) query = query.gte('occurred_at', filter.from)
  if (filter.to) query = query.lte('occurred_at', `${filter.to}T23:59:59.999Z`)
  if (filter.productSlug) query = query.eq('product_slug', filter.productSlug.trim().toLowerCase())
  if (filter.provider) query = query.eq('provider', filter.provider.trim().toLowerCase())
  if (filter.api) query = query.eq('api', filter.api)

  const { data, error } = await query.returns<RawUsageRow[]>()
  if (error) {
    console.error('[ops/usage] getUsageAnalytics error:', error)
    return { totalCostUsd: 0, totalEvents: 0, unpricedEvents: 0, byProduct: [], byApi: [], daily: [] }
  }

  const rows = data ?? []
  const byProduct = new Map<string, UsageRollupRow>()
  const byApi = new Map<string, UsageRollupRow>()
  const byDay = new Map<string, number>()
  let totalCostUsd = 0
  let unpricedEvents = 0

  for (const r of rows) {
    const cost = Number(r.cost_usd ?? 0)
    const units = Number(r.units ?? 0)
    totalCostUsd += cost
    if (!r.priced) unpricedEvents++

    const pKey = r.product_slug
    const p = byProduct.get(pKey) ?? { key: pKey, cost_usd: 0, units: 0, events: 0 }
    p.cost_usd += cost
    p.units += units
    p.events += 1
    byProduct.set(pKey, p)

    const aKey = [r.provider, r.model, r.api].filter(Boolean).join(' · ') || r.provider
    const a = byApi.get(aKey) ?? { key: aKey, cost_usd: 0, units: 0, events: 0 }
    a.cost_usd += cost
    a.units += units
    a.events += 1
    byApi.set(aKey, a)

    const day = r.occurred_at.split('T')[0]
    byDay.set(day, (byDay.get(day) ?? 0) + cost)
  }

  const round = (rollup: UsageRollupRow[]) =>
    rollup
      .map((r) => ({ ...r, cost_usd: Number(r.cost_usd.toFixed(4)) }))
      .sort((a, b) => b.cost_usd - a.cost_usd)

  return {
    totalCostUsd: Number(totalCostUsd.toFixed(4)),
    totalEvents: rows.length,
    unpricedEvents,
    byProduct: round(Array.from(byProduct.values())),
    byApi: round(Array.from(byApi.values())),
    daily: Array.from(byDay.entries())
      .map(([day, cost_usd]) => ({ day, cost_usd: Number(cost_usd.toFixed(4)) }))
      .sort((a, b) => a.day.localeCompare(b.day)),
  }
}
