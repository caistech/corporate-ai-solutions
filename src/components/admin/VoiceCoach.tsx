'use client'

// Voice-first onboarding coach surface (Morgan). Consumes the hub VoiceWidget
// (@caistech/elevenlabs-convai/react) — never a per-project voice client (PRODUCT_STANDARDS §6).
//
// The agent's CLIENT tools are implemented here, in the authed operator browser, so they call the
// cookie-authed routes directly (no server-to-server token):
//   - save_field(field, value) → POST /api/admin/pipeline/new-ideas/save-field (applyCoachFields)
//   - get_intake_progress()    → GET  /api/admin/pipeline/new-ideas/card-state
// Readiness (X/14) reads card-state — the single DB source. When the row is presence-complete the
// Admit button hands the captured fields to the UNCHANGED admit gate. Text input is the widget's
// built-in fallback (degrade-don't-fake).

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Loader2, CheckCircle2, AlertCircle, PauseCircle, PlayCircle } from 'lucide-react'
import { VoiceWidget } from '@caistech/elevenlabs-convai/react'
import { COACH_AGENT_ID, hasCoachAgent } from '@/voice.config'

interface CardState {
  total: number
  gradedCaptured: string[]
  gradedOutstanding: string[]
  feasibilityCaptured: string[]
  feasibilityOutstanding: string[]
  readyToAdmit: boolean
  fields: Record<string, string>
  feasibility: Record<string, string>
}

interface TranscriptLine {
  source: 'user' | 'ai'
  text: string
}

const pretty = (f: string) => f.replace(/_/g, ' ')

function summarise(s: CardState): string {
  if (s.readyToAdmit) return 'All 14 graded fields and the required feasibility are captured. Ready to admit.'
  const outstanding = [...s.gradedOutstanding, ...s.feasibilityOutstanding].map(pretty)
  return `${s.gradedCaptured.length} of ${s.total} graded fields captured. Still outstanding: ${outstanding.join(', ')}.`
}

// Morgan's session is capped at 20 min on the ElevenLabs side (COACH_MAX_DURATION_SECS in
// scripts/provision-coach-agent.ts). She has no clock of her own, so the BROWSER tracks elapsed
// time and (a) folds a wrap-up instruction into tool results so she SPEAKS the warning, and
// (b) shows a visual banner as a guaranteed backstop.
const SESSION_LIMIT_SECS = 1200 // 20 min — keep in sync with COACH_MAX_DURATION_SECS
const WRAP_WARNING_SECS = 120 // begin the gentle "~2 minutes to go" wrap-up at T-2:00

