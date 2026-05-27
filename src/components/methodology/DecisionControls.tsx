'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ConfirmDialog } from './ConfirmDialog'

interface Props {
  productSlug: string
  currentStatus: string
  currentReason: string | null
  /** The latest persisted proposal (Build #3) — loaded server-side so it survives reload. */
  initialProposal?: ProposeResponse | null
  initialProposalMeta?: ProposalMeta | null
}

type Decision =
  | 'redesign-to-fit'
  | 'personal-interest-override'
  | 'kill'
  | 'validation-in-flight'

// ── Build #3 — the harness-proposed decision (POST /propose). ──
type Band = 'GO' | 'REDESIGN' | 'NO-GO'
interface JudgedDimension { score: number; confidence: string; rationale: string }
interface ScoreResult {
  gate: { score: number; threshold: number; passed: boolean; overridden: boolean }
  composite: number
  band: Band
  dimensions: { key: string; label: string; score: number; weight: number; missing: boolean }[]
}
interface Proposal {
  mode: 'hypothesis' | 'evidence'
  score: ScoreResult
  judged: Record<string, JudgedDimension>
  suggested: { gate: string; action: string; label: string }
  recommended_status: string
}
export interface ProposeResponse {
  hypothesis: Proposal
  evidence: Proposal | null
  evidence_error?: string
  interview_counts: { distributor: number; end_user: number }
}

/** Snapshot metadata the server passes alongside a persisted proposal (Build #3 persistence). */
export interface ProposalMeta {
  createdAt: string
  /** True when more interviews have landed since the snapshot was scored — prompts a re-score. */
  stale: boolean
  snapshotInterviewTotal: number
  currentInterviewTotal: number
}

const BAND_STYLE: Record<Band, string> = {
  GO: 'bg-emerald-500/20 text-emerald-300',
  REDESIGN: 'bg-yellow-500/20 text-yellow-200',
  'NO-GO': 'bg-red-500/20 text-red-300',
}

// The proposal's recommended_status maps onto one of the operator's decision buttons.
const VALID_DECISIONS = new Set<Decision>([
  'redesign-to-fit',
  'personal-interest-override',
  'kill',
  'validation-in-flight',
])

/** Build the pre-filled reason from a proposal — the evidence the operator is confirming. */
function proposalReason(p: Proposal): string {
  const dims = p.score.dimensions
    .filter((d) => d.key !== 'onsell')
    .map((d) => `${d.key} ${d.score}`)
    .join(', ')
  const gate = `onsell ${p.score.gate.score}/10 ${p.score.gate.passed ? 'pass' : 'FAIL'}${p.score.gate.overridden ? ' (overridden)' : ''}`
  return `[${p.mode} · ${p.score.band} ${p.score.composite}/10] ${gate}; ${dims}.`
}

/** The cockpit decision a proposal recommends, if its recommended_status maps to a button. */
function recommendedFrom(json: ProposeResponse): Decision | null {
  const p = json.evidence ?? json.hypothesis
  const rec = p?.recommended_status as Decision | undefined
  return rec && VALID_DECISIONS.has(rec) ? rec : null
}

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

