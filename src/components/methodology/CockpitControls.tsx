'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface CardFields {
  pipeline_stage: string | null
  monetisation_lane: string | null
  engine_cluster: string | null
  build_status: string | null
  mvp_url: string | null
  mvp_ready: boolean | null
}

interface Props {
  productSlug: string
  initial: CardFields
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

export function CockpitControls({ productSlug, initial }: Props) {
  const router = useRouter()

  // --- Card fields editor (Gate 1 + lane/engine/stage) ---
  const [stage, setStage] = useState(initial.pipeline_stage ?? 'ideation')
  const [lane, setLane] = useState(initial.monetisation_lane ?? '')
  const [engine, setEngine] = useState(initial.engine_cluster ?? '')
  const [build, setBuild] = useState(initial.build_status ?? 'none')
  const [mvpUrl, setMvpUrl] = useState(initial.mvp_url ?? '')
  const [mvpReady, setMvpReady] = useState(Boolean(initial.mvp_ready))
  const [savePending, startSave] = useTransition()
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [saveErr, setSaveErr] = useState<string | null>(null)

  const gate1Open = mvpReady && Boolean(mvpUrl)

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
            mvp_ready: mvpReady,
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
        <p className="text-xs uppercase tracking-wider text-accent font-medium mb-4">
          Pipeline fields
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-gray-light/70">Stage</span>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-accent"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-gray-light/70">
              Monetisation lane
            </span>
            <select
              value={lane}
              onChange={(e) => setLane(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-accent"
            >
              {LANES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-gray-light/70">
              Engine cluster
            </span>
            <input
              type="text"
              value={engine}
              onChange={(e) => setEngine(e.target.value)}
              placeholder="voice-coaching | property | outreach | compliance | standalone"
              className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-gray-light/70">Build status</span>
            <select
              value={build}
              onChange={(e) => setBuild(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-accent"
            >
              {BUILDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="text-xs uppercase tracking-wider text-gray-light/70">
              Thin-MVP URL (embedded in outreach)
            </span>
            <input
              type="url"
              value={mvpUrl}
              onChange={(e) => setMvpUrl(e.target.value)}
              placeholder="https://your-thin-mvp.vercel.app"
              className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-accent"
            />
          </label>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm text-gray-light">
          <input
            type="checkbox"
            checked={mvpReady}
            onChange={(e) => setMvpReady(e.target.checked)}
            className="h-4 w-4 rounded border-gray-700 bg-gray-900 accent-accent"
          />
          Thin MVP ready (Gate 1)
        </label>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={saveFields}
            disabled={savePending}
            className="rounded-lg border border-gray-border bg-black/20 px-4 py-2 text-sm hover:border-accent transition-colors disabled:opacity-50"
          >
            {savePending ? 'Saving…' : 'Save fields'}
          </button>
          {saveMsg && <span className="text-xs text-emerald-300">{saveMsg}</span>}
          {saveErr && <span className="text-xs text-red-300">Error: {saveErr}</span>}
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
      <p className="text-xs uppercase tracking-wider text-accent font-medium mb-1">
        Kick off research
      </p>
      {!gate1Open ? (
        <div className="rounded border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-200">
          Gate 1 closed — set a thin-MVP URL and mark the card ready (then Save fields) before
          launching. The outreach embeds the MVP link, so kick-off is blocked without it.
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-light/70 mb-4">
            Launches a campaign on InvestorPilot + a Connexions voice panel. Run both streams.
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

  const launch = () => {
    setMsg(null)
    setErr(null)
    const qList = questions
      .split('\n')
      .map((q) => q.trim())
      .filter(Boolean)
    if (icp.trim().length < 10) {
      setErr('ICP description too short (min 10 chars).')
      return
    }
    if (qList.length === 0) {
      setErr('Add at least one question (one per line).')
      return
    }
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
      <h4 className="text-sm font-semibold capitalize mb-2">{campaignType.replace('-', ' ')}</h4>
      <textarea
        value={icp}
        onChange={(e) => setIcp(e.target.value)}
        rows={2}
        placeholder="ICP description (who we're reaching)"
        className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-white outline-none focus:border-accent mb-2"
      />
      <textarea
        value={questions}
        onChange={(e) => setQuestions(e.target.value)}
        rows={3}
        placeholder="Questions, one per line"
        className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-white outline-none focus:border-accent"
      />
      <button
        type="button"
        onClick={launch}
        disabled={pending}
        className="mt-2 w-full rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-black hover:bg-accent/90 transition-colors disabled:opacity-50"
      >
        {pending ? 'Launching…' : `Launch ${campaignType.replace('-', ' ')}`}
      </button>
      {msg && <p className="mt-2 text-xs text-emerald-300">{msg}</p>}
      {err && <p className="mt-2 text-xs text-red-300">Error: {err}</p>}
    </div>
  )
}
