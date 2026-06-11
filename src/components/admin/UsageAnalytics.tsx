'use client'

/**
 * Usage Analytics — the "smart" half of the Cost Dashboard (Phase 3).
 *
 * Renders the per-product / per-API metering (usage_events) as interactive charts: total spend,
 * a daily spend strip, and ranked bars by product and by API — with filters (product / provider /
 * API / date range) so the operator can narrow spend to a single product or API. On any filter
 * change it re-hits GET /api/admin/ops/usage and re-renders.
 *
 * Charts are hand-rolled (CSS/flex bars) to avoid a charting dependency and match the dashboard's
 * existing style. Until products are instrumented (Phase 2) there's no data yet — the empty state
 * says so rather than rendering blank charts.
 */
import { useEffect, useRef, useState } from 'react'
import type { UsageAnalytics as Analytics, UsageFilterOptions } from '@/lib/ops/usage'

interface Filters {
  from: string
  to: string
  productSlug: string
  provider: string
  api: string
}

function fmtUsd(n: number): string {
  const abs = Math.abs(n)
  const digits = abs > 0 && abs < 0.01 ? 4 : 2
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n)
}

function fmtInt(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}

export function UsageAnalytics({
  initial,
  options,
  defaultFrom,
  defaultTo,
}: {
  initial: Analytics
  options: UsageFilterOptions
  defaultFrom: string
  defaultTo: string
}) {
  const [filters, setFilters] = useState<Filters>({
    from: defaultFrom,
    to: defaultTo,
    productSlug: '',
    provider: '',
    api: '',
  })
  const [data, setData] = useState<Analytics>(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const firstRender = useRef(true)

  useEffect(() => {
    // Skip the initial render — the server already provided `initial` for the default window.
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const controller = new AbortController()
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const qs = new URLSearchParams()
        if (filters.from) qs.set('from', filters.from)
        if (filters.to) qs.set('to', filters.to)
        if (filters.productSlug) qs.set('productSlug', filters.productSlug)
        if (filters.provider) qs.set('provider', filters.provider)
        if (filters.api) qs.set('api', filters.api)
        const res = await fetch(`/api/admin/ops/usage?${qs.toString()}`, {
          credentials: 'include',
          signal: controller.signal,
        })
        const body = await res.json()
        if (!res.ok) throw new Error(body.error || 'Failed to load usage')
        setData(body.analytics as Analytics)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Failed to load usage')
      } finally {
        setLoading(false)
      }
    }
    run()
    return () => controller.abort()
  }, [filters])

  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function reset() {
    setFilters({ from: defaultFrom, to: defaultTo, productSlug: '', provider: '', api: '' })
  }

  const hasData = data.totalEvents > 0
  const maxDaily = Math.max(1, ...data.daily.map((d) => d.cost_usd))

  const selectClass =
    'min-h-[44px] w-full rounded border border-gray-600 bg-gray-900 px-2 py-2 text-base text-white focus:border-accent focus:outline-none'
  const labelClass = 'flex flex-col gap-1 text-sm text-gray-300'

  return (
    <div className="mt-10 border-t border-gray-800 pt-8">
      <div>
        <h2 className="text-lg font-semibold text-white">Usage Analytics</h2>
        <p className="mt-1 max-w-prose text-sm text-gray-400">
          Per-product and per-API spend, metered from each product&rsquo;s own usage (tokens, calls)
          and priced from the model price table. Narrow to a single product or API with the filters
          to see exactly where the cost goes. Distinct from the provider balances above — this
          attributes spend to <span className="text-gray-300">products</span>, which provider
          billing can&rsquo;t.
        </p>
      </div>

      {/* Filters */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className={labelClass}>
          From
          <input
            type="date"
            value={filters.from}
            onChange={(e) => set('from', e.target.value)}
            className={selectClass}
          />
        </label>
        <label className={labelClass}>
          To
          <input
            type="date"
            value={filters.to}
            onChange={(e) => set('to', e.target.value)}
            className={selectClass}
          />
        </label>
        <label className={labelClass}>
          Product
          <select value={filters.productSlug} onChange={(e) => set('productSlug', e.target.value)} className={selectClass}>
            <option value="">All products</option>
            {options.products.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Provider
          <select value={filters.provider} onChange={(e) => set('provider', e.target.value)} className={selectClass}>
            <option value="">All providers</option>
            {options.providers.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          API
          <select value={filters.api} onChange={(e) => set('api', e.target.value)} className={selectClass}>
            <option value="">All APIs</option>
            {options.apis.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="min-h-[44px] rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
        >
          Reset filters
        </button>
        {loading && <span className="text-sm text-gray-400">Loading…</span>}
        {error && <span className="text-sm text-rose-400">{error}</span>}
      </div>

      {/* Totals */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Total spend" value={fmtUsd(data.totalCostUsd)} subtext={`${fmtInt(data.totalEvents)} events`} />
        <Stat label="Events" value={fmtInt(data.totalEvents)} />
        <Stat
          label="Unpriced events"
          value={fmtInt(data.unpricedEvents)}
          subtext={data.unpricedEvents > 0 ? 'add a price in model_prices' : 'all priced'}
          warn={data.unpricedEvents > 0}
        />
      </div>

      {!hasData ? (
        <div className="mt-6 rounded-lg border border-gray-700 bg-gray-800/40 p-6 text-sm text-gray-300">
          <p className="font-medium text-white">No metered usage in this window yet.</p>
          <p className="mt-2 text-gray-400">
            Products report usage here once they&rsquo;re instrumented (Phase 2 — metering the
            shared AI clients). Until then the provider balances above are the live view. Widen the
            date range if you expect data from an earlier period.
          </p>
        </div>
      ) : (
        <>
          {/* Daily strip */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-gray-200">Daily spend</h3>
            <div className="mt-3 flex h-32 items-end gap-[2px] overflow-x-auto rounded-lg border border-gray-700 bg-gray-800/30 p-2">
              {data.daily.map((d) => (
                <div
                  key={d.day}
                  className="min-w-[6px] flex-1 rounded-t bg-accent/70 hover:bg-accent"
                  style={{ height: `${Math.max(2, (d.cost_usd / maxDaily) * 100)}%` }}
                  title={`${d.day}: ${fmtUsd(d.cost_usd)}`}
                />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>{data.daily[0]?.day}</span>
              <span>{data.daily[data.daily.length - 1]?.day}</span>
            </div>
          </div>

          {/* Ranked bars */}
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <BarList title="By product" rows={data.byProduct} />
            <BarList title="By API" rows={data.byApi} />
          </div>
        </>
      )}
    </div>
  )
}

function Stat({ label, value, subtext, warn }: { label: string; value: string; subtext?: string; warn?: boolean }) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
      <div className="text-xs uppercase tracking-wide text-gray-400">{label}</div>
      <div className={`mt-1 text-3xl font-bold ${warn ? 'text-amber-400' : 'text-white'}`}>{value}</div>
      {subtext && <div className={`mt-1 text-sm ${warn ? 'text-amber-300/80' : 'text-gray-500'}`}>{subtext}</div>}
    </div>
  )
}

function BarList({ title, rows }: { title: string; rows: Array<{ key: string; cost_usd: number; events: number }> }) {
  const max = Math.max(1, ...rows.map((r) => r.cost_usd))
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
      <div className="mt-3 space-y-2">
        {rows.length === 0 && <p className="text-sm text-gray-500">No data.</p>}
        {rows.map((r) => (
          <div key={r.key}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-gray-200" title={r.key}>{r.key}</span>
              <span className="shrink-0 font-medium text-white">{fmtUsd(r.cost_usd)}</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded bg-gray-700/50">
              <div className="h-full rounded bg-accent" style={{ width: `${(r.cost_usd / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
