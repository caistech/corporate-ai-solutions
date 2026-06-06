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
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
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
  const scrollRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [transcript])

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
        return next ? `Saved ${pretty(field)}. ${summarise(next)}` : `Saved ${pretty(field)}.`
      } catch {
        return `Network error saving ${pretty(field)}.`
      }
    },
    get_intake_progress: async () => {
      const next = await refreshCard()
      return next ? summarise(next) : 'I could not read the current progress just now.'
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
        each answer as it reaches the bar — watch the count climb. No microphone? Use the text fallback in
        the widget below.
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

      <div className="px-6">
        <VoiceWidget
          agentId={COACH_AGENT_ID}
          mode="interview"
          placement="inline"
          title="Talk through your idea with the coach. One question at a time; answers save as you go."
          textFallback
          clientTools={clientTools}
          onMessage={(source, message) =>
            setTranscript((t) => [...t, { source: source === 'user' ? 'user' : 'ai', text: message }])
          }
          onStatusChange={(status) => setConnected(status === 'connected')}
        />
      </div>

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
