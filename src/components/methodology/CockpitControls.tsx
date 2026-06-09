'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ConfirmDialog } from './ConfirmDialog'
import { KNOWN_FEATURES, FEATURE_LABEL } from '@/lib/methodology/features'

interface CardFields {
  pipeline_stage: string | null
  monetisation_lane: string | null
  engine_cluster: string | null
  build_status: string | null
  mvp_url: string | null
  features: string[] | null
}

interface Props {
  productSlug: string
  initial: CardFields
  // Gate-1 readiness is harness-derived (the scorer), not an operator field — passed in from
  // the server (loadCardScore). The kick-off forms gate on this.
  mvpReady: boolean
}

const STAGES = ['ideation', 'feasibility', 'validation', 'go-no-go', 'build', 'ship']
const LANES = [
  { value: '', label: '—' },
  { value: '1-paid-saas', label: '1 · paid distributor-SaaS (primary)' },
  { value: '2-studio', label: '2 · studio-in-residence' },
  { value: '3-contract', label: '3 · contract build' },
  { value: '4-byok', label: '4 · BYOK (awareness)' },
]
const BUILDS = ['none', 'thin-mvp', 'fat-mvp', 'full']
const CAMPAIGN_TYPES = ['target-user', 'distributor-candidate'] as const
// Conditional features — which the product has drives the readiness scorer's applicability
// (a CONDITIONAL-* check reads N/A when its feature isn't selected here). The list + labels
// derive from the single source (lib/methodology/features) so the checkbox set never drifts
// from the PATCH validator, auto-enrollment, or the shared applicability canon.
const FEATURES = KNOWN_FEATURES

