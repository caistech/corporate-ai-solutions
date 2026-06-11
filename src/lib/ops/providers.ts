/**
 * Provider registry — the SINGLE source of truth for which cost-source providers can auto-sync,
 * which Vercel env var holds their (read-only) key, what kind of data we can pull, and where the
 * operator goes to read/refresh a balance by hand.
 *
 * The cost dashboard's "auto vs manual" split flows entirely from this table:
 *  - capability 'balance' | 'usage' | 'compute' → the daily cron / "Sync now" can pull a number.
 *  - capability 'none'                          → the provider exposes no usage/balance API, so the
 *                                                  operator records the balance/spend by hand (the
 *                                                  "excellent manual" path). billingUrl deep-links
 *                                                  straight to their console so it's two clicks.
 *
 * Keys live in Vercel SENSITIVE env vars, one per provider (portfolio standard — never in the DB).
 * A provider with an envVar that isn't set in the environment surfaces as `key_missing`, NOT a
 * silent $0 — see syncProviderData() + the last_sync_status column.
 *
 * Reality check (2026-06-11): only OpenRouter (balance), Anthropic (cost, ADMIN key), and Supabase
 * (compute estimate) genuinely produce a number from an API. Everything else is manual — several
 * (Brave, Hunter, Unipile, Resend, ElevenLabs-cost) expose no USD cost/balance endpoint at all.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { getOpenRouterBalance } from '@/lib/ops/balances'

export type SyncCapability = 'balance' | 'usage' | 'compute' | 'none'
export type SyncStatus = 'ok' | 'key_missing' | 'error' | 'no_api' | 'manual'

export interface ProviderMeta {
  slug: string
  label: string
  /** Vercel env var holding the provider's read key, or null when there is no usable API. */
  envVar: string | null
  capability: SyncCapability
  /** Deep link to the provider's billing/usage console for fast manual balance refresh. */
  billingUrl: string | null
  /** Extra note shown when the key is missing (e.g. "needs an admin-scoped key"). */
  keyNote?: string
}

export interface SyncOutcome {
  status: SyncStatus
  detail: string
  balanceUsd?: number
  spendUsd?: number
  usage?: Record<string, unknown>
}

export const PROVIDER_REGISTRY: Record<string, ProviderMeta> = {
  openrouter: {
    slug: 'openrouter',
    label: 'OpenRouter',
    envVar: 'OPENROUTER_API_KEY',
    capability: 'balance',
    billingUrl: 'https://openrouter.ai/credits',
  },
  // Anthropic spend can only be pulled via the org-level Admin Cost API (an Admin key,
  // sk-ant-admin…), which INDIVIDUAL orgs cannot provision — so for a single-operator account
  // it's manual. The Console Cost page already shows per-key USD spend; record it by hand.
  // (If this account ever becomes a team org, flip capability→'usage', envVar→'ANTHROPIC_ADMIN_KEY'
  //  and the cost_report adapter in syncProviderData() takes over.)
  anthropic: {
    slug: 'anthropic',
    label: 'Anthropic (Claude API)',
    envVar: null,
    capability: 'none',
    billingUrl: 'https://console.anthropic.com/cost',
    keyNote:
      'spend auto-sync needs the org-level Admin Cost API (an Admin key), which individual orgs can’t provision — record spend by hand from the Console Cost page',
  },
  supabase: {
    slug: 'supabase',
    label: 'Supabase',
    envVar: 'SUPABASE_MANAGEMENT_TOKEN',
    capability: 'compute',
    billingUrl: 'https://supabase.com/dashboard/org/_/billing',
  },
  // ── Manual: no usable USD cost/balance API. billingUrl makes the manual refresh two clicks. ──
  openai: {
    slug: 'openai',
    label: 'OpenAI API',
    envVar: null,
    capability: 'none',
    billingUrl: 'https://platform.openai.com/usage',
    keyNote: 'usage needs an admin key + the org usage API; record spend manually for now',
  },
  elevenlabs: {
    slug: 'elevenlabs',
    label: 'ElevenLabs (voice)',
    envVar: null,
    capability: 'none',
    billingUrl: 'https://elevenlabs.io/app/usage',
    keyNote: 'exposes character usage but no USD cost — record spend manually',
  },
  resend: {
    slug: 'resend',
    label: 'Resend (email)',
    envVar: null,
    capability: 'none',
    billingUrl: 'https://resend.com/settings/billing',
  },
  brave: {
    slug: 'brave',
    label: 'Brave Search',
    envVar: null,
    capability: 'none',
    billingUrl: 'https://api-dashboard.search.brave.com/app/subscriptions',
  },
  hunter: {
    slug: 'hunter',
    label: 'Hunter (email finder)',
    envVar: null,
    capability: 'none',
    billingUrl: 'https://hunter.io/dashboard',
  },
  unipile: {
    slug: 'unipile',
    label: 'Unipile (LinkedIn/email)',
    envVar: null,
    capability: 'none',
    billingUrl: 'https://www.unipile.com/',
  },
  ingest: {
    slug: 'ingest',
    label: 'Ingest (doc/drawing OCR)',
    envVar: null,
    capability: 'none',
    billingUrl: null,
  },
  'open-code-zen': {
    slug: 'open-code-zen',
    label: 'Open Code Zen',
    envVar: null,
    capability: 'none',
    billingUrl: null,
  },
}

