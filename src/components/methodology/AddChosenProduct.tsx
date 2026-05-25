'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { IntakeOverrideField } from './IntakeOverrideField'

export interface AvailableProduct {
  slug: string
  name: string
  url: string
}

interface Props {
  available: AvailableProduct[]
  /** Rule 16 intake gate — false when the board has untriaged cards. */
  gateOpen: boolean
  untriaged: { product_slug: string; display_name: string | null }[]
}

const BUILD_STATUS = ['none', 'thin-mvp', 'fat-mvp', 'full'] as const
type BuildStatus = (typeof BUILD_STATUS)[number]

/**
 * Cockpit inflow: pick a chosen product from the portfolio and drop it into
 * the pipeline as a Hypothesis Card. Set its build status + thin-MVP URL so
 * Gate 1 (MVP-ready) can release the research kick-off — the outreach embeds
 * the MVP link, so no link = no send.
 */
export function AddChosenProduct({ available, gateOpen, untriaged }: Props) {
  const router = useRouter()
  const [slug, setSlug] = useState('')
  const [mvpUrl, setMvpUrl] = useState('')
  const [buildStatus, setBuildStatus] = useState<BuildStatus>('none')
  const [mvpReady, setMvpReady] = useState(false)
  const [overrideReason, setOverrideReason] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const selected = available.find((p) => p.slug === slug)
  const blocked = !gateOpen
  // When the gate is blocked, intake requires a written override reason (Rule 16).
  const canAdd = Boolean(slug) && (!blocked || overrideReason.trim().length > 0)

  const onSelect = (s: string) => {
    setSlug(s)
    const p = available.find((x) => x.slug === s)
    setMvpUrl(p?.url ?? '') // prefill from the product's known URL as a starting point
    setError(null)
  }

  const add = () => {
    if (!slug) {
      setError('Pick a product first.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/methodology/cards', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            product_slug: slug,
            origin_summary: selected
              ? `${selected.name} — added to the pipeline from the cockpit.`
              : undefined,
            hypothesis_rows: [],
            build_status: buildStatus,
            mvp_url: mvpUrl || undefined,
            mvp_ready: mvpReady,
            // Manual cockpit intake — subject to the Rule 16 WIP gate.
            cockpit_intake: true,
            intake_source: 'operator',
            intake_override_reason: blocked ? overrideReason.trim() : undefined,
          }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          setError(json.error ?? `HTTP ${res.status}`)
          return
        }
        setSlug('')
        setMvpUrl('')
        setBuildStatus('none')
        setMvpReady(false)
        setOverrideReason('')
        router.refresh()
      } catch (e) {
        setError((e as Error).message)
      }
    })
  }

  if (available.length === 0) {
    return (
      <p className="text-xs text-gray-light/60">
        All portfolio products are already in the pipeline — add a brand-new idea below.
      </p>
    )
  }

  return (
    <div className="rounded-lg border border-gray-border bg-gray-dark/40 p-5">
      <p className="text-sm uppercase tracking-wider text-accent font-medium mb-1">
        Add a chosen product to the pipeline
      </p>
      <p className="text-base text-gray-light/70 mb-4">
        Gate 1 — set the thin-MVP link and mark it ready. Kick-off into research is blocked until
        both are set, because the outreach embeds the MVP link.
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="text-sm uppercase tracking-wider text-gray-light/70">Product</span>
          <select
            value={slug}
            onChange={(e) => onSelect(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-base text-white outline-none focus:border-accent"
          >
            <option value="">Select a product…</option>
            {available.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name} ({p.slug})
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm uppercase tracking-wider text-gray-light/70">Build status</span>
          <select
            value={buildStatus}
            onChange={(e) => setBuildStatus(e.target.value as BuildStatus)}
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-base text-white outline-none focus:border-accent"
          >
            {BUILD_STATUS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm uppercase tracking-wider text-gray-light/70">
            Thin-MVP URL (embedded in outreach)
          </span>
          <input
            type="url"
            value={mvpUrl}
            onChange={(e) => setMvpUrl(e.target.value)}
            placeholder="https://your-thin-mvp.vercel.app"
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-base text-white outline-none focus:border-accent"
          />
        </label>
      </div>

      <label className="mt-4 flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border border-gray-border bg-black/20 px-3 py-2 text-base text-gray-light">
        <input
          type="checkbox"
          checked={mvpReady}
          onChange={(e) => setMvpReady(e.target.checked)}
          className="h-5 w-5 rounded border-gray-700 bg-gray-900 accent-accent"
        />
        Thin MVP ready (Gate 1 — unlocks research kick-off)
      </label>

      {blocked && (
        <IntakeOverrideField untriaged={untriaged} value={overrideReason} onChange={setOverrideReason} />
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={add}
          disabled={pending || !canAdd}
          className="min-h-[44px] w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
        >
          {pending ? 'Adding…' : blocked ? 'Override gate & add' : 'Add to pipeline'}
        </button>
        {mvpReady && !mvpUrl && (
          <span className="text-sm text-yellow-300">
            Marked ready but no MVP URL — Gate 1 will still block kick-off.
          </span>
        )}
        {error && <span className="text-sm text-red-300">Error: {error}</span>}
      </div>
    </div>
  )
}