export function CockpitControls({ productSlug, initial, mvpReady }: Props) {
  const router = useRouter()

  // --- Card fields editor (lane / engine / stage / url / features) ---
  const [stage, setStage] = useState(initial.pipeline_stage ?? 'ideation')
  const [lane, setLane] = useState(initial.monetisation_lane ?? '')
  const [engine, setEngine] = useState(initial.engine_cluster ?? '')
  const [build, setBuild] = useState(initial.build_status ?? 'none')
  const [mvpUrl, setMvpUrl] = useState(initial.mvp_url ?? '')
  const [features, setFeatures] = useState<string[]>(initial.features ?? [])
  const toggleFeature = (f: string) =>
    setFeatures((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]))
  const [savePending, startSave] = useTransition()
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [saveErr, setSaveErr] = useState<string | null>(null)

  const gate1Open = mvpReady // harness-derived (the recorded readiness score), not a tickbox

  const saveFields = () => {
    setSaveMsg(null)
    setSaveErr(null)
    startSave(async () => {
      try {
        const res = await fetch(`/api/methodology/cards/${productSlug}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            pipeline_stage: stage,
            monetisation_lane: lane || null,
            engine_cluster: engine || null,
            build_status: build,
            mvp_url: mvpUrl || null,
            features,
          }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          setSaveErr(json.error ?? `HTTP ${res.status}`)
          return
        }
        setSaveMsg('Saved')
        router.refresh()
      } catch (e) {
        setSaveErr((e as Error).message)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Card fields */}
      <div className="rounded-lg border border-gray-border bg-gray-dark/40 p-5">
        <p className="text-sm uppercase tracking-wider text-accent font-medium mb-4">
          Pipeline fields
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="text-sm uppercase tracking-wider text-gray-light/70">Stage</span>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-base text-white outline-none focus:border-accent"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm uppercase tracking-wider text-gray-light/70">
              Monetisation lane
            </span>
            <select
              value={lane}
              onChange={(e) => setLane(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-base text-white outline-none focus:border-accent"
            >
              {LANES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm uppercase tracking-wider text-gray-light/70">
              Engine cluster
            </span>
            <input
              type="text"
              value={engine}
              onChange={(e) => setEngine(e.target.value)}
              placeholder="voice-coaching | property | outreach | compliance | standalone"
              className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-base text-white outline-none focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="text-sm uppercase tracking-wider text-gray-light/70">Build status</span>
            <select
              value={build}
              onChange={(e) => setBuild(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-base text-white outline-none focus:border-accent"
            >
              {BUILDS.map((b) => (
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
        <div className="mt-4 flex min-h-[44px] flex-wrap items-center gap-3 rounded-lg border border-gray-border bg-black/20 px-3 py-2 text-base">
          <span
            className={`shrink-0 text-xs px-2 py-0.5 rounded uppercase tracking-wider ${
              mvpReady ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-mid/40 text-gray-light/60'
            }`}
          >
            {mvpReady ? 'ready' : 'not ready'}
          </span>
          <span className="text-gray-light/80">
            Gate 1 (thin-MVP ready) — set by the harness, not by hand. It derives from the readiness
            score above (HARD gate passed + GO). Run <code className="text-accent">/naive-tester</code> to prove it.
          </span>
        </div>
        <fieldset className="mt-4">
          <legend className="text-sm uppercase tracking-wider text-gray-light/70 mb-2">
            Features (drives the readiness scorer&rsquo;s conditional checks)
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FEATURES.map((f) => (
              <label
                key={f}
                className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border border-gray-border bg-black/20 px-3 py-2 text-base text-gray-light"
              >
                <input
                  type="checkbox"
                  checked={features.includes(f)}
                  onChange={() => toggleFeature(f)}
                  className="h-5 w-5 rounded border-gray-700 bg-gray-900 accent-accent"
                />
                {FEATURE_LABEL[f]}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={saveFields}
            disabled={savePending}
            className="min-h-[44px] w-full rounded-lg border border-gray-border bg-black/20 px-4 py-2 text-sm hover:border-accent transition-colors disabled:opacity-50 sm:w-auto"
          >
            {savePending ? 'Saving…' : 'Save fields'}
          </button>
          {saveMsg && <span className="text-sm text-emerald-300">{saveMsg}</span>}
          {saveErr && <span className="text-sm text-red-300">Error: {saveErr}</span>}
        </div>
      </div>

      {/* Kick-off */}
      <KickoffPanel productSlug={productSlug} gate1Open={gate1Open} mvpUrl={mvpUrl} />
    </div>
  )
}

function KickoffPanel({
  productSlug,
  gate1Open,
  mvpUrl,
}: {
  productSlug: string
  gate1Open: boolean
  mvpUrl: string
}) {
  return (
    <div className="rounded-lg border border-gray-border bg-gray-dark/40 p-5">
      <p className="text-sm uppercase tracking-wider text-accent font-medium mb-1">
        Launch real research
      </p>
      {!gate1Open ? (
        <div className="rounded border border-yellow-500/30 bg-yellow-500/10 p-3 text-base text-yellow-200">
          Gate 1 closed — the thin MVP isn&rsquo;t harness-proven ready yet. Set the thin-MVP URL, then
          run <code>/naive-tester</code> against it (and <code>/voice-auditor</code> if voiced); once the
          HARD checks pass and the score reaches GO, this opens automatically. See the readiness panel above.
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-light/80 mb-4">
            Each launch creates a real InvestorPilot campaign + a Connexions voice panel and
            discovers real prospects (real prospect rows + API cost). Drafts are queued for your
            approval in InvestorPilot — <span className="text-white">nothing sends until you approve.</span>{' '}
            Outreach embeds: <code className="text-accent break-all">{mvpUrl}</code>
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {CAMPAIGN_TYPES.map((t) => (
              <KickoffForm key={t} productSlug={productSlug} campaignType={t} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const AUDIENCE_LABEL: Record<(typeof CAMPAIGN_TYPES)[number], string> = {
  'target-user': 'target users',
  'distributor-candidate': 'distributor candidates',
}

function KickoffForm({
  productSlug,
  campaignType,
}: {
  productSlug: string
  campaignType: (typeof CAMPAIGN_TYPES)[number]
}) {
  const router = useRouter()
  const [icp, setIcp] = useState('')
  const [questions, setQuestions] = useState('')
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const audience = AUDIENCE_LABEL[campaignType]

  const qList = questions
    .split('\n')
    .map((q) => q.trim())
    .filter(Boolean)
  const icpReady = icp.trim().length >= 10
  const questionsReady = qList.length >= 1
  const ready = icpReady && questionsReady

  const fire = () => {
    setConfirmOpen(false)
    setMsg(null)
    setErr(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/methodology/cards/${productSlug}/validate`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            campaign_type: campaignType,
            icp_description: icp,
            questions: qList,
          }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          setErr(json.error ?? `HTTP ${res.status}`)
          return
        }
        setMsg(json.connexions_warning ? `Launched (warn: ${json.connexions_warning})` : 'Launched')
        router.refresh()
      } catch (e) {
        setErr((e as Error).message)
      }
    })
  }

  return (
    <div className="rounded border border-gray-border/60 bg-black/20 p-3">
      <h4 className="text-base font-semibold capitalize mb-2">{campaignType.replace('-', ' ')}</h4>
      <textarea
        value={icp}
        onChange={(e) => setIcp(e.target.value)}
        rows={2}
        placeholder="ICP description (who we're reaching)"
        className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-2 text-base text-white outline-none focus:border-accent mb-2"
      />
      <textarea
        value={questions}
        onChange={(e) => setQuestions(e.target.value)}
        rows={3}
        placeholder="Questions, one per line"
        className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-2 text-base text-white outline-none focus:border-accent"
      />
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={pending || !ready}
        className="mt-3 min-h-[44px] w-full rounded-lg bg-accent px-3 py-2.5 text-sm font-medium text-black hover:bg-accent/90 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? 'Launching…' : `Launch real research — ${audience}`}
      </button>
      {!ready && (
        <p className="mt-2 text-sm text-yellow-300/90">
          {!icpReady && !questionsReady
            ? 'Add an ICP description (min 10 chars) and at least one question to launch.'
            : !icpReady
            ? 'Add an ICP description (min 10 chars) to launch.'
            : 'Add at least one question (one per line) to launch.'}
        </p>
      )}
      {msg && <p className="mt-2 text-sm text-emerald-300">{msg}</p>}
      {err && <p className="mt-2 text-sm text-red-300">Error: {err}</p>}

      <ConfirmDialog
        open={confirmOpen}
        title={`Launch real research — ${audience}?`}
        confirmLabel={`Launch — ${audience}`}
        tone="primary"
        pending={pending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={fire}
        body={
          <>
            <p>
              This creates a real InvestorPilot campaign + a Connexions voice panel for{' '}
              <span className="text-white">{audience}</span> on <span className="font-mono text-white">{productSlug}</span>,
              and triggers real prospect discovery (real prospect rows + API cost).
            </p>
            <p>
              Drafted research invites are queued at <span className="text-white">draft_ready</span> for your
              approval in InvestorPilot. <span className="text-white">Nothing is emailed until you approve it there.</span>
            </p>
            <p className="text-gray-light/70">
              {qList.length} question{qList.length === 1 ? '' : 's'} · ICP: {icp.trim().slice(0, 80)}
              {icp.trim().length > 80 ? '…' : ''}
            </p>
          </>
        }
      />
    </div>
  )
}
