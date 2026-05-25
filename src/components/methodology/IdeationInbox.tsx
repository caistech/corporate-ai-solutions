'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export interface InboxCard {
  id: string
  product_slug: string
  display_name: string | null
  origin_summary: string | null
  updated_at: string
}

/**
 * The ideation inbox — ideas the always-on ideation agent deposited
 * (intake_source='ideation-agent', not yet promoted). They do NOT count against
 * the intake WIP gate (Rule 16); promoting one moves it into the pipeline, after
 * which it joins the board and must be triaged like any other card.
 */
export function IdeationInbox({ cards }: { cards: InboxCard[] }) {
  const router = useRouter()
  if (cards.length === 0) return null

  return (
    <div className="mb-8 rounded-lg border border-gray-border bg-gray-dark/40 p-5">
      <p className="mb-1 text-sm font-medium uppercase tracking-wider text-accent">
        Ideation inbox ({cards.length})
      </p>
      <p className="mb-4 text-base text-gray-light/70">
        Ideas the always-on ideation agent surfaced. They don&apos;t count against the intake gate
        until you promote one into the pipeline — then it joins the board and must be triaged.
      </p>
      <ul className="space-y-3">
        {cards.map((c) => (
          <InboxRow key={c.id} card={c} onDone={() => router.refresh()} />
        ))}
      </ul>
    </div>
  )
}

function InboxRow({ card, onDone }: { card: InboxCard; onDone: () => void }) {
  const [pending, startTransition] = useTransition()
  const [err, setErr] = useState<string | null>(null)

  const promote = () => {
    setErr(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/methodology/cards/${card.product_slug}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ inbox: false }),
        })
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          setErr(j.error ?? `HTTP ${res.status}`)
          return
        }
        onDone()
      } catch (e) {
        setErr((e as Error).message)
      }
    })
  }

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-gray-border bg-black/20 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <Link
          href={`/admin/methodology/${card.product_slug}`}
          className="block text-base font-medium text-white hover:underline"
        >
          {card.display_name ?? card.product_slug}
        </Link>
        {card.origin_summary && (
          <p className="text-sm text-gray-light/70">{card.origin_summary}</p>
        )}
      </div>
      <div className="flex items-center gap-3 sm:shrink-0">
        <Link
          href={`/admin/methodology/${card.product_slug}`}
          className="text-sm text-accent hover:underline"
        >
          Open →
        </Link>
        <button
          type="button"
          onClick={promote}
          disabled={pending}
          className="min-h-[44px] rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black hover:bg-accent/90 disabled:opacity-50"
        >
          {pending ? 'Promoting…' : 'Promote to pipeline'}
        </button>
      </div>
      {err && <p className="text-sm text-red-300">{err}</p>}
    </li>
  )
}
