'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateNextAction, changeStatus } from '@/lib/pipeline/actions/contacts'
import type { Contact } from '@/lib/pipeline/types'

const QUICK_STATUSES: Array<{ value: string; label: string; tone: string }> = [
  { value: 'waiting_on_them', label: 'Waiting on them', tone: 'bg-[#F7B500] text-[#1A2332]' },
  { value: 'waiting_on_me', label: 'Waiting on me', tone: 'bg-[#FF6B35] text-white' },
  { value: 'won', label: 'Won', tone: 'bg-[#0B7A5C] text-white' },
  { value: 'lost', label: 'Lost', tone: 'bg-gray-300 text-gray-700' },
  { value: 'archived', label: 'Archive', tone: 'bg-gray-200 text-gray-600' },
]

export function ContactActions({ contact }: { contact: Contact }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [next, setNext] = useState(contact.next_action ?? '')
  const [due, setDue] = useState(contact.next_action_due ?? '')

  const saveNext = () => {
    startTransition(async () => {
      await updateNextAction(contact.id, {
        next_action: next || null,
        next_action_due: due || null,
      })
      setEditing(false)
      router.refresh()
    })
  }

  const setStatus = (status: string) => {
    startTransition(async () => {
      await changeStatus(contact.id, status)
      router.refresh()
    })
  }

  return (
    <div className="mt-5 pt-5 border-t border-gray-200 space-y-4">
      <div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-[#1E5AA8] hover:underline"
          >
            Update next action
          </button>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="Next action"
              className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded"
            />
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded"
            />
            <div className="flex gap-2">
              <button
                onClick={saveNext}
                disabled={pending}
                className="min-h-[44px] bg-[#FF6B35] text-white rounded px-4 py-2 font-medium disabled:opacity-50"
              >
                {pending ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="min-h-[44px] text-[#5C6B7A] px-3 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-[#5C6B7A] mb-2">Quick status</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatus(s.value)}
              disabled={pending || contact.status === s.value}
              className={`min-h-[44px] rounded px-3 py-2 text-sm font-medium transition-opacity ${s.tone} ${
                contact.status === s.value ? 'opacity-50' : 'hover:opacity-90'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
