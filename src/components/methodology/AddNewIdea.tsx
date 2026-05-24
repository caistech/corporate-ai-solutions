'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

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
export function AddNewIdea({ existing }: { existing: string[] }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const slug = slugify(name)
  // Canonical-slug guard: the product_slug is the single identifier across cards,
  // PLATFORMS, IP campaigns and Connexions panels. Block a colliding slug so an idea
  // can never duplicate an existing card or product.
  const collides = slug.length >= 2 && new Set(existing).has(slug)

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
            pipeline_stage: 'ideation',
            build_status: 'none',
            mvp_ready: false,
          }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          setError(json.error ?? `HTTP ${res.status}`)
          return
        }
        setName('')
        setDesc('')
        router.refresh()
      } catch (e) {
        setError((e as Error).message)
      }
    })
  }

  return (
    <div className="rounded-lg border border-gray-border bg-gray-dark/40 p-5">
      <p className="text-xs uppercase tracking-wider text-accent font-medium mb-1">
        Add a brand-new idea
      </p>
      <p className="text-xs text-gray-light/70 mb-4">
        Not already a portfolio product — a fresh idea (yours, or one the ideation agent
        surfaces). Lands at the ideation stage; build a thin MVP later to open Gate 1.
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-gray-light/70">Idea name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rehearsal coach for paramedics"
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-accent"
          />
          {slug && (
            <span
              className={`mt-1 block text-xs font-mono ${
                collides ? 'text-yellow-300' : 'text-gray-light/50'
              }`}
            >
              slug: {slug}
              {collides ? ' · already in the pipeline — open it instead' : ''}
            </span>
          )}
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-gray-light/70">
            One-line description (optional)
          </span>
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="The problem + who it's for"
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-accent"
          />
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={add}
          disabled={pending || slug.length < 2 || collides}
          className="rounded-lg border border-gray-border bg-black/20 px-4 py-2 text-sm hover:border-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? 'Adding…' : 'Add idea to pipeline'}
        </button>
        {error && <span className="text-xs text-red-300">Error: {error}</span>}
      </div>
    </div>
  )
}