export default function VoiceCoach({
  productSlug,
  productName,
  onAdmitted,
}: {
  productSlug: string
  productName: string
  onAdmitted: () => void
}) {
  const [transcript, setTranscript] = useState<TranscriptLine[]>([])
  const [card, setCard] = useState<CardState | null>(null)
  const [connected, setConnected] = useState(false)
  const [admitting, setAdmitting] = useState(false)
  const [admitError, setAdmitError] = useState<string | null>(null)
  const [blockers, setBlockers] = useState<string[]>([])
  // Pause & save / resume. `loading` covers the initial transcript fetch so we don't flash the live
  // widget before we know there's a saved session to resume. `paused` unmounts the widget (tearing
  // down the voice session); `autoConnectResume` makes the re-mounted widget reconnect on Resume
  // without a second mic tap; `resumable` marks that there IS a saved conversation to return to.
  const [loading, setLoading] = useState(true)
  const [paused, setPaused] = useState(false)
  const [pausing, setPausing] = useState(false)
  const [autoConnectResume, setAutoConnectResume] = useState(false)
  const [resumable, setResumable] = useState(false)
  // 20-min session clock. connectedAtRef is the wall-clock connect time; wrapSoon flips on in the
  // final 2 minutes to drive the visual wrap-up banner.
  const connectedAtRef = useRef<number | null>(null)
  const [wrapSoon, setWrapSoon] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  // Mirror of the transcript in the extractor's shape — read in onDisconnect (avoids stale closure).
  const turnsRef = useRef<{ role: 'user' | 'assistant'; text: string }[]>([])
  // Hub memory-loop persistence. convId is the ElevenLabs conversation id (from onConnect); until
  // /coach/start commits the conversation row, per-turn saves are buffered here, then flushed.
  const convIdRef = useRef<string | null>(null)
  const startedRef = useRef(false)
  const pendingRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([])

  const refreshCard = useCallback(async (): Promise<CardState | null> => {
    try {
      const res = await fetch(`/api/admin/pipeline/new-ideas/card-state?slug=${encodeURIComponent(productSlug)}`)
      if (!res.ok) return null
      const data = (await res.json()) as CardState
      setCard(data)
      return data
    } catch {
      return null
    }
  }, [productSlug])

  useEffect(() => {
    refreshCard()
  }, [refreshCard])

  // On return, reload the saved conversation so Resume restores the chat (not just the fields).
  // A prior conversation lands the operator on the paused/resume card; a clean slate shows the
  // live widget straight away.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(
          `/api/admin/pipeline/new-ideas/coach/transcript?slug=${encodeURIComponent(productSlug)}`,
        )
        if (!res.ok) return
        const data = (await res.json()) as { hasPrior: boolean; transcript: TranscriptLine[] }
        if (cancelled || !data.hasPrior) return
        setTranscript(data.transcript)
        setResumable(true)
        setPaused(true) // returning operator lands on the Resume card with their conversation restored
      } catch {
        /* best-effort — a failed reload just starts a fresh live session */
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [productSlug])

  // Persist a single conversation turn into the hub memory loop (convai_messages). Best-effort:
  // the on-disconnect snapshot still captures the full transcript if a turn POST is dropped.
  const persistTurn = useCallback(async (role: 'user' | 'assistant', content: string) => {
    const convId = convIdRef.current
    if (!convId) return
    try {
      await fetch('/api/admin/pipeline/new-ideas/coach/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ elevenlabsConversationId: convId, role, content }),
      })
    } catch {
      /* best-effort */
    }
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [transcript])

  // Seconds left in the 20-min session, or null when not in a live call.
  const secondsRemaining = useCallback((): number | null => {
    if (connectedAtRef.current === null) return null
    const elapsed = (Date.now() - connectedAtRef.current) / 1000
    return Math.max(0, Math.round(SESSION_LIMIT_SECS - elapsed))
  }, [])

  // A wrap-up instruction folded into tool results so Morgan SPEAKS the warning (she has no clock of
  // her own). Empty until we're inside the final WRAP_WARNING_SECS window.
  const timeNote = useCallback((): string => {
    const left = secondsRemaining()
    if (left === null || left > WRAP_WARNING_SECS) return ''
    const mins = Math.max(1, Math.round(left / 60))
    return ` [SESSION TIME: about ${mins} minute${mins === 1 ? '' : 's'} left of the 20-minute limit. Gently tell the operator time is almost up, capture the single most important outstanding field now, then wrap up and reassure them their progress is saved.]`
  }, [secondsRemaining])

  // Drive the visual wrap-up banner while connected; reset when the call ends.
  useEffect(() => {
    if (!connected) {
      setWrapSoon(false)
      return
    }
    const id = setInterval(() => {
      const left = secondsRemaining()
      if (left !== null && left <= WRAP_WARNING_SECS) setWrapSoon(true)
    }, 5000)
    return () => clearInterval(id)
  }, [connected, secondsRemaining])

  // The browser-side implementations of the agent's client tools.
  const clientTools: Record<string, (p: Record<string, unknown>) => Promise<string>> = {
    save_field: async (p) => {
      const field = String(p.field ?? '').trim()
      const value = String(p.value ?? '').trim()
      if (!field || !value) return 'I need both a field name and a value to save that.'
      try {
        const res = await fetch('/api/admin/pipeline/new-ideas/save-field', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productSlug, field, value }),
        })
        const data = await res.json()
        if (!res.ok) return `Could not save ${pretty(field)}: ${data.error ?? 'error'}.`
        const next = await refreshCard()
        return next ? `Saved ${pretty(field)}. ${summarise(next)}${timeNote()}` : `Saved ${pretty(field)}.${timeNote()}`
      } catch {
        return `Network error saving ${pretty(field)}.`
      }
    },
    get_intake_progress: async () => {
      const next = await refreshCard()
      return next ? summarise(next) + timeNote() : 'I could not read the current progress just now.'
    },
  }

  async function admit() {
    if (!card?.readyToAdmit || admitting) return
    setAdmitting(true)
    setAdmitError(null)
    setBlockers([])
    try {
      const res = await fetch('/api/admin/pipeline/new-ideas/admit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productSlug, displayName: productName, fields: card.fields, feasibility: card.feasibility }),
      })
      const data = await res.json()
      if (res.status === 422) {
        setBlockers(data.blockers || [])
        return
      }
      if (!res.ok || !data.admitted) {
        setAdmitError(data.error || 'Admission failed.')
        return
      }
      onAdmitted()
    } catch {
      setAdmitError('Network error during admission.')
    } finally {
      setAdmitting(false)
    }
  }

  // Persist the live session (fields + transcript snapshot) — shared by an explicit Pause & save and
  // by the widget's own end-of-call (onDisconnect). Idempotent, so running both is safe.
  const persistSession = useCallback(async () => {
    const turns = turnsRef.current
    if (turns.length === 0) return
    const convId = convIdRef.current
    try {
      await fetch('/api/admin/pipeline/new-ideas/backstop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productSlug, transcript: turns }),
      })
      if (convId) {
        await fetch('/api/admin/pipeline/new-ideas/coach/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ elevenlabsConversationId: convId, transcript: turns }),
        })
      }
      await refreshCard()
    } catch {
      /* best-effort — per-turn save_field/coach/message already wrote what they captured */
    }
  }, [productSlug, refreshCard])

  // Pause & save: persist first (so we don't depend on the widget firing onDisconnect on unmount),
  // then drop to the resume card — unmounting the widget tears down the voice session (no wasted
  // BYOK minutes). Everything is already on the card; Resume brings it all back.
  async function pauseAndSave() {
    if (pausing) return
    setPausing(true)
    await persistSession()
    setResumable(turnsRef.current.length > 0 || transcript.length > 0)
    setConnected(false)
    connectedAtRef.current = null
    setPaused(true)
    setPausing(false)
  }

  // Resume: re-mount the widget and auto-reconnect Morgan (onConnect → /coach/start → welcome-back
  // recall). The restored transcript stays visible above; new turns append to it.
  function resume() {
    setAutoConnectResume(true)
    setPaused(false)
  }

  if (!hasCoachAgent()) {
    return (
      <div className="bg-gray-800 rounded-xl mb-8 border border-gray-700 p-6 text-sm text-gray-400">
        The voice coach isn’t provisioned yet. Use the text option below to walk the spec.
      </div>
    )
  }

  const captured = card ? card.gradedCaptured.length : 0
  const toGo = card ? card.gradedOutstanding.length + card.feasibilityOutstanding.length : null

  return (
    <div className="bg-gray-800 rounded-xl mb-8 border border-gray-700 flex flex-col">
      <div className="px-6 py-3 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{productName}</h2>
        <span className="text-xs text-gray-400">
          {card?.readyToAdmit ? 'All 14 fields ready' : `${captured}/14 fields at bar`}
        </span>
      </div>

      <p className="px-6 pt-3 text-sm text-gray-400">
        Talk through your idea with Morgan, the intake coach. She asks one question at a time and saves
        each answer as it reaches the bar — watch the count climb. Need to step away? Hit Pause &amp; save
        and resume anytime — your fields and the conversation come right back. No microphone? Use the text
        fallback in the widget below.
      </p>

      <div className="flex flex-col items-center px-6 py-4">
        <div
          className={`relative w-24 h-24 rounded-full overflow-hidden ring-2 transition-colors ${
            connected ? 'ring-green-400' : 'ring-gray-600'
          }`}
        >
          <Image src="/female_avatar.jpeg" alt="Morgan, your intake coach" fill sizes="96px" className="object-cover" />
        </div>
        <span className="mt-2 text-xs text-gray-400">{connected ? 'Morgan — listening' : 'Morgan'}</span>
      </div>

      <div ref={scrollRef} className="px-6 pb-4 max-h-72 overflow-y-auto space-y-3">
        {transcript.length === 0 && (
          <p className="text-center text-sm text-gray-500">Tap the mic in the widget to start the conversation.</p>
        )}
        {transcript.map((l, i) => (
          <div key={i} className={l.source === 'user' ? 'text-right' : 'text-left'}>
            <div
              className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                l.source === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-200 border border-gray-700'
              }`}
            >
              {l.text}
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="px-6 pb-4 flex items-center justify-center gap-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading your session…
        </div>
      )}

      {!loading && !paused && (
      <div className="px-6">
        {connected && wrapSoon && (
          <div className="mb-3 bg-amber-900/30 border border-amber-700/50 rounded-lg p-3 text-sm text-amber-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              About 2 minutes left in this session — Morgan will wrap up shortly. Your answers are saved
              as you go; Pause &amp; save and resume anytime to keep going.
            </span>
          </div>
        )}
        {connected && (
          <div className="mb-3 flex justify-end">
            <button
              onClick={pauseAndSave}
              disabled={pausing}
              className="inline-flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg text-sm font-medium"
            >
              {pausing ? <Loader2 className="w-4 h-4 animate-spin" /> : <PauseCircle className="w-4 h-4" />}
              Pause &amp; save
            </button>
          </div>
        )}
        <VoiceWidget
          agentId={COACH_AGENT_ID}
          mode="interview"
          placement="inline"
          title="Talk through your idea with the coach. One question at a time; answers save as you go."
          textFallback
          clientTools={clientTools}
          onConnect={async (conversationId) => {
            setConnected(true)
            connectedAtRef.current = Date.now() // start the 20-min session clock
            convIdRef.current = conversationId
            startedRef.current = false
            // Open + bind the conversation in the hub memory loop, and pull welcome-back recall.
            try {
              const res = await fetch('/api/admin/pipeline/new-ideas/coach/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productSlug, elevenlabsConversationId: conversationId, elevenlabsAgentId: COACH_AGENT_ID }),
              })
              const data = await res.json().catch(() => ({}))
              startedRef.current = res.ok
              if (res.ok && data.isReturningUser) {
                setTranscript((t) => [...t, { source: 'ai', text: 'Welcome back — I have our earlier intake on file and can pick up where we left off.' }])
              }
              if (res.ok) {
                const buffered = pendingRef.current
                pendingRef.current = []
                for (const m of buffered) await persistTurn(m.role, m.content)
              }
            } catch {
              /* start failed — the transcript is still captured by onDisconnect */
            }
          }}
          onMessage={(source, message) => {
            const role: 'user' | 'assistant' = source === 'user' ? 'user' : 'assistant'
            turnsRef.current.push({ role, text: message })
            setTranscript((t) => [...t, { source: source === 'user' ? 'user' : 'ai', text: message }])
            // Persist per-turn; buffer until /coach/start commits the conversation row.
            if (startedRef.current && convIdRef.current) void persistTurn(role, message)
            else pendingRef.current.push({ role, content: message })
          }}
          onStatusChange={(status) => setConnected(status === 'connected')}
          autoConnect={autoConnectResume}
          // Completion backstop if the user ends via the widget's own controls (Pause & save persists
          // explicitly before unmounting, so this is the fallback path, not the only one).
          onDisconnect={async () => {
            setConnected(false)
            connectedAtRef.current = null
            await persistSession()
          }}
        />
      </div>
      )}

      {!loading && paused && (
        <div className="px-6 pb-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-300 font-medium mb-1">
              {resumable ? 'Paused — your progress is saved.' : 'Session paused.'}
            </p>
            <p className="text-xs text-gray-500 mb-3">
              Your filled fields and this conversation are on file. Pick up exactly where you left off
              whenever you’re ready — Morgan keeps what she already knows.
            </p>
            <button
              onClick={resume}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium"
            >
              <PlayCircle className="w-4 h-4" /> Resume conversation
            </button>
          </div>
        </div>
      )}

      {blockers.length > 0 && (
        <div className="mx-6 mb-2 bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-yellow-200 text-sm font-medium mb-1">
            <AlertCircle className="w-4 h-4" /> Not ready to admit
          </div>
          <ul className="text-yellow-300/80 text-xs list-disc ml-5">
            {blockers.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      )}
      {admitError && <p className="mx-6 mb-2 text-red-400 text-sm">{admitError}</p>}

      <div className="px-6 py-3 border-t border-gray-700">
        {card?.readyToAdmit ? (
          <button
            onClick={admit}
            disabled={admitting}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-lg font-medium text-sm flex items-center justify-center gap-2"
          >
            {admitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Admit to pipeline
          </button>
        ) : (
          <p className="text-xs text-gray-500 text-center">
            {toGo === null ? 'Loading progress…' : `${toGo} field${toGo === 1 ? '' : 's'} to go before admitting.`}
          </p>
        )}
      </div>
    </div>
  )
}
