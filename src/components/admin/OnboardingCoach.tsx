'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

// Mirrors the route's ConversationState / readiness shapes.
interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AdmitPayload {
  fields: Record<string, string>
  feasibility: Record<string, string>
}

interface ConversationState {
  layer: 'A' | 'B' | 'complete'
  productName?: string
  payload?: AdmitPayload
}

interface Readiness {
  complete: boolean
  fieldsBelowBar: string[]
}

// Strip the ```admit {...}``` block out of what we show the user — it's a
// machine signal for the route, not conversational text.
function stripAdmitBlock(text: string): string {
  return text.replace(/```admit\s*[\s\S]*?```/g, '').trim()
}

export default function OnboardingCoach() {
  const [productName, setProductName] = useState('')
  const [started, setStarted] = useState(false)
  const [creating, setCreating] = useState(false)
  const [productSlug, setProductSlug] = useState<string | null>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [state, setState] = useState<ConversationState>({ layer: 'A' })
  const [readiness, setReadiness] = useState<Readiness>({ complete: false, fieldsBelowBar: [] })

  const [admitting, setAdmitting] = useState(false)
  const [admitError, setAdmitError] = useState<string | null>(null)
  const [admitted, setAdmitted] = useState(false)
  const [blockers, setBlockers] = useState<string[]>([])

  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  // 1. Create the INCOMPLETE-SPEC row, then kick off the conversation.
  async function startIdea() {
    if (!productName.trim() || creating) return
    setCreating(true)
    setAdmitError(null)
    try {
      const res = await fetch('/api/admin/pipeline/new-ideas/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: productName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAdmitError(data.error || 'Could not create the idea row.')
        return
      }
      setProductSlug(data.productSlug)
      setState({ layer: 'A', productName: productName.trim() })
      setStarted(true)
      // Seed the coach with an opening user turn so it begins the 7-node walk.
      await sendMessage(`My product idea is: ${productName.trim()}. Help me walk through it.`, [])
    } catch {
      setAdmitError('Network error creating the idea.')
    } finally {
      setCreating(false)
    }
  }

  // 2. Send a turn to the coach. `seed` lets startIdea send the first turn
  //    against an empty history without waiting for state to flush.
  async function sendMessage(content: string, history?: Message[]) {
    const base = history ?? messages
    const next: Message[] = [...base, { role: 'user', content }]
    setMessages(next)
    setInput('')
    setSending(true)
    try {
      const res = await fetch('/api/admin/pipeline/new-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, state }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessages([
          ...next,
          { role: 'assistant', content: `⚠️ ${data.error || 'The coach hit an error.'}` },
        ])
        return
      }
      const shown = stripAdmitBlock(data.message)
      setMessages([...next, { role: 'assistant', content: shown || '…' }])
      if (data.state) setState(data.state)
      if (data.readiness) setReadiness(data.readiness)
    } catch {
      setMessages([...next, { role: 'assistant', content: '⚠️ Network error talking to the coach.' }])
    } finally {
      setSending(false)
    }
  }

  // 3. Admit — send the coach's resolved payload to the schema-safe write path.
  async function admit() {
    if (!productSlug || !state.payload || admitting) return
    setAdmitting(true)
    setAdmitError(null)
    setBlockers([])
    try {
      const res = await fetch('/api/admin/pipeline/new-ideas/admit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productSlug,
          displayName: state.productName,
          fields: state.payload.fields,
          feasibility: state.payload.feasibility,
        }),
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
      setAdmitted(true)
    } catch {
      setAdmitError('Network error during admission.')
    } finally {
      setAdmitting(false)
    }
  }

  // --- Admitted: terminal success state ---
  if (admitted && productSlug) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-green-700/50">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <h2 className="text-lg font-semibold">Idea admitted to the pipeline</h2>
        </div>
        <p className="text-gray-400 text-sm mb-4">
          {state.productName} is now in-pipeline with its 14-field spec and feasibility context.
        </p>
        <a
          href={`/admin/pipeline/${productSlug}`}
          className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium text-sm"
        >
          Open in pipeline →
        </a>
      </div>
    )
  }

  // --- Pre-start: name the idea ---
  if (!started) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
        <h2 className="text-lg font-semibold mb-2">Start a New Idea</h2>
        <p className="text-gray-400 text-sm mb-4">
          Name the idea, then the coach walks you through the 7-node ideation chain — drawing out the
          strongest rationale and the 14-field spec.
        </p>
        <div className="flex gap-2">
          <input
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && startIdea()}
            placeholder="Product idea name…"
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={startIdea}
            disabled={!productName.trim() || creating}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:opacity-50 rounded-lg font-medium text-sm"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Start'}
          </button>
        </div>
        {admitError && <p className="text-red-400 text-sm mt-3">{admitError}</p>}
      </div>
    )
  }

  // --- Conversation ---
  return (
    <div className="bg-gray-800 rounded-xl mb-8 border border-gray-700 flex flex-col" style={{ height: '32rem' }}>
      <div className="px-6 py-3 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{state.productName}</h2>
        <span className="text-xs text-gray-400">
          {readiness.complete
            ? 'All 14 fields ready'
            : `${14 - readiness.fieldsBelowBar.length}/14 fields at bar`}
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <div
              className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-200 border border-gray-700'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="text-left">
            <div className="inline-flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" /> coach is thinking…
            </div>
          </div>
        )}
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
        {readiness.complete ? (
          <button
            onClick={admit}
            disabled={admitting}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-lg font-medium text-sm flex items-center justify-center gap-2"
          >
            {admitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Admit to pipeline
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !sending && input.trim() && sendMessage(input.trim())}
              placeholder="Your answer…"
              disabled={sending}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <button
              onClick={() => input.trim() && sendMessage(input.trim())}
              disabled={sending || !input.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:opacity-50 rounded-lg font-medium text-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
