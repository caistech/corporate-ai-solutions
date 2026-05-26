'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export interface BoardCard {
  id: string
  product_slug: string
  display_name: string | null
  status: string
  pipeline_stage: string | null
  build_status: string | null
  monetisation_lane: string | null
  updated_at: string
  mvp_ready: boolean | null
  mvp_url: string | null
  archived_at: string | null
  build_type: string | null
}

// The first gate — short labels for the board (full labels on the detail page).
const BUILD_TYPE_SHORT: Record<string, string> = {
  'product': 'Product',
  'shared-service': 'Shared',
  'infra-product-candidate': 'Infra/PC',
}
const BUILD_TYPE_COLOR: Record<string, string> = {
  'product': 'bg-accent/20 text-accent',
  'shared-service': 'bg-blue-500/20 text-blue-300',
  'infra-product-candidate': 'bg-purple-500/20 text-purple-300',
}

function BuildTypeBadge({ buildType }: { buildType: string | null }) {
  if (!buildType) return <span className="text-sm text-gray-light/40">—</span>
  return (
    <span
      className={`text-sm px-2 py-1 rounded uppercase tracking-wider ${
        BUILD_TYPE_COLOR[buildType] ?? 'bg-gray-mid/40 text-gray-light'
      }`}
      title="Build type — the first gate; it routes the gate path."
    >
      {BUILD_TYPE_SHORT[buildType] ?? buildType}
    </span>
  )
}

interface Props {
  cards: BoardCard[]
}

const STAGES = ['ideation', 'feasibility', 'validation', 'go-no-go', 'build', 'ship']

// Cards in these statuses are actively asking the operator for attention — they
// sort to the top of the board ahead of the dormant ideation backlog.
const NEEDS_DECISION = new Set(['validation-in-flight', 'validated', 'dialogue-complete'])

function needsAttention(card: BoardCard): boolean {
  return NEEDS_DECISION.has(card.status)
}

function isDormant(card: BoardCard): boolean {
  // Fresh ideation cards with no MVP yet, not yet decided — the backlog.
  return (
    (card.status === 'ideation' || (card.pipeline_stage ?? 'ideation') === 'ideation') &&
    !needsAttention(card)
  )
}

