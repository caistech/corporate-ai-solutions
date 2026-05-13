'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChipSelector } from './ChipSelector'
import { EVENT_TYPES, EVENT_TYPE_LABELS } from '@/lib/pipeline/constants'
import { logEvent } from '@/lib/pipeline/actions/events'

export function EventForm({ contactId }: { contactId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [eventType, setEventType] = useState<string>('note')
  const [summary, setSummary] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await logEvent(contactId, {
        event_type: eventType,
        summary,
        body: body || null,
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setEventType('note')
      setSummary('')
      setBody('')
      setOpen(false)
      router.refresh()
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="min-h-[44px] inline-flex items-center bg-[#1E5AA8] text-white px-4 py-2 rounded hover:bg-[#164a8b] font-medium"
      >
        + Log event
      </button>
    )
  }

  const inputCls =
    'w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1E5AA8] focus:border-transparent bg-white'

  return (
    <form onSubmit={submit} className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Type</label>
        <ChipSelector
          options={EVENT_TYPES.filter((t) => t !== 'status_change').map((t) => ({
            value: t,
            label: EVENT_TYPE_LABELS[t],
          }))}
          value={eventType}
          onChange={setEventType}
        />
      </div>

      <div>
        <label htmlFor="summary" className="block text-sm font-medium mb-1">
          Summary <span className="text-[#FF6B35]">*</span>
        </label>
        <input
          id="summary"
          type="text"
          required
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className={inputCls}
          placeholder="e.g. emailed Ethan about discovery vs. signal noise"
        />
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium mb-1">
          Body (optional)
        </label>
        <textarea
          id="body"
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className={inputCls + ' resize-y'}
          placeholder="Paste email contents, call notes, etc."
        />
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="min-h-[44px] bg-[#FF6B35] text-white font-semibold rounded px-4 py-2 hover:bg-[#e85a25] disabled:opacity-50"
        >
          {pending ? 'Logging…' : 'Log event'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="min-h-[44px] text-[#5C6B7A] hover:text-[#1A2332] px-3 py-2"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
