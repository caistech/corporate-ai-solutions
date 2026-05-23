'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  productSlug: string
  currentStatus: string
  currentReason: string | null
}

type Decision =
  | 'redesign-to-fit'
  | 'personal-interest-override'
  | 'kill'
  | 'validation-in-flight'

const DECISIONS: { value: Decision; label: string; description: string }[] = [
  {
    value: 'redesign-to-fit',
    label: 'REDESIGN-TO-FIT',
    description: 'Distributor identified + reachable + wedge confirmed. Proceed to redesign per Rule 15.',
  },
  {
    value: 'personal-interest-override',
    label: 'PERSONAL-INTEREST',
    description: 'No distributor / scratching an itch. Model B pricing. Not load-bearing.',
  },
  {
    value: 'kill',
    label: 'KILL',
    description: 'No distributor + no personal interest. Archive.',
  },
  {
    value: 'validation-in-flight',
    label: 'KEEP VALIDATING',
    description: 'Defer decision. Need more responses or fresh dialogue iteration.',
  },
]

export function DecisionControls({ productSlug, currentStatus, currentReason }: Props) {
  const router = useRouter()
  const [reason, setReason] = useState(currentReason ?? '')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const isTerminal =
    currentStatus === 'redesign-to-fit' ||
    currentStatus === 'personal-interest-override' ||
    currentStatus === 'kill'

  const submit = (decision: Decision) => {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/methodology/cards/${productSlug}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ status: decision, decision_reason: reason || null }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          setError(json.error ?? `HTTP ${res.status}`)
          return
        }
        setSuccess(`Set to ${decision}`)
        router.refresh()
      } catch (e) {
        setError((e as Error).message)
      }
    })
  }

  return (
    <div className="rounded-lg border border-gray-border bg-gray-dark/40 p-5">
      {isTerminal && (
        <div className="mb-4 rounded border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-200">
          A terminal decision is already set ({currentStatus}). Selecting a new one will overwrite the prior decision.
        </div>
      )}

      <label className="block mb-3">
        <span className="text-xs uppercase tracking-wider text-gray-light/70">Reason (required for terminal decisions)</span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="One-sentence rationale for the chosen decision (e.g. 'Talent agencies validated 9/10; reachable warm via Karen's network')"
          className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-accent"
        />
      </label>

      <div className="grid sm:grid-cols-2 gap-3">
        {DECISIONS.map((d) => (
          <button
            key={d.value}
            type="button"
            onClick={() => submit(d.value)}
            disabled={pending}
            className="text-left p-3 rounded-lg border border-gray-border bg-black/20 hover:border-accent hover:bg-black/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-accent mb-1">
              {d.label}
            </div>
            <div className="text-xs text-gray-light">{d.description}</div>
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-300">Error: {error}</p>
      )}
      {success && (
        <p className="mt-3 text-sm text-emerald-300">{success}</p>
      )}
    </div>
  )
}
