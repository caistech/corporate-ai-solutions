'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ConfirmDialog } from './ConfirmDialog'

// Build #4 operator surface — the pool-discovery loop on the card detail page.
// Assess the two captured pool hypotheses (Brave evidence + LLM verdict + proposed better-fit
// pool), optionally accept a proposal, preview the LLM-derived stream ICPs, then launch both
// InvestorPilot streams from those derived specs (no operator-typed ICP). Consequence-clarity:
// launching fires real discovery + API cost via the existing validate route.

type Verdict = 'real-reachable' | 'weak' | 'reject'
interface ProposedPool { description: string; rationale: string }
interface Assessment {
  kind: 'distributor' | 'end-user'
  hypothesis: string
  verdict: Verdict
  rationale: string
  proposed_pool: ProposedPool | null
  evidence_count: number
}
interface AssessResponse {
  assessments: { distributor: Assessment; endUser: Assessment }
  both_real_reachable: boolean
}
interface StreamSpec { campaign_type: string; icp_description: string; questions: string[] }
interface LaunchResult { campaign_type: string; status: number; body: unknown }

const MIN = 12
const VERDICT_STYLE: Record<Verdict, string> = {
  'real-reachable': 'bg-emerald-500/20 text-emerald-300',
  weak: 'bg-yellow-500/20 text-yellow-200',
  reject: 'bg-red-500/20 text-red-300',
}
// idea_card key that backs each pool kind.
const POOL_FIELD: Record<'distributor' | 'end-user', 'distributor' | 'end_user_pool'> = {
  distributor: 'distributor',
  'end-user': 'end_user_pool',
}

