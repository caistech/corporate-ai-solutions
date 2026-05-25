'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { IntakeOverrideField } from './IntakeOverrideField'

const NAME_MAX = 80

function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Free-form inflow: add a brand-new idea to the pipeline — one that isn't already a
 * PLATFORMS product. This is the manual half of the cockpit's two inflows (the other
 * being the always-on ideation agent). Creates a Hypothesis Card at the ideation stage
 * with no MVP yet (Gate 1 stays closed until you build + mark one).
 */
export function AddNewIdea({
  existing,
  gateOpen,
  untriaged,
}: {
  existing: string[]
  /** Rule 16 intake gate — false when the board has untriaged cards. */
  gateOpen: boolean
  untriaged: { product_slug: string; display_name: string | null }[]
}) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [overrideReason, setOverrideReason] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const slug = slugify(name)
  // Canonical-slug guard: the product_slug is the single identifier across cards,
  // PLATFORMS, IP campaigns and Connexions panels. Block a colliding slug so an idea
  // can never duplicate an existing card or product.
  const collides = slug.length >= 2 && new Set(existing).has(slug)
  const blocked = !gateOpen
  // When the gate is blocked, intake requires a written override reason (Rule 16).
  const canAdd = slug.length >= 2 && !collides && (!blocked || overrideReason.trim().length > 0)

  const add = () => {
    if (slug.length < 2) {
      setError('Give the idea a short name first.')
      return
    }
    if (collides) {
      setError(`'${slug}' already exists in the pipeline — open it instead of adding a duplicate.`)
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
            origin_summary: desc.trim() || `New idea: ${name.trim()}`,
            hypothesis_rows: [],
            status: 'ideation',
            pipeline_stage: 'ideation',
            build_status: 'none',
            mvp_ready: false,
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
        setName('')
        setDesc('')
        setOverrideReason('')
        router.refresh()
      } catch (e) {
        setError((e as Error).message)
      }
    })
  }

  return (
    <div className="rounded-lg border border-gray-border bg-gray-dark/40 p-5">
      <p className="text-sm uppercase tracking-wider text-accent font-medium mb-1">
        Add a brand-new idea
      </p>
      <p className="text-base text-gray-light/70 mb-4">
        Not already a portfolio product — a fresh idea (yours, or one the ideation agent
        surfaces). Lands at the ideation stage; build a thin MVP later to open Gate 1.
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="flex items-center justify-between text-sm uppercase tracking-wider text-gray-light/70">
            <span>Idea name</span>
            <span className={`font-mono normal-case ${name.length >= NAME_MAX ? 'text-yellow-300' : 'text-gray-light/40'}`}>
              {name.length}/{NAME_MAX}
            </span>
          </span>
          <input
            type="text"
            value={name}
            maxLength={NAME_MAX}
            onChange={(e) => setName(e.target.value.slice(0, NAME_MAX))}
            placeholder="e.g. Rehearsal coach for paramedics"
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-base text-white outline-none focus:border-accent"
          />
          {slug && (
            <span
              className={`mt-1 block text-sm font-mono ${
                collides ? 'text-yellow-300' : 'text-gray-light/50'
              }`}
            >
              slug: {slug}
              {collides ? ' · already in the pipeline — open it instead' : ''}
            </span>
          )}
        </label>
        <label className="block">
          <span className="text-sm uppercase tracking-wider text-gray-light/70">
            One-line description (optional)
          </span>
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="The problem + who it's for"
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-base text-white outline-none focus:border-accent"
          />
        </label>
      </div>

      {blocked && (
        <IntakeOverrideField untriaged={untriaged} value={overrideReason} onChange={setOverrideReason} />
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={add}
          disabled={pending || !canAdd}
          className="min-h-[44px] w-full rounded-lg border border-gray-border bg-black/20 px-4 py-2 text-sm hover:border-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
        >
          {pending ? 'Adding…' : blocked ? 'Override gate & add idea' : 'Add idea to pipeline'}
        </button>
        {error && <span className="text-sm text-red-300">Error: {error}</span>}
      </div>
    </div>
  )
}