export function DecisionControls({
  productSlug,
  currentStatus,
  currentReason,
  initialProposal,
  initialProposalMeta,
}: Props) {
  const router = useRouter()
  // Pre-fill the reason from the persisted proposal only when the operator hasn't recorded one.
  const [reason, setReason] = useState(
    currentReason ?? (initialProposal ? proposalReason(initialProposal.evidence ?? initialProposal.hypothesis) : '')
  )
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  // The terminal decision awaiting confirmation (null = no dialog open).
  const [pendingDecision, setPendingDecision] = useState<Decision | null>(null)

  // Build #3 — harness proposal state. Hydrated from the latest persisted snapshot so the LLM
  // pass survives reload (no re-billing) and shows the operator what the machine last proposed.
  const [proposing, setProposing] = useState(false)
  const [proposeErr, setProposeErr] = useState<string | null>(null)
  const [proposal, setProposal] = useState<ProposeResponse | null>(initialProposal ?? null)
  // The decision the proposal recommends — highlighted, and used to pre-fill the reason.
  const [recommended, setRecommended] = useState<Decision | null>(
    initialProposal ? recommendedFrom(initialProposal) : null
  )
  // Snapshot metadata (when scored + staleness) — null until a proposal exists.
  const [meta, setMeta] = useState<ProposalMeta | null>(initialProposalMeta ?? null)

  // Prefer the evidence (Gate 2) proposal when present; else the hypothesis (Gate 0) baseline.
  const shown: Proposal | null = proposal ? proposal.evidence ?? proposal.hypothesis : null
  // The cockpit decision the proposal pre-fills — its label is what the operator must see as the
  // recommendation, so the headline agrees with the highlighted "proposed" button (the proposer's
  // own `suggested.label` is demoted to band rationale; a REDESIGN band maps to KEEP VALIDATING,
  // NOT the terminally-named "GO (redesign to fit)" button — surfacing the raw label contradicted it).
  const recommendedDecision = recommended ? DECISIONS.find((d) => d.value === recommended) ?? null : null

  const runPropose = () => {
    setProposeErr(null)
    setProposing(true)
    setProposal(null)
    setRecommended(null)
    setMeta(null)
    ;(async () => {
      try {
        const res = await fetch(`/api/methodology/cards/${productSlug}/propose`, { method: 'POST' })
        const json = (await res.json().catch(() => ({}))) as ProposeResponse & { error?: string }
        if (!res.ok && res.status !== 207) {
          setProposeErr(json.error ?? `HTTP ${res.status}`)
          return
        }
        setProposal(json)
        // A fresh score is current — persisted server-side; mirror that here so the panel reflects it.
        const total = (json.interview_counts?.distributor ?? 0) + (json.interview_counts?.end_user ?? 0)
        setMeta({ createdAt: new Date().toISOString(), stale: false, snapshotInterviewTotal: total, currentInterviewTotal: total })
        const p = json.evidence ?? json.hypothesis
        const rec = recommendedFrom(json)
        if (rec) {
          setRecommended(rec)
          setReason(proposalReason(p)) // pre-fill — the operator still confirms
        }
      } catch (e) {
        setProposeErr((e as Error).message)
      } finally {
        setProposing(false)
      }
    })()
  }

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
      {/* Build #3 — harness-proposed decision. Reads recorded evidence + scores the §5 rubric;
          the operator confirms or overrides. Incurs LLM cost; fires no outreach. */}
      <div className="mb-5 rounded-lg border border-gray-border/60 bg-black/20 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Propose from evidence</p>
            <p className="text-sm text-gray-light/70">
              Scores the §5 demand rubric from the idea card (Gate 0) and the interview streams
              (Gate 2 — when responses exist). LLM cost; no outreach. You still confirm below.
            </p>
          </div>
          <button
            type="button"
            onClick={runPropose}
            disabled={proposing}
            title="Run the §5 demand scorer over recorded evidence and propose a decision (incurs LLM cost; fires no outreach)."
            className="min-h-[44px] shrink-0 rounded-lg border border-accent/50 bg-accent/10 px-4 py-2 text-sm text-accent hover:bg-accent/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {proposing ? 'Scoring…' : proposal ? (meta?.stale ? 'Re-score (stale)' : 'Re-score') : 'Propose decision'}
          </button>
        </div>

        {proposeErr && <p className="mt-3 text-sm text-red-300">Error: {proposeErr}</p>}
        {proposal?.evidence_error && (
          <p className="mt-3 text-sm text-yellow-200">
            Evidence pass failed ({proposal.evidence_error}) — showing the desk (Gate 0) proposal.
          </p>
        )}

        {shown && (
          <div className="mt-4 space-y-3">
            {meta && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-gray-light/50">Scored {new Date(meta.createdAt).toLocaleString()}</span>
                {meta.stale ? (
                  <span className="rounded bg-yellow-500/15 px-2 py-0.5 text-yellow-200">
                    Stale — {meta.currentInterviewTotal} interviews now vs {meta.snapshotInterviewTotal} when scored; re-score to refresh.
                  </span>
                ) : (
                  <span className="rounded bg-gray-mid/30 px-2 py-0.5 text-gray-light/50">saved · survives reload</span>
                )}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm uppercase tracking-wider text-gray-light/60">
                {shown.mode === 'evidence' ? 'Gate 2 · evidence' : 'Gate 0 · desk hypothesis'}
              </span>
              <span className={`text-sm px-2 py-0.5 rounded uppercase tracking-wider ${BAND_STYLE[shown.score.band]}`}>
                {shown.score.band} · {shown.score.composite}/10
              </span>
              <span className={`text-sm px-2 py-0.5 rounded ${shown.score.gate.passed ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}`}>
                onsell gate {shown.score.gate.score}/10 {shown.score.gate.passed ? 'pass' : 'FAIL'}
                {shown.score.gate.overridden ? ' (overridden)' : ''}
              </span>
              {proposal && shown.mode === 'evidence' && (
                <span className="text-sm text-gray-light/50">
                  {proposal.interview_counts.distributor} distributor · {proposal.interview_counts.end_user} end-user interviews
                </span>
              )}
            </div>

            <ul className="grid gap-2 sm:grid-cols-2">
              {shown.score.dimensions.map((d) => {
                const j = shown.judged[d.key]
                return (
                  <li key={d.key} className="rounded border border-gray-border/50 bg-black/20 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-white">{d.label}</span>
                      <span className="text-sm font-mono text-accent">
                        {d.missing ? 'not scored' : `${d.score}/10`}
                        {d.key !== 'onsell' && <span className="text-gray-light/40"> · w{d.weight}</span>}
                        {!d.missing && j?.confidence && (
                          <span className="text-gray-light/40"> · {j.confidence} conf</span>
                        )}
                      </span>
                    </div>
                    {j?.rationale && <p className="mt-1 text-sm text-gray-light/70">{j.rationale}</p>}
                  </li>
                )
              })}
            </ul>

            <p className="text-sm text-gray-light/50">
              Composite = weighted average of pain · gap · reach · build-fit (the weights shown). Onsell
              is the §5 hard gate (pass/fail), scored but not folded into the composite. A dimension shown
              as &ldquo;not scored&rdquo; was counted as 0 (prove, don&rsquo;t assume), not skipped.
            </p>

            <p className="text-sm text-gray-light">
              <span className="text-gray-light/60">Recommends:</span>{' '}
              {recommendedDecision ? (
                <>
                  <span className="text-white">{recommendedDecision.label}</span>
                  <span className="text-gray-light/60">
                    {' '}— {shown.score.band} band ({shown.suggested.label}). Pre-filled below; review the reason, then confirm.
                  </span>
                </>
              ) : (
                <>
                  <span className="text-white">{shown.suggested.label}</span>
                  <span className="text-gray-light/60"> — no matching decision button; choose one below.</span>
                </>
              )}
            </p>
          </div>
        )}
      </div>

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
            } ${recommended === d.value ? 'ring-2 ring-accent' : ''}`}
          >
            <div
              className={`text-sm font-semibold uppercase tracking-wider mb-1 ${
                d.value === 'kill' ? 'text-red-300' : 'text-accent'
              }`}
            >
              {d.label}
              {recommended === d.value && (
                <span className="ml-2 rounded bg-accent/20 px-1.5 py-0.5 text-[10px] tracking-normal text-accent">
                  proposed
                </span>
              )}
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
