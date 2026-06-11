'use client'

/**
 * Cost Source Manager — full self-serve CRUD for the Cost Dashboard.
 *
 * An operator can set up cost tracking from scratch the way a new client would: add any
 * provider, assign it to an organisation/client (or add a new client inline), pick its billing
 * model, record a balance + low-balance alert threshold, then edit, retire, or delete it.
 * Talks to /api/admin/ops/sources(+/[id]) and /api/admin/ops/orgs.
 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CostSource, Organisation, BillingModel } from '@/lib/ops/sources'

const BILLING_MODELS: BillingModel[] = ['fixed', 'per-use', 'tiered']

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
  notes: '',
}

function fmtUsd(n: number | null): string {
  if (n === null || n === undefined) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
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
      notes: s.notes ?? '',
    })
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
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

  async function setActive(s: CostSource, is_active: boolean) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/ops/sources/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setBusy(false)
    }
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
            Every subscription and API you pay for. Add a provider, assign it to a client, record
            its balance, and set the low-balance alert threshold. Edit or retire any source as
            your stack changes.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="min-h-[44px] rounded-lg bg-accent px-4 py-2 font-medium text-black hover:opacity-90"
        >
          + Add cost source
        </button>
      </div>

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
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-gray-800 text-left text-gray-300">
            <tr>
              <th className="px-3 py-2 font-medium">Source</th>
              <th className="px-3 py-2 font-medium">Client</th>
              <th className="px-3 py-2 font-medium">Billing</th>
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
              return (
                <tr key={s.id} className={`border-t border-gray-700/60 ${s.is_active ? 'bg-gray-800/30' : 'bg-gray-900/40 opacity-60'}`}>
                  <td className="px-3 py-2">
                    <div className="font-medium text-white">{s.name}</div>
                    <div className="text-xs capitalize text-gray-500">{s.provider}</div>
                  </td>
                  <td className="px-3 py-2 text-gray-300">{s.organisation_name ?? '—'}</td>
                  <td className="px-3 py-2 text-gray-300">
                    {s.billing_model === 'fixed'
                      ? `Fixed ${fmtUsd(s.fixed_cost_usd)}/mo`
                      : s.billing_model === 'tiered'
                        ? 'Tiered'
                        : 'Per-use'}
                  </td>
                  <td className="px-3 py-2 text-white">{fmtUsd(s.balance_usd)}</td>
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