/** Metadata for a provider slug, with a safe default (manual, no key) for unknown providers. */
export function getProviderMeta(provider: string): ProviderMeta {
  const key = provider.trim().toLowerCase()
  return (
    PROVIDER_REGISTRY[key] ?? {
      slug: key,
      label: provider,
      envVar: null,
      capability: 'none',
      billingUrl: null,
    }
  )
}

/** True when the provider has a configured env var AND it is present in this environment. */
export function providerHasKey(meta: ProviderMeta): boolean {
  return Boolean(meta.envVar && process.env[meta.envVar])
}

/** Whether this provider can ever auto-sync (has an adapter + a usable API). */
export function providerIsAuto(meta: ProviderMeta): boolean {
  return meta.capability !== 'none'
}

const ANTHROPIC_COST_API = 'https://api.anthropic.com/v1/organizations/cost_report'

/**
 * Month-to-date Anthropic spend in USD via the Admin Cost API. Requires an ADMIN key
 * (sk-ant-admin…). Cost amounts come back as decimal strings in CENTS, so we sum and /100.
 */
async function getAnthropicMonthlyCost(adminKey: string): Promise<SyncOutcome> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const url = `${ANTHROPIC_COST_API}?starting_at=${encodeURIComponent(startOfMonth)}&ending_at=${encodeURIComponent(now.toISOString())}`

  let res: Response
  try {
    res = await fetch(url, {
      headers: { 'x-api-key': adminKey, 'anthropic-version': '2023-06-01' },
    })
  } catch (err) {
    console.error('[providers] anthropic cost fetch error:', err)
    return { status: 'error', detail: 'network error reaching the Anthropic cost API' }
  }

  if (res.status === 401 || res.status === 403) {
    return {
      status: 'error',
      detail: `HTTP ${res.status} — the key is not an Admin key (sk-ant-admin…) or lacks org access`,
    }
  }
  if (!res.ok) {
    return { status: 'error', detail: `Anthropic cost API returned HTTP ${res.status}` }
  }

  const data = await res.json().catch(() => null)
  const buckets = (data?.data ?? []) as Array<{ results?: Array<{ amount?: unknown }> }>
  let cents = 0
  for (const bucket of buckets) {
    for (const r of bucket.results ?? []) {
      const amount = Number(r.amount)
      if (Number.isFinite(amount)) cents += amount
    }
  }
  const spendUsd = Math.round(cents) / 100
  return {
    status: 'ok',
    detail: `month-to-date spend synced ($${spendUsd.toFixed(2)})`,
    spendUsd,
    usage: { cost_cents: cents },
  }
}

/** Remaining OpenRouter credit balance as a sync outcome. */
async function getOpenRouterOutcome(): Promise<SyncOutcome> {
  const balanceUsd = await getOpenRouterBalance()
  if (balanceUsd === null) {
    return { status: 'error', detail: 'OpenRouter /credits returned no usable balance' }
  }
  return { status: 'ok', detail: `balance synced ($${balanceUsd.toFixed(2)})`, balanceUsd }
}

/**
 * Pull live data for a single provider, honouring the registry. Returns a SyncOutcome the caller
 * records on the cost_source row (last_sync_status / detail). Never throws — adapters fail soft so
 * one provider's outage can't abort a whole sync run.
 *
 * Note: Supabase is NOT handled here — its cost is per-project and auto-discovered by the cron's
 * dedicated syncSupabase(). This dispatcher covers the single-row third-party providers.
 */
export async function syncProviderData(provider: string): Promise<SyncOutcome> {
  const meta = getProviderMeta(provider)

  if (meta.capability === 'none') {
    return { status: 'no_api', detail: 'no usage/balance API — record the balance by hand' }
  }
  if (!providerHasKey(meta)) {
    const note = meta.keyNote ? ` — ${meta.keyNote}` : ''
    return { status: 'key_missing', detail: `set ${meta.envVar} in Vercel${note}` }
  }

  switch (meta.slug) {
    case 'openrouter':
      return getOpenRouterOutcome()
    case 'anthropic':
      return getAnthropicMonthlyCost(process.env[meta.envVar as string] as string)
    default:
      return { status: 'no_api', detail: 'no adapter wired for this provider yet' }
  }
}

/** Record the outcome of a sync attempt on the cost_source row (best-effort, never throws). */
export async function recordSyncOutcome(
  db: SupabaseClient,
  sourceId: string,
  outcome: SyncOutcome,
): Promise<void> {
  const { error } = await db
    .from('cost_sources')
    .update({
      last_sync_at: new Date().toISOString(),
      last_sync_status: outcome.status,
      last_sync_detail: outcome.detail.slice(0, 500),
    } as never)
    .eq('id', sourceId)
  if (error) console.error('[providers] recordSyncOutcome error:', error)
}
