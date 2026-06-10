/**
 * Cost-source BALANCE tracking + low-balance alert evaluation.
 *
 * Companion to llm.ts (which tracks SPEND). This module tracks what's LEFT:
 *  - getOpenRouterBalance(): real balance via the OpenRouter /credits API.
 *    (Anthropic, OpenAI and Open Code Zen do not expose a remaining-credit API, so their
 *     balances are recorded by an operator via POST /api/admin/ops/balance instead.)
 *  - evaluateLowBalancesAndAlert(): finds active sources whose recorded balance is below
 *    their per-source threshold (default $20) and emails the admin, debounced so the same
 *    low balance is not re-emailed within ALERT_DEBOUNCE_HOURS.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { sendLowBalanceAlert, type LowBalanceSource } from '@/lib/email'

const OPENROUTER_API = 'https://openrouter.ai/api/v1'

// Don't re-email the same low source more than once per this window. The cron runs daily,
// so this mainly guards manual/immediate re-evaluations (e.g. after a balance edit).
const ALERT_DEBOUNCE_HOURS = 20

/**
 * Remaining OpenRouter credit balance in USD, or null if unavailable / not configured.
 * OpenRouter /credits returns { data: { total_credits, total_usage } }.
 */
export async function getOpenRouterBalance(): Promise<number | null> {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) return null

  try {
    const res = await fetch(`${OPENROUTER_API}/credits`, {
      headers: { Authorization: `Bearer ${key}` },
    })
    if (!res.ok) {
      console.error('[balances] OpenRouter /credits failed:', res.status)
      return null
    }
    const data = await res.json()
    const totalCredits = Number(data?.data?.total_credits)
    const totalUsage = Number(data?.data?.total_usage)
    if (!Number.isFinite(totalCredits) || !Number.isFinite(totalUsage)) return null
    return Math.round((totalCredits - totalUsage) * 100) / 100
  } catch (err) {
    console.error('[balances] OpenRouter balance error:', err)
    return null
  }
}

/**
 * Upsert a recorded balance for a provider's cost_source. Used by the cron (auto-synced
 * providers) and by the admin balance API (manually-recorded providers). Creates the
 * cost_source row if the provider isn't tracked yet so a balance can be recorded before
 * any spend has been synced.
 */
export async function recordBalance(
  supabase: SupabaseClient,
  opts: { provider: string; name?: string; balanceUsd?: number; thresholdUsd?: number; organisationId?: string },
): Promise<{ id: string } | null> {
  const { provider, name, balanceUsd, thresholdUsd, organisationId } = opts

  const { data: existing } = await supabase
    .from('cost_sources')
    .select('id, alert_threshold_usd')
    .eq('provider', provider)
    .limit(1)
    .maybeSingle()

  const update: Record<string, unknown> = {}
  if (typeof balanceUsd === 'number') {
    update.balance_usd = balanceUsd
    update.balance_updated_at = new Date().toISOString()
    // Only clear the alert latch when the balance is genuinely back AT/ABOVE the EFFECTIVE
    // threshold. The cron syncs balances WITHOUT passing a threshold, so fall back to the stored
    // per-source threshold (then the $20 default). Treating "threshold omitted" as "clear the latch"
    // reset it on every sync, so a still-low source re-alerted on every cron run.
    const effectiveThreshold =
      typeof thresholdUsd === 'number'
        ? thresholdUsd
        : typeof existing?.alert_threshold_usd === 'number'
          ? (existing.alert_threshold_usd as number)
          : 20
    if (balanceUsd >= effectiveThreshold) {
      update.low_balance_alerted_at = null
    }
  }
  if (typeof thresholdUsd === 'number') update.alert_threshold_usd = thresholdUsd

  if (existing?.id) {
    if (Object.keys(update).length === 0) return { id: existing.id as string }
    const { data, error } = await supabase
      .from('cost_sources')
      .update(update as never)
      .eq('id', existing.id)
      .select('id')
      .single()
    if (error) {
      console.error('[balances] recordBalance update error:', error)
      return null
    }
    return data as { id: string }
  }

  const { data, error } = await supabase
    .from('cost_sources')
    .insert({
      provider,
      name: name || provider.charAt(0).toUpperCase() + provider.slice(1),
      organisation_id: organisationId,
      billing_model: 'per-use',
      ...update,
    } as never)
    .select('id')
    .single()
  if (error) {
    console.error('[balances] recordBalance insert error:', error)
    return null
  }
  return data as { id: string }
}

/**
 * Find active sources whose known balance is below their threshold and email the admin,
 * debounced per source. Returns the list of sources that were alerted this run.
 */
export async function evaluateLowBalancesAndAlert(
  supabase: SupabaseClient,
): Promise<LowBalanceSource[]> {
  const { data: low, error } = await supabase
    .from('cost_sources')
    .select('id, provider, name, balance_usd, alert_threshold_usd, low_balance_alerted_at')
    .eq('is_active', true)
    .not('balance_usd', 'is', null)

  if (error) {
    console.error('[balances] low-balance query error:', error)
    return []
  }

  const now = Date.now()
  const debounceMs = ALERT_DEBOUNCE_HOURS * 60 * 60 * 1000

  const toAlert: LowBalanceSource[] = []
  const alertedIds: string[] = []
  for (const s of low ?? []) {
    const balance = Number(s.balance_usd)
    const threshold = Number(s.alert_threshold_usd ?? 20)
    if (!Number.isFinite(balance) || balance >= threshold) continue

    const lastAlert = s.low_balance_alerted_at ? new Date(s.low_balance_alerted_at).getTime() : 0
    if (lastAlert && now - lastAlert < debounceMs) continue

    toAlert.push({
      provider: s.provider as string,
      name: (s.name as string) || (s.provider as string),
      balanceUsd: balance,
      thresholdUsd: threshold,
    })
    alertedIds.push(s.id as string)
  }

  if (toAlert.length === 0) return []

  // Send FIRST, then set the debounce latch only on a CONFIRMED send. Stamping before the send
  // means a failed/skipped email (missing key, Resend error) still suppresses retries for the
  // whole debounce window — a silent miss during exactly the incident the alert exists to catch.
  const sent = await sendLowBalanceAlert(toAlert)
  if (sent) {
    await supabase
      .from('cost_sources')
      .update({ low_balance_alerted_at: new Date().toISOString() } as never)
      .in('id', alertedIds)
  }

  return toAlert
}
