'use client'

/**
 * Cost Source Manager — full self-serve CRUD + sync for the Cost Dashboard.
 *
 * Two halves, matching how the data actually arrives:
 *  - AUTO providers (OpenRouter balance, Anthropic cost, Supabase compute): "Sync now" pulls live
 *    numbers; each row shows a sync-status badge (Auto ✓ / Key missing / error) with the reason.
 *  - MANUAL providers (Brave, Hunter, Unipile, Resend, …): no usage API, so the row gets an inline
 *    "Update balance" + "Record spend" quick panel and a deep link straight to the provider's
 *    billing console — the two-click manual refresh loop. Balances show their age and turn amber
 *    when stale.
 * Talks to /api/admin/ops/sources(+/[id]), /orgs, /spend, and /sync.
 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CostSource, Organisation, BillingModel } from '@/lib/ops/sources'

const BILLING_MODELS: BillingModel[] = ['fixed', 'per-use', 'tiered']
const STALE_DAYS = 14

// Common providers offered as autocomplete suggestions (not a closed list — type anything).
const PROVIDER_SUGGESTIONS = [
  'anthropic', 'openai', 'open-code-zen', 'openrouter', 'unipile', 'elevenlabs',
  'brave', 'hunter', 'ingest', 'resend', 'supabase', 'vercel', 'github', 'stripe', 'mapbox',
]

interface FormState {
  id: string | null
  provider: string
  name: string
  organisation_id: string
  billing_model: BillingModel
  fixed_cost_usd: string
  balance_usd: string
  alert_threshold_usd: string
  billing_url: string
  notes: string
}

const EMPTY_FORM: FormState = {
  id: null,
  provider: '',
  name: '',
  organisation_id: '',
  billing_model: 'per-use',
  fixed_cost_usd: '',
  balance_usd: '',
  alert_threshold_usd: '20',
  billing_url: '',
  notes: '',
}

function fmtUsd(n: number | null): string {
  if (n === null || n === undefined) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function relativeAge(iso: string | null): { label: string; days: number } | null {
  if (!iso) return null
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return null
  const days = Math.floor((Date.now() - then) / 86_400_000)
  if (days <= 0) return { label: 'today', days }
  if (days === 1) return { label: 'yesterday', days }
  if (days < 30) return { label: `${days}d ago`, days }
  const months = Math.floor(days / 30)
  return { label: `${months}mo ago`, days }
}

// Sync-status badge: derived from the live registry (capability + key) AND the last recorded run.
function SyncBadge({ s }: { s: CostSource }) {
  let tone: string
  let label: string
  if (!s.auto_capable) {
    tone = 'bg-gray-700/60 text-gray-300'
    label = 'Manual'
  } else if (!s.key_configured) {
    tone = 'bg-amber-900/40 text-amber-300 border border-amber-700/50'
    label = 'Key missing'
  } else if (s.last_sync_status === 'ok') {
    tone = 'bg-emerald-900/40 text-emerald-300'
    label = 'Auto ✓'
  } else if (s.last_sync_status === 'error') {
    tone = 'bg-rose-900/40 text-rose-300'
    label = 'Sync error'
  } else {
    tone = 'bg-blue-900/40 text-blue-300'
    label = 'Auto'
  }
  const age = relativeAge(s.last_sync_at)
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${tone}`}
      title={s.last_sync_detail ?? (s.auto_capable ? 'Not synced yet' : 'No usage API — track by hand')}
    >
      {label}
      {age ? <span className="ml-1 opacity-60">· {age.label}</span> : null}
    </span>
  )
}

export function CostSourceManager({
  sources,
  organisations,
}: {
  sources: CostSource[]
  organisations: Organisation[]
}) {
  const router = useRouter()
  const [form, setForm] = useState<FormState | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addingClient, setAddingClient] = useState(false)
  const [clientName, setClientName] = useState('')

  // Inline per-row quick panel (balance + spend) and global sync state.
  const [quickRow, setQuickRow] = useState<string | null>(null)
  const [quickBalance, setQuickBalance] = useState('')
  const [quickSpend, setQuickSpend] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)

  function openAdd() {
    setError(null)
    setForm({ ...EMPTY_FORM, organisation_id: organisations[0]?.id ?? '' })
  }

  function openEdit(s: CostSource) {
    setError(null)
    setForm({
      id: s.id,
      provider: s.provider,
      name: s.name,
      organisation_id: s.organisation_id ?? '',
      billing_model: s.billing_model ?? 'per-use',
      fixed_cost_usd: s.fixed_cost_usd === null ? '' : String(s.fixed_cost_usd),
      balance_usd: s.balance_usd === null ? '' : String(s.balance_usd),
      alert_threshold_usd: s.alert_threshold_usd === null ? '20' : String(s.alert_threshold_usd),
      billing_url: s.billing_url ?? '',
      notes: s.notes ?? '',
    })
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  function openQuick(s: CostSource) {
    setError(null)
    setQuickRow((prev) => (prev === s.id ? null : s.id))
    setQuickBalance(s.balance_usd === null ? '' : String(s.balance_usd))
    setQuickSpend('')
  }

  async function submit() {
    if (!form) return
    setError(null)
    if (!form.provider.trim()) return setError('Provider is required')
    if (!form.name.trim()) return setError('Name is required')

    const payload: Record<string, unknown> = {
      provider: form.provider.trim(),
      name: form.name.trim(),
      organisation_id: form.organisation_id || null,
      billing_model: form.billing_model,
      notes: form.notes.trim(),
      billing_url: form.billing_url.trim() || null,
      fixed_cost_usd: form.billing_model === 'fixed' && form.fixed_cost_usd !== '' ? Number(form.fixed_cost_usd) : null,
      balance_usd: form.balance_usd !== '' ? Number(form.balance_usd) : null,
      alert_threshold_usd: form.alert_threshold_usd !== '' ? Number(form.alert_threshold_usd) : null,
    }

    setBusy(true)
    try {
      const url = form.id ? `/api/admin/ops/sources/${form.id}` : '/api/admin/ops/sources'
      const res = await fetch(url, {
        method: form.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setForm(null)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  async function patchSource(id: string, body: Record<string, unknown>, fail: string) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/ops/sources/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || fail)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : fail)
    } finally {
      setBusy(false)
    }
  }

  async function saveBalance(s: CostSource) {
    if (quickBalance === '') return
    await patchSource(s.id, { balance_usd: Number(quickBalance) }, 'Failed to save balance')
    setQuickRow(null)
  }

  async function saveSpend(s: CostSource) {
    if (quickSpend === '') return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/ops/spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ source_id: s.id, amount_usd: Number(quickSpend) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to record spend')
      setQuickRow(null)
      setQuickSpend('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record spend')
    } finally {
      setBusy(false)
    }
  }

  async function setActive(s: CostSource, is_active: boolean) {
    await patchSource(s.id, { is_active }, 'Update failed')
  }

  async function remove(s: CostSource) {
    if (!window.confirm(`Delete "${s.name}" and all its recorded cost history? This cannot be undone.`)) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/ops/sources/${s.id}`, { method: 'DELETE', credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Delete failed')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  async function syncNow() {
    setSyncing(true)
    setSyncMsg(null)
    setError(null)
    try {
      const res = await fetch('/api/admin/ops/sync', { method: 'POST', credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Sync failed')
      const providers = (data.results?.providers ?? {}) as Record<string, string>
      const ok = Object.values(providers).filter((v) => v === 'ok').length
      const missing = Object.values(providers).filter((v) => v === 'key_missing').length
      const errored = Object.values(providers).filter((v) => v === 'error').length
      setSyncMsg(
        `Synced. ${ok} auto-synced, ${missing} need a key, ${errored} errored` +
          `${data.results?.supabase_projects ? `, ${data.results.supabase_projects} Supabase projects` : ''}.`,
      )
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  async function addClient() {
    const name = clientName.trim()
    if (!name) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/ops/orgs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, type: 'client' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add client')
      if (form) set('organisation_id', data.id)
      setClientName('')
      setAddingClient(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add client')
    } finally {
      setBusy(false)
    }
  }

  const inputClass =
    'w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-base text-white placeholder-gray-500 focus:border-accent focus:outline-none'

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Cost Sources</h2>
          <p className="mt-1 text-sm text-gray-400">
            Every subscription and API you pay for. Providers with a usage/balance API auto-sync
            (use Sync now); the rest you keep current by hand — open their billing page, then
            Update balance or Record spend on the row.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={syncNow}
            disabled={syncing}
            className="min-h-[44px] rounded-lg border border-emerald-700 bg-emerald-900/30 px-4 py-2 font-medium text-emerald-200 hover:bg-emerald-900/50 disabled:opacity-50"
          >
            {syncing ? 'Syncing…' : 'Sync now'}
          </button>
          <button
            type="button"
            onClick={openAdd}
            className="min-h-[44px] rounded-lg bg-accent px-4 py-2 font-medium text-black hover:opacity-90"
          >
            + Add cost source
          </button>
        </div>
      </div>

      {syncMsg && (
        <div className="mt-3 rounded border border-emerald-700 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-200">
          {syncMsg}
        </div>
      )}

      {error && (
        <div className="mt-3 rounded border border-rose-700 bg-rose-900/30 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}

      {form && (
        <div className="mt-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
          <h3 className="text-base font-semibold text-white">
            {form.id ? 'Edit cost source' : 'New cost source'}
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-gray-300">
              Provider
              <input
                list="provider-suggestions"
                value={form.provider}
                onChange={(e) => set('provider', e.target.value)}
                placeholder="anthropic"
                className={inputClass}
              />
              <datalist id="provider-suggestions">
                {PROVIDER_SUGGESTIONS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-300">
              Display name
              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Anthropic (Claude API)"
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-300">
              Organisation / client
              <div className="flex gap-2">
                <select
                  value={form.organisation_id}
                  onChange={(e) => set('organisation_id', e.target.value)}
                  className={inputClass}
                >
                  <option value="">— Unassigned —</option>
                  {organisations.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                      {o.type !== 'internal' ? ` (${o.type})` : ''}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setAddingClient((v) => !v)}
                  className="min-h-[44px] shrink-0 rounded border border-gray-600 px-3 text-sm text-gray-200 hover:bg-gray-700"
                >
                  + Client
                </button>
              </div>
              {addingClient && (
                <div className="mt-2 flex gap-2">
                  <input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="New client name"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={addClient}
                    disabled={busy}
                    className="min-h-[44px] shrink-0 rounded bg-accent px-3 font-medium text-black hover:opacity-90 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              )}
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-300">
              Billing model
              <select
                value={form.billing_model}
                onChange={(e) => set('billing_model', e.target.value as BillingModel)}
                className={inputClass}
              >
                {BILLING_MODELS.map((m) => (
                  <option key={m} value={m}>
                    {m === 'fixed' ? 'Fixed (monthly subscription)' : m === 'per-use' ? 'Per-use (API credits)' : 'Tiered'}
                  </option>
                ))}
              </select>
            </label>

            {form.billing_model === 'fixed' && (
              <label className="flex flex-col gap-1 text-sm text-gray-300">
                Fixed cost (USD / month)
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  value={form.fixed_cost_usd}
                  onChange={(e) => set('fixed_cost_usd', e.target.value)}
                  placeholder="10"
                  className={inputClass}
                />
              </label>
            )}

            <label className="flex flex-col gap-1 text-sm text-gray-300">
              Current balance (USD)
              <input
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={form.balance_usd}
                onChange={(e) => set('balance_usd', e.target.value)}
                placeholder="Leave blank if not tracked"
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-300">
              Alert when below (USD)
              <input
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={form.alert_threshold_usd}
                onChange={(e) => set('alert_threshold_usd', e.target.value)}
                placeholder="20"
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-300 sm:col-span-2">
              Billing page URL (for fast manual refresh)
              <input
                type="url"
                value={form.billing_url}
                onChange={(e) => set('billing_url', e.target.value)}
                placeholder="https://… (defaults to the known provider console)"
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-300 sm:col-span-2">
              Notes (optional)
              <input
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="e.g. burns hard on validation runs"
                className={inputClass}
              />
            </label>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="min-h-[44px] rounded-lg bg-accent px-4 py-2 font-medium text-black hover:opacity-90 disabled:opacity-50"
            >
              {busy ? 'Saving…' : form.id ? 'Save changes' : 'Add source'}
            </button>
            <button
              type="button"
              onClick={() => setForm(null)}
              className="min-h-[44px] rounded-lg border border-gray-600 px-4 py-2 text-gray-200 hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-gray-800 text-left text-gray-300">
            <tr>
              <th className="px-3 py-2 font-medium">Source</th>
              <th className="px-3 py-2 font-medium">Client</th>
              <th className="px-3 py-2 font-medium">Sync</th>
              <th className="px-3 py-2 font-medium">Balance</th>
              <th className="px-3 py-2 font-medium">Alert below</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {sources.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                  No cost sources yet. Add your first provider above.
                </td>
              </tr>
            )}
            {sources.map((s) => {
              const threshold = s.alert_threshold_usd ?? 20
              const low = s.balance_usd !== null && s.balance_usd < threshold
              const balanceAge = relativeAge(s.balance_updated_at)
              const stale = balanceAge !== null && balanceAge.days >= STALE_DAYS
              return (
                <tr
                  key={s.id}
                  className={`border-t border-gray-700/60 align-top ${s.is_active ? 'bg-gray-800/30' : 'bg-gray-900/40 opacity-60'}`}
                >
                  <td className="px-3 py-2">
                    <div className="font-medium text-white">{s.name}</div>
                    <div className="text-xs capitalize text-gray-500">{s.provider}</div>
                  </td>
                  <td className="px-3 py-2 text-gray-300">{s.organisation_name ?? '—'}</td>
                  <td className="px-3 py-2">
                    <SyncBadge s={s} />
                  </td>
                  <td className="px-3 py-2 text-white">
                    {fmtUsd(s.balance_usd)}
                    {balanceAge && (
                      <div className={`text-xs ${stale ? 'text-amber-400' : 'text-gray-500'}`}>
                        as of {balanceAge.label}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-300">{fmtUsd(s.alert_threshold_usd)}</td>
                  <td className="px-3 py-2">
                    {!s.is_active ? (
                      <span className="text-gray-500">Retired</span>
                    ) : s.balance_usd === null ? (
                      <span className="text-gray-500">Not tracked</span>
                    ) : low ? (
                      <span className="font-medium text-rose-400">⚠️ Low</span>
                    ) : (
                      <span className="text-emerald-400">OK</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openQuick(s)}
                        className="min-h-[36px] rounded border border-gray-600 px-2 py-1 text-xs text-gray-200 hover:bg-gray-700"
                      >
                        Update
                      </button>
                      {s.effective_billing_url && (
                        <a
                          href={s.effective_billing_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[36px] rounded border border-gray-600 px-2 py-1 text-xs text-gray-200 hover:bg-gray-700"
                        >
                          Billing ↗
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => openEdit(s)}
                        className="min-h-[36px] rounded border border-gray-600 px-2 py-1 text-xs text-gray-200 hover:bg-gray-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setActive(s, !s.is_active)}
                        disabled={busy}
                        className="min-h-[36px] rounded border border-gray-600 px-2 py-1 text-xs text-gray-200 hover:bg-gray-700 disabled:opacity-50"
                      >
                        {s.is_active ? 'Retire' : 'Restore'}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(s)}
                        disabled={busy}
                        className="min-h-[36px] rounded border border-rose-700 px-2 py-1 text-xs text-rose-300 hover:bg-rose-900/40 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                    {quickRow === s.id && (
                      <div className="mt-2 flex flex-col gap-2 rounded border border-gray-600 bg-gray-900/60 p-2 sm:flex-row sm:items-end">
                        <label className="flex flex-1 flex-col gap-1 text-xs text-gray-400">
                          Balance (USD)
                          <div className="flex gap-1">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              inputMode="decimal"
                              value={quickBalance}
                              onChange={(e) => setQuickBalance(e.target.value)}
                              placeholder="0.00"
                              className="w-full rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-white focus:border-accent focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => saveBalance(s)}
                              disabled={busy}
                              className="shrink-0 rounded bg-accent px-2 py-1 text-xs font-medium text-black hover:opacity-90 disabled:opacity-50"
                            >
                              Save
                            </button>
                          </div>
                        </label>
                        <label className="flex flex-1 flex-col gap-1 text-xs text-gray-400">
                          Spend this month (USD)
                          <div className="flex gap-1">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              inputMode="decimal"
                              value={quickSpend}
                              onChange={(e) => setQuickSpend(e.target.value)}
                              placeholder="0.00"
                              className="w-full rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-white focus:border-accent focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => saveSpend(s)}
                              disabled={busy}
                              className="shrink-0 rounded bg-accent px-2 py-1 text-xs font-medium text-black hover:opacity-90 disabled:opacity-50"
                            >
                              Save
                            </button>
                          </div>
                        </label>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
