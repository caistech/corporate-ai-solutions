'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type BuildType = 'product' | 'shared-service' | 'infra-product-candidate'

const BUILD_TYPES: { value: BuildType; label: string }[] = [
  { value: 'product', label: 'Product' },
  { value: 'shared-service', label: 'Shared service' },
  { value: 'infra-product-candidate', label: 'Infra · product-candidate' },
]

// The idea-card fields, in order. ⚑ = gate-critical (a card can't pass its review
// gates while these are blank/hand-wavy — named demand, build-vs-buy, lane+distributor,
// the go/no-go decisions).
//
// `distributor` + `end_user_pool` are the TWO research-pool hypotheses (build #4): the
// candidate pool to onsell through, and the candidate pool of end users. The pool-discovery
// loop reads them — the LLM evidence-checks each (real? reachable?), rejects weak ones and
// proposes better-fit pools, and the agreed pools become the ICP for the two validation streams.
const FIELDS: { key: string; label: string; critical?: boolean }[] = [
  { key: 'one_liner', label: 'One-liner' },
  { key: 'problem', label: 'Problem' },
  { key: 'demand_evidence', label: 'Demand evidence', critical: true },
  { key: 'wedge', label: 'Wedge' },
  { key: 'scope', label: 'Scope' },
  { key: 'architecture', label: 'Architecture (build vs buy)', critical: true },
  { key: 'build_sequence', label: 'Build sequence' },
  { key: 'shared_layers', label: 'Shared layers' },
  { key: 'lane', label: 'Lane' },
  { key: 'distributor', label: 'Distributor pool (who would onsell)', critical: true },
  { key: 'end_user_pool', label: 'End-user pool (who would use — the research pool)' },
  { key: 'risks_open_questions', label: 'Risks & open questions' },
  { key: 'decisions_needed', label: 'Decisions needed', critical: true },
  { key: 'commercial_structure', label: 'Commercial structure' },
  { key: 'source_artifact', label: 'Source' },
]

/**
 * Editable idea-card + the build-type first gate. This is where the office-hours
 * interview's output lands and gets refined as the card matures. Saves the whole
 * idea_card JSONB + build_type via PATCH /api/methodology/cards/[slug].
 */
export function IdeaCardEditor({
  slug,
  initialBuildType,
  initialIdeaCard,
}: {
  slug: string
  initialBuildType: string | null
  initialIdeaCard: Record<string, string> | null
}) {
  const router = useRouter()
  const [buildType, setBuildType] = useState<BuildType>((initialBuildType as BuildType) ?? 'product')
  const [fields, setFields] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const f of FIELDS) init[f.key] = initialIdeaCard?.[f.key] ?? ''
    return init
  })
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  // Unsaved-edit guard: the page is heavy and can crash mid-edit (self-audit
  // finding) — warn before a navigation/close drops a long, unsaved idea-card.
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const save = () => {
    setMsg(null)
    startTransition(async () => {
      const idea_card: Record<string, string> = {}
      for (const [k, v] of Object.entries(fields)) if (v.trim()) idea_card[k] = v.trim()
      try {
        const res = await fetch(`/api/methodology/cards/${slug}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ build_type: buildType, idea_card }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          setMsg({ ok: false, text: json.error ?? `HTTP ${res.status}` })
          return
        }
        setMsg({ ok: true, text: 'Saved.' })
        setDirty(false)
        router.refresh()
      } catch (e) {
        setMsg({ ok: false, text: (e as Error).message })
      }
    })
  }

  const ta =
    'mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-base text-white outline-none focus:border-accent'

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm uppercase tracking-wider text-gray-light/70 mb-2">Build type — the first gate</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {BUILD_TYPES.map((b) => {
            const active = buildType === b.value
            return (
              <button
                key={b.value}
                type="button"
                onClick={() => { setBuildType(b.value); setDirty(true) }}
                aria-pressed={active}
                className={`min-h-[44px] rounded-lg border px-3 py-2 text-sm ${
                  active
                    ? 'border-accent bg-accent/10 text-white'
                    : 'border-gray-border bg-black/20 text-gray-light hover:border-gray-500'
                }`}
              >
                {b.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-3">
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="text-xs uppercase tracking-wider text-accent font-medium">
              {f.critical && <span title="Gate-critical">⚑ </span>}
              {f.label}
            </span>
            <textarea
              rows={f.key === 'one_liner' ? 2 : 3}
              value={fields[f.key]}
              onChange={(e) => { setFields((s) => ({ ...s, [f.key]: e.target.value })); setDirty(true) }}
              className={ta}
              placeholder={f.critical ? 'Gate-critical — be concrete (a named human, not “a market”).' : undefined}
            />
          </label>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="min-h-[44px] rounded-lg bg-accent px-5 text-sm font-medium text-black hover:bg-accent/90 disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save idea card'}
        </button>
        {msg && <span className={`text-sm ${msg.ok ? 'text-emerald-300' : 'text-red-300'}`}>{msg.text}</span>}
      </div>
    </div>
  )
}
