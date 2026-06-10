'use client'

/**
 * Credit balances editor for the Ops Center.
 *
 * Shows each cost source's recorded balance + alert threshold and lets the operator update
 * them (POST /api/admin/ops/balance). Needed because the priority providers — Anthropic,
 * OpenAI, Open Code Zen — expose no remaining-credit API, so their balances are recorded
 * here; the cron then emails when any drops below its threshold.
 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export interface BalanceRow {
  provider: string
  name: string
  balance_usd: number | null
  alert_threshold_usd: number | null
  balance_updated_at: string | null
}

// Providers the requirement names as priority; offered as quick-add even before any spend sync.
const PRIORITY_PROVIDERS = ['anthropic', 'openai', 'open-code-zen']

function fmtUsd(n: number | null): string {
  if (n === null || n === undefined) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export function BalanceManager({ initial }: { initial: BalanceRow[] }) {
  const router = useRouter()
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, { balance: string; threshold: string }>>({})

  // Seed quick-add rows for priority providers that aren't tracked yet.
  const known = new Set(initial.map((r) => r.provider.toLowerCase()))
  const placeholders: BalanceRow[] = PRIORITY_PROVIDERS.filter((p) => !known.has(p)).map((p) => ({
    provider: p,
    name: p.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    balance_usd: null,
    alert_threshold_usd: 20,
    balance_updated_at: null,
  }))
  const rows = [...initial, ...placeholders]

  function field(row: BalanceRow, key: 'balance' | 'threshold'): string {
    const d = draft[row.provider]
    if (d && d[key] !== undefined) return d[key]
    if (key === 'balance') return row.balance_usd === null ? '' : String(row.balance_usd)
    return row.alert_threshold_usd === null ? '20' : String(row.alert_threshold_usd)
  }

  function setField(provider: string, key: 'balance' | 'threshold', value: string) {
    setDraft((prev) => {
      const current = prev[provider] ?? { balance: '', threshold: '' }
      return { ...prev, [provider]: { ...current, [key]: value } }
    })
  }

  async function save(row: BalanceRow) {
    setError(null)
    setSaving(row.provider)
    try {
      const balanceStr = field(row, 'balance').trim()
      const thresholdStr = field(row, 'threshold').trim()
      const payload: Record<string, unknown> = { provider: row.provider, name: row.name }
      if (balanceStr !== '') payload.balance_usd = Number(balanceStr)
      if (thresholdStr !== '') payload.alert_threshold_usd = Number(thresholdStr)

      const res = await fetch('/api/admin/ops/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setDraft((prev) => {
        const next = { ...prev }
        delete next[row.provider]
        return next
      })
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-white">Credit Balances</h2>
      <p className="mt-1 text-sm text-gray-400">
        Record remaining balances so you get an email before credits run out. An alert is sent
        when a balance drops below its threshold (default $20). OpenRouter syncs automatically;
        record the rest here.
      </p>

      {error && (
        <div className="mt-3 rounded border border-rose-700 bg-rose-900/30 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-lg border border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-left text-gray-300">
            <tr>
              <th className="px-3 py-2 font-medium">Source</th>
              <th className="px-3 py-2 font-medium">Balance (USD)</th>
              <th className="px-3 py-2 font-medium">Alert below (USD)</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const balance = row.balance_usd
              const threshold = row.alert_threshold_usd ?? 20
              const low = balance !== null && balance < threshold
              return (
                <tr key={row.provider} className="border-t border-gray-700/60 bg-gray-800/30">
                  <td className="px-3 py-2 text-white capitalize">{row.name}</td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      value={field(row, 'balance')}
                      onChange={(e) => setField(row.provider, 'balance', e.target.value)}
                      placeholder="—"
                      className="w-28 rounded border border-gray-600 bg-gray-900 px-2 py-1 text-white"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      value={field(row, 'threshold')}
                      onChange={(e) => setField(row.provider, 'threshold', e.target.value)}
                      className="w-24 rounded border border-gray-600 bg-gray-900 px-2 py-1 text-white"
                    />
                  </td>
                  <td className="px-3 py-2">
                    {balance === null ? (
                      <span className="text-gray-500">Not tracked</span>
                    ) : low ? (
                      <span className="font-medium text-rose-400">⚠️ Low ({fmtUsd(balance)})</span>
                    ) : (
                      <span className="text-emerald-400">OK ({fmtUsd(balance)})</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => save(row)}
                      disabled={saving === row.provider}
                      className="rounded bg-accent px-3 py-1 font-medium text-black hover:opacity-90 disabled:opacity-50"
                    >
                      {saving === row.provider ? 'Saving…' : 'Save'}
                    </button>
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