export function PoolDiscoveryPanel({
  slug,
  distributorPool,
  endUserPool,
}: {
  slug: string
  distributorPool: string | null
  endUserPool: string | null
}) {
  const router = useRouter()
  const distOk = (distributorPool ?? '').trim().length >= MIN
  const euOk = (endUserPool ?? '').trim().length >= MIN
  const poolsCaptured = distOk && euOk

  const [assessing, startAssess] = useTransition()
  const [assessment, setAssessment] = useState<AssessResponse | null>(null)
  const [previewing, startPreview] = useTransition()
  const [specs, setSpecs] = useState<StreamSpec[] | null>(null)
  const [launching, startLaunch] = useTransition()
  const [launchResults, setLaunchResults] = useState<LaunchResult[] | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [acceptingKind, setAcceptingKind] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const post = async (path: string, body?: unknown) => {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
    return json
  }

  const runAssess = () =>
    startAssess(async () => {
      setErr(null)
      setSpecs(null)
      setLaunchResults(null)
      try {
        setAssessment((await post(`/api/methodology/cards/${slug}/pools/assess`)) as AssessResponse)
        router.refresh() // pool_evidence is now persisted on the card
      } catch (e) {
        setErr((e as Error).message)
      }
    })

  // Accept a proposed pool: merge into the FULL idea_card (PATCH replaces the JSONB), then refresh.
  const acceptProposal = (kind: 'distributor' | 'end-user', description: string) =>
    startAssess(async () => {
      setErr(null)
      setAcceptingKind(kind)
      try {
        const cardRes = await fetch(`/api/methodology/cards/${slug}`)
        const cardJson = await cardRes.json().catch(() => ({}))
        if (!cardRes.ok) throw new Error(cardJson.error ?? `HTTP ${cardRes.status}`)
        const ideaCard = (cardJson.card?.idea_card ?? {}) as Record<string, string>
        const merged = { ...ideaCard, [POOL_FIELD[kind]]: description }
        const res = await fetch(`/api/methodology/cards/${slug}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ idea_card: merged }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
        setAssessment(null) // stale once a pool changes — re-assess
        router.refresh()
      } catch (e) {
        setErr((e as Error).message)
      } finally {
        setAcceptingKind(null)
      }
    })

  const runPreview = () =>
    startPreview(async () => {
      setErr(null)
      setLaunchResults(null)
      try {
        const json = (await post(`/api/methodology/cards/${slug}/pools/launch`, { dry_run: true })) as { specs: StreamSpec[] }
        setSpecs(json.specs)
      } catch (e) {
        setErr((e as Error).message)
      }
    })

  const runLaunch = () =>
    startLaunch(async () => {
      setConfirmOpen(false)
      setErr(null)
      try {
        const json = (await post(`/api/methodology/cards/${slug}/pools/launch`, {})) as { results: LaunchResult[] }
        setLaunchResults(json.results)
        router.refresh()
      } catch (e) {
        setErr((e as Error).message)
      }
    })

  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold mb-2">Pool discovery</h2>
      {/* Explanatory header — what / do / why. */}
      <p className="mb-4 text-sm text-gray-light/80 max-w-2xl">
        The two research pools (captured above via the office-hours dialogue) are pressure-tested
        here: assess checks each is a real, reachable population and proposes a sharper one if not;
        launch then derives each stream&rsquo;s ICP + questions from the agreed pools and creates both
        InvestorPilot streams — so you never hand-type an ICP. This is the front door to dual-stream
        validation.
      </p>

      <div className="rounded-lg border border-gray-border bg-gray-dark/40 p-5 space-y-5">
        {/* The two pools */}
        <div className="grid gap-3 md:grid-cols-2">
          {([
            ['distributor', 'Distributor pool (who would onsell)', distributorPool, distOk],
            ['end-user', 'End-user pool (who would use)', endUserPool, euOk],
          ] as const).map(([kind, label, value, ok]) => (
            <div key={kind} className="rounded border border-gray-border/60 bg-black/20 p-3">
              <p className="text-xs uppercase tracking-wider text-accent font-medium mb-1">{label}</p>
              <p className={`text-sm ${ok ? 'text-white' : 'text-yellow-300/90'}`}>
                {ok ? value : 'Not captured — run the office-hours dialogue (Talk to Morgan) and save it on the idea card above.'}
              </p>
            </div>
          ))}
        </div>

        {!poolsCaptured && (
          <p className="rounded border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-200">
            Capture both pools on the idea card before assessing — a product can&rsquo;t validate without them.
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={runAssess}
            disabled={!poolsCaptured || assessing}
            className="min-h-[44px] w-full rounded-lg border border-gray-border bg-black/20 px-4 py-2 text-sm hover:border-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
          >
            {assessing && !acceptingKind ? 'Assessing…' : 'Assess pools (Brave + LLM)'}
          </button>
          <button
            type="button"
            onClick={runPreview}
            disabled={!poolsCaptured || previewing}
            className="min-h-[44px] w-full rounded-lg border border-gray-border bg-black/20 px-4 py-2 text-sm hover:border-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
          >
            {previewing ? 'Deriving…' : 'Preview derived streams'}
          </button>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={!poolsCaptured || launching}
            className="min-h-[44px] w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-black hover:bg-accent/90 transition-colors disabled:bg-gray-border disabled:text-gray-light/60 disabled:cursor-not-allowed sm:w-auto"
          >
            {launching ? 'Launching…' : 'Launch both streams'}
          </button>
        </div>
        {err && <p className="text-sm text-red-300">Error: {err}</p>}

        {/* Assessment results */}
        {assessment && (
          <div className="space-y-3 border-t border-gray-border/60 pt-4">
            <p className="text-xs uppercase tracking-wider text-gray-light/70">Assessment</p>
            {[assessment.assessments.distributor, assessment.assessments.endUser].map((a) => (
              <div key={a.kind} className="rounded border border-gray-border/60 bg-black/20 p-3">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs uppercase tracking-wider text-accent font-medium">{a.kind}</span>
                  <span className={`text-xs px-2 py-0.5 rounded uppercase tracking-wider ${VERDICT_STYLE[a.verdict]}`}>
                    {a.verdict}
                  </span>
                  <span className="text-xs text-gray-light/50">{a.evidence_count} evidence results</span>
                </div>
                <p className="text-sm text-gray-light">{a.rationale}</p>
                {a.proposed_pool && (
                  <div className="mt-2 rounded border border-accent/30 bg-accent/5 p-2">
                    <p className="text-xs text-gray-light/70 mb-1">Proposed sharper pool:</p>
                    <p className="text-sm text-white">{a.proposed_pool.description}</p>
                    <p className="text-xs text-gray-light/60 mt-1">{a.proposed_pool.rationale}</p>
                    <button
                      type="button"
                      onClick={() => acceptProposal(a.kind, a.proposed_pool!.description)}
                      disabled={assessing}
                      className="mt-2 min-h-[44px] rounded-lg border border-accent/50 bg-accent/10 px-3 py-1.5 text-sm text-accent hover:bg-accent/20 transition-colors disabled:opacity-50"
                    >
                      {acceptingKind === a.kind ? 'Applying…' : 'Use this proposal'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Derived stream preview */}
        {specs && (
          <div className="space-y-3 border-t border-gray-border/60 pt-4">
            <p className="text-xs uppercase tracking-wider text-gray-light/70">Derived streams (preview — nothing fired)</p>
            {specs.map((s) => (
              <div key={s.campaign_type} className="rounded border border-gray-border/60 bg-black/20 p-3">
                <p className="text-xs uppercase tracking-wider text-accent font-medium mb-1">{s.campaign_type.replace('-', ' ')}</p>
                <p className="text-sm text-white">{s.icp_description}</p>
                <ul className="mt-2 list-disc pl-5 text-sm text-gray-light/80">
                  {s.questions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Launch outcome */}
        {launchResults && (
          <div className="space-y-2 border-t border-gray-border/60 pt-4">
            <p className="text-xs uppercase tracking-wider text-gray-light/70">Launch result</p>
            {launchResults.map((r) => (
              <p key={r.campaign_type} className={`text-sm ${r.status >= 200 && r.status < 300 ? 'text-emerald-300' : 'text-red-300'}`}>
                {r.campaign_type}: HTTP {r.status}
                {r.status < 200 || r.status >= 300 ? ` — ${(r.body as { error?: string })?.error ?? 'failed'}` : ' — launched'}
              </p>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Launch both validation streams?"
        confirmLabel="Derive & launch both"
        tone="primary"
        pending={launching}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={runLaunch}
        body={
          <>
            <p>
              This derives each stream&rsquo;s ICP + questions from the agreed pools and creates BOTH a
              distributor-candidate and a target-user campaign on{' '}
              <span className="font-mono text-white">{slug}</span> — real InvestorPilot campaigns +
              Connexions voice panels + real prospect discovery (real prospect rows + API cost).
            </p>
            <p>
              Drafted invites queue at <span className="text-white">draft_ready</span> for your approval
              in InvestorPilot — <span className="text-white">nothing emails until you approve it there.</span>{' '}
              Gate 1 must be harness-proven ready or the validate route will refuse.
            </p>
          </>
        }
      />
    </section>
  )
}
