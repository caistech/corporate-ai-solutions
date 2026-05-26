'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ConfirmDialog } from './ConfirmDialog'

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

const DECISIONS: { value: Decision; label: string; description: string; terminal: boolean }[] = [
  {
    value: 'redesign-to-fit',
    label: 'GO (redesign to fit)',
    description: 'The green light: distributor identified + reachable + wedge confirmed. Proceed to build, redesigning to fit per Rule 15.',
    terminal: true,
  },
  {
    value: 'personal-interest-override',
    label: 'PERSONAL-INTEREST',
    description: 'No distributor / scratching an itch. Model B pricing. Not load-bearing.',
    terminal: true,
  },
  {
    value: 'kill',
    label: 'KILL',
    description: 'No distributor + no personal interest. Archive.',
    terminal: true,
  },
  {
    value: 'validation-in-flight',
    label: 'KEEP VALIDATING',
    description: 'Defer decision. Need more responses or fresh dialogue iteration.',
    terminal: false,
  },
]

export function DecisionControls({ productSlug, currentStatus, currentReason }: Props) {
  const router = useRouter()
  const [reason, setReason] = useState(currentReason ?? '')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  // The terminal decision awaiting confirmation (null = no dialog open).
  const [pendingDecision, setPendingDecision] = useState<Decision | null>(null)

  const isTerminal =
    currentStatus === 'redesign-to-fit' ||
    currentStatus === 'personal-interest-override' ||
    currentStatus === 'kill'

  const reasonGiven = reason.trim().length > 0

  const run = (decision: Decision) => {
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

  const onClick = (d: (typeof DECISIONS)[number]) => {
    setError(null)
    setSuccess(null)
    if (d.terminal) {
      // Irreversible — require a reason, then confirm before firing.
      if (!reasonGiven) {
        setError('A reason is required before a terminal decision (REDESIGN / PERSONAL-INTEREST / KILL).')
        return
      }
      setPendingDecision(d.value)
      return
    }
    run(d.value)
  }

  const pendingMeta = DECISIONS.find((d) => d.value === pendingDecision)

  return (
    <div className="rounded-lg border border-gray-border bg-gray-dark/40 p-5">
      {isTerminal && (
        <div className="mb-4 rounded border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-200">
          A terminal decision is already set ({currentStatus}). Selecting a new one will overwrite the prior decision.
        </div>
      )}

      <label className="block mb-3">
        <span className="text-sm uppercase tracking-wider text-gray-light/70">Reason (required for terminal decisions)</span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="One-sentence rationale for the chosen decision (e.g. 'Talent agencies validated 9/10; reachable warm via Karen's network')"
          className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-base text-white outline-none focus:border-accent"
        />
      </label>

      <div className="grid sm:grid-cols-2 gap-3">
        {DECISIONS.map((d) => (
          <button
            key={d.value}
            type="button"
            onClick={() => onClick(d)}
            disabled={pending}
            className={`min-h-[44px] text-left p-3 rounded-lg border bg-black/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              d.value === 'kill'
                ? 'border-red-500/40 hover:border-red-400 hover:bg-red-500/10'
                : 'border-gray-border hover:border-accent hover:bg-black/40'
            }`}
          >
            <div
              className={`text-sm font-semibold uppercase tracking-wider mb-1 ${
                d.value === 'kill' ? 'text-red-300' : 'text-accent'
              }`}
            >
              {d.label}
            </div>
            <div className="text-sm text-gray-light">{d.description}</div>
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-300">Error: {error}</p>
      )}
      {success && (
        <p className="mt-3 text-sm text-emerald-300">{success}</p>
      )}

      <ConfirmDialog
        open={pendingDecision !== null}
        title={
          pendingDecision === 'kill'
            ? 'Kill this card?'
            : `Set decision: ${pendingMeta?.label ?? ''}?`
        }
        confirmLabel={pendingDecision === 'kill' ? 'Kill it' : `Set ${pendingMeta?.label ?? ''}`}
        tone={pendingDecision === 'kill' ? 'danger' : 'primary'}
        pending={pending}
        onCancel={() => setPendingDecision(null)}
        onConfirm={() => {
          const d = pendingDecision
          setPendingDecision(null)
          if (d) run(d)
        }}
        body={
          <>
            <p>
              {pendingDecision === 'kill' ? (
                <>
                  This records a <span className="text-red-300">KILL</span> decision on{' '}
                  <span className="font-mono text-white">{productSlug}</span> and stamps it as decided.
                  It supersedes any prior decision.
                </>
              ) : (
                <>
                  This records a terminal <span className="text-white">{pendingMeta?.label}</span> decision on{' '}
                  <span className="font-mono text-white">{productSlug}</span> and stamps it as decided.
                  It supersedes any prior decision.
                </>
              )}
            </p>
            <p className="text-gray-light/70">Reason: {reason.trim()}</p>
          </>
        }
      />
    </div>
  )
}
