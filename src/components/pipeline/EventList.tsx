'use client'

import { useState } from 'react'
import { EVENT_TYPE_LABELS } from '@/lib/pipeline/constants'
import type { Event } from '@/lib/pipeline/types'

function relativeDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

export function EventList({ events }: { events: Event[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  if (events.length === 0) {
    return (
      <p className="text-sm text-[#5C6B7A] italic">
        No events yet. Log one to start the history.
      </p>
    )
  }

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <ul className="space-y-3">
      {events.map((e) => {
        const isOpen = expanded.has(e.id)
        const hasBody = !!e.body
        return (
          <li key={e.id} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-[#1E5AA8] uppercase tracking-wide">
                    {EVENT_TYPE_LABELS[e.event_type as keyof typeof EVENT_TYPE_LABELS] ?? e.event_type}
                  </span>
                  <span className="text-xs text-[#5C6B7A]">{relativeDate(e.occurred_at)}</span>
                </div>
                <p className="text-sm text-[#1A2332]">{e.summary}</p>
                {hasBody && isOpen && (
                  <pre className="mt-3 text-sm text-[#1A2332] whitespace-pre-wrap bg-gray-50 rounded p-3 border border-gray-100">
                    {e.body}
                  </pre>
                )}
              </div>
              {hasBody && (
                <button
                  onClick={() => toggle(e.id)}
                  className="text-xs text-[#1E5AA8] hover:underline shrink-0"
                >
                  {isOpen ? 'Hide' : 'Show'}
                </button>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