export function BoardTable({ cards }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [gate1Filter, setGate1Filter] = useState<'' | 'ready' | 'blocked'>('')
  const [showArchived, setShowArchived] = useState(false)

  const archivedCount = useMemo(
    () => cards.filter((c) => c.archived_at).length,
    [cards]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = cards.filter((card) => {
      if (!showArchived && card.archived_at) return false
      if (q) {
        const hay = `${card.product_slug} ${card.display_name ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (stageFilter && (card.pipeline_stage ?? 'ideation') !== stageFilter) return false
      if (gate1Filter) {
        const gate1Open = Boolean(card.mvp_ready && card.mvp_url)
        if (gate1Filter === 'ready' && !gate1Open) return false
        if (gate1Filter === 'blocked' && gate1Open) return false
      }
      return true
    })

    // Default sort: cards needing a decision first, then everything else, each
    // group most-recently-updated first. Keeps the dormant backlog out of the way.
    return rows.sort((a, b) => {
      const aw = needsAttention(a) ? 0 : 1
      const bw = needsAttention(b) ? 0 : 1
      if (aw !== bw) return aw - bw
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
  }, [cards, query, stageFilter, gate1Filter, showArchived])

  const dormantInView = useMemo(() => filtered.filter(isDormant).length, [filtered])

  return (
    <div>
      {/* Triage controls */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search product name or slug…"
          className="min-h-[44px] w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-base text-white outline-none focus:border-accent"
        />
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="min-h-[44px] w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-base text-white outline-none focus:border-accent"
        >
          <option value="">All stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={gate1Filter}
          onChange={(e) => setGate1Filter(e.target.value as '' | 'ready' | 'blocked')}
          className="min-h-[44px] w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-base text-white outline-none focus:border-accent"
        >
          <option value="">All Gate 1</option>
          <option value="ready">Gate 1 ready</option>
          <option value="blocked">Gate 1 blocked</option>
        </select>
        <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border border-gray-border bg-black/20 px-3 py-2 text-base text-gray-light">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="h-5 w-5 rounded border-gray-700 bg-gray-900 accent-accent"
          />
          Show archived{archivedCount > 0 ? ` (${archivedCount})` : ''}
        </label>
      </div>

      <p className="mb-4 text-sm text-gray-light/60">
        Showing {filtered.length} card{filtered.length === 1 ? '' : 's'}
        {dormantInView > 0 && ` · ${dormantInView} dormant in the ideation backlog`}
        {!showArchived && archivedCount > 0 && ` · ${archivedCount} archived (hidden)`}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-gray-border bg-gray-dark/40 p-8 text-center">
          <p className="text-base text-gray-light">No cards match your filters.</p>
        </div>
      ) : (
        <>
          {/* Mobile: stacked card list */}
          <ul className="space-y-3 md:hidden">
            {filtered.map((card) => (
              <BoardCardMobile key={card.id} card={card} onArchiveChange={() => router.refresh()} />
            ))}
          </ul>

          {/* Laptop: table */}
          <table className="hidden w-full border-collapse text-sm md:table">
            <thead>
              <tr className="border-b border-gray-border text-left text-sm uppercase tracking-wider text-gray-light/70">
                <th className="py-3 px-3">Product</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Stage</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Build</th>
                <th className="py-3 px-3">Gate 1</th>
                <th className="py-3 px-3">Lane</th>
                <th className="py-3 px-3">Updated</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((card) => (
                <BoardRowDesktop key={card.id} card={card} onArchiveChange={() => router.refresh()} />
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}

function useArchive(card: BoardCard, onDone: () => void) {
  const [pending, startTransition] = useTransition()
  const [err, setErr] = useState<string | null>(null)
  const archived = Boolean(card.archived_at)

  const toggle = () => {
    setErr(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/methodology/cards/${card.product_slug}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ archived: !archived }),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          setErr(json.error ?? `HTTP ${res.status}`)
          return
        }
        onDone()
      } catch (e) {
        setErr((e as Error).message)
      }
    })
  }

  return { pending, err, archived, toggle }
}

function Gate1Badge({ card }: { card: BoardCard }) {
  const gate1Open = Boolean(card.mvp_ready && card.mvp_url)
  return (
    <span
      className={`text-sm px-2 py-1 rounded uppercase tracking-wider ${
        gate1Open ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-mid/40 text-gray-light/70'
      }`}
    >
      {gate1Open ? 'ready' : 'blocked'}
    </span>
  )
}

function BoardRowDesktop({ card, onArchiveChange }: { card: BoardCard; onArchiveChange: () => void }) {
  const { pending, err, archived, toggle } = useArchive(card, onArchiveChange)
  return (
    <tr className={`border-b border-gray-border/40 ${archived ? 'opacity-50' : ''}`}>
      <td className="py-3 px-3 text-white">
        <Link href={`/admin/methodology/${card.product_slug}`} className="hover:underline">
          <span className="font-medium">{card.display_name ?? card.product_slug}</span>
          <span className="ml-2 font-mono text-sm text-gray-light/60">{card.product_slug}</span>
        </Link>
      </td>
      <td className="py-3 px-3"><BuildTypeBadge buildType={card.build_type} /></td>
      <td className="py-3 px-3 text-sm text-gray-light">{card.pipeline_stage ?? 'ideation'}</td>
      <td className="py-3 px-3">
        <span className="text-sm px-2 py-1 rounded bg-accent/10 text-accent uppercase tracking-wider">
          {card.status}
        </span>
      </td>
      <td className="py-3 px-3 text-sm text-gray-light">{card.build_status ?? 'none'}</td>
      <td className="py-3 px-3">
        <Gate1Badge card={card} />
      </td>
      <td className="py-3 px-3 text-sm text-gray-light/70">{card.monetisation_lane ?? '—'}</td>
      <td className="py-3 px-3 text-sm text-gray-light/70">
        {new Date(card.updated_at).toLocaleDateString()}
      </td>
      <td className="py-3 px-3 text-right">
        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/admin/methodology/${card.product_slug}`}
            className="text-sm text-accent hover:underline"
          >
            Open →
          </Link>
          <button
            type="button"
            onClick={toggle}
            disabled={pending}
            className="text-sm text-gray-light/60 hover:text-white disabled:opacity-50"
            title={archived ? 'Restore to the active board' : 'Soft-archive — hides from the default board'}
          >
            {pending ? '…' : archived ? 'Unarchive' : 'Archive'}
          </button>
        </div>
        {err && <p className="mt-1 text-sm text-red-300">{err}</p>}
      </td>
    </tr>
  )
}

function BoardCardMobile({ card, onArchiveChange }: { card: BoardCard; onArchiveChange: () => void }) {
  const { pending, err, archived, toggle } = useArchive(card, onArchiveChange)
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: 'Type', value: <BuildTypeBadge buildType={card.build_type} /> },
    { label: 'Stage', value: card.pipeline_stage ?? 'ideation' },
    {
      label: 'Status',
      value: (
        <span className="text-sm px-2 py-0.5 rounded bg-accent/10 text-accent uppercase tracking-wider">
          {card.status}
        </span>
      ),
    },
    { label: 'Build', value: card.build_status ?? 'none' },
    { label: 'Gate 1', value: <Gate1Badge card={card} /> },
    { label: 'Lane', value: card.monetisation_lane ?? '—' },
    { label: 'Updated', value: new Date(card.updated_at).toLocaleDateString() },
  ]
  return (
    <li className={`rounded-lg border border-gray-border bg-gray-dark/40 p-4 ${archived ? 'opacity-50' : ''}`}>
      <Link href={`/admin/methodology/${card.product_slug}`} className="block">
        <p className="text-base font-semibold text-white">{card.display_name ?? card.product_slug}</p>
        <p className="font-mono text-sm text-gray-light/60">{card.product_slug}</p>
      </Link>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-2">
            <dt className="text-sm uppercase tracking-wider text-gray-light/50">{r.label}</dt>
            <dd className="text-sm text-gray-light">{r.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex flex-col gap-2">
        <Link
          href={`/admin/methodology/${card.product_slug}`}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black hover:bg-accent/90"
        >
          Open
        </Link>
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-gray-border bg-black/20 px-4 py-2 text-sm text-gray-light hover:border-accent disabled:opacity-50"
        >
          {pending ? 'Working…' : archived ? 'Unarchive' : 'Archive'}
        </button>
        {err && <p className="text-sm text-red-300">{err}</p>}
      </div>
    </li>
  )
}
