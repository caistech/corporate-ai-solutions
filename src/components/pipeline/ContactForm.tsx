'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChipSelector } from './ChipSelector'
import {
  SOURCES, SOURCE_LABELS,
  STATUSES, STATUS_LABELS,
  PRIORITIES, PRIORITY_LABELS,
} from '@/lib/pipeline/constants'
import type { Contact, ActionResult } from '@/lib/pipeline/types'

type Props = {
  mode: 'new' | 'edit'
  initial?: Partial<Contact>
  onSubmit: (input: Record<string, unknown>) => Promise<ActionResult<Contact>>
  redirectPath?: (id: string) => string
}

function addDays(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export function ContactForm({ mode, initial, onSubmit, redirectPath }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [showMore, setShowMore] = useState(mode === 'edit')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const [name, setName] = useState(initial?.name ?? '')
  const [source, setSource] = useState<string>(initial?.source ?? 'cold_email_out')
  const [whatTheyWant, setWhatTheyWant] = useState(initial?.what_they_want ?? '')
  const [nextActionDue, setNextActionDue] = useState(
    initial?.next_action_due ?? (mode === 'new' ? addDays(3) : '')
  )

  const [company, setCompany] = useState(initial?.company ?? '')
  const [nextAction, setNextAction] = useState(initial?.next_action ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [linkedinUrl, setLinkedinUrl] = useState(initial?.linkedin_url ?? '')
  const [role, setRole] = useState(initial?.role ?? '')
  const [whatIWant, setWhatIWant] = useState(initial?.what_i_want ?? '')
  const [priority, setPriority] = useState<number>(initial?.priority ?? 2)
  const [status, setStatus] = useState<string>(initial?.status ?? 'open')
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(', '))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const input: Record<string, unknown> = {
      name,
      source,
      what_they_want: whatTheyWant || null,
      next_action_due: nextActionDue || null,
      company: company || null,
      next_action: nextAction || null,
      notes: notes || null,
      email: email || null,
      linkedin_url: linkedinUrl || null,
      role: role || null,
      what_i_want: whatIWant || null,
      priority,
      status,
      tags,
    }

    startTransition(async () => {
      const res = await onSubmit(input)
      if (!res.ok) {
        setError(res.error)
        if (res.fieldErrors) setFieldErrors(res.fieldErrors)
        return
      }
      if (redirectPath) {
        router.push(redirectPath(res.data.id))
      }
      router.refresh()
    })
  }

  const inputCls =
    'w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1E5AA8] focus:border-transparent bg-white'

  const fieldErr = (key: string) => fieldErrors[key]?.[0]

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Name <span className="text-[#FF6B35]">*</span>
        </label>
        <input
          id="name"
          type="text"
          required
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
        />
        {fieldErr('name') && <p className="text-xs text-red-600 mt-1">{fieldErr('name')}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Source</label>
        <ChipSelector
          options={SOURCES.map((s) => ({ value: s, label: SOURCE_LABELS[s] }))}
          value={source}
          onChange={setSource}
        />
      </div>

      <div>
        <label htmlFor="whatTheyWant" className="block text-sm font-medium mb-1">
          What they want
        </label>
        <textarea
          id="whatTheyWant"
          rows={2}
          value={whatTheyWant}
          onChange={(e) => setWhatTheyWant(e.target.value)}
          className={inputCls + ' resize-y'}
        />
      </div>

      <div>
        <label htmlFor="nextActionDue" className="block text-sm font-medium mb-1">
          Next action due
        </label>
        <input
          id="nextActionDue"
          type="date"
          value={nextActionDue}
          onChange={(e) => setNextActionDue(e.target.value)}
          className={inputCls}
        />
      </div>

      {!showMore && mode === 'new' && (
        <button
          type="button"
          onClick={() => setShowMore(true)}
          className="text-sm text-[#1E5AA8] hover:underline"
        >
          + Add more details
        </button>
      )}

      {showMore && (
        <div className="space-y-5 pt-4 border-t border-gray-200">
          <div>
            <label htmlFor="company" className="block text-sm font-medium mb-1">Company</label>
            <input id="company" type="text" value={company} onChange={(e) => setCompany(e.target.value)} className={inputCls} />
          </div>

          <div>
            <label htmlFor="nextAction" className="block text-sm font-medium mb-1">Next action</label>
            <input id="nextAction" type="text" value={nextAction} onChange={(e) => setNextAction(e.target.value)} className={inputCls} placeholder="e.g. reply to email" />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-1">Notes</label>
            <textarea id="notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls + ' resize-y'} />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
            {fieldErr('email') && <p className="text-xs text-red-600 mt-1">{fieldErr('email')}</p>}
          </div>

          <div>
            <label htmlFor="linkedinUrl" className="block text-sm font-medium mb-1">LinkedIn URL</label>
            <input id="linkedinUrl" type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className={inputCls} />
            {fieldErr('linkedin_url') && <p className="text-xs text-red-600 mt-1">{fieldErr('linkedin_url')}</p>}
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-1">Role</label>
            <input id="role" type="text" value={role} onChange={(e) => setRole(e.target.value)} className={inputCls} />
          </div>

          <div>
            <label htmlFor="whatIWant" className="block text-sm font-medium mb-1">What I want</label>
            <textarea id="whatIWant" rows={2} value={whatIWant} onChange={(e) => setWhatIWant(e.target.value)} className={inputCls + ' resize-y'} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Priority</label>
            <ChipSelector
              options={PRIORITIES.map((p) => ({ value: String(p), label: PRIORITY_LABELS[p] }))}
              value={String(priority)}
              onChange={(v) => setPriority(Number(v))}
            />
          </div>

          {mode === 'edit' && (
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <ChipSelector
                options={STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
                value={status}
                onChange={setStatus}
              />
            </div>
          )}

          <div>
            <label htmlFor="tags" className="block text-sm font-medium mb-1">Tags</label>
            <input id="tags" type="text" value={tagsText} onChange={(e) => setTagsText(e.target.value)} className={inputCls} placeholder="comma-separated, e.g. anthropic, fractional" />
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="min-h-[44px] bg-[#FF6B35] text-white font-semibold rounded px-5 py-2 hover:bg-[#e85a25] disabled:opacity-50 transition-colors"
        >
          {pending ? 'Saving…' : mode === 'new' ? 'Capture contact' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="min-h-[44px] text-[#5C6B7A] hover:text-[#1A2332] px-3 py-2"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
