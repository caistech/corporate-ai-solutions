'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { CheckCircle2, Loader2, Sparkles, X } from 'lucide-react'

const PLATFORM = 'infera'
const SOURCE = 'compiler-waitlist-modal'

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

/**
 * Waitlist capture for the Agentic Workload Compiler. A single trigger button +
 * modal (bottom sheet on mobile, centred dialog on laptop — same shape as the
 * cockpit ConfirmDialog). The modal posts email/platform/source to
 * `/api/waitlist` (table: `waitlist`, UNIQUE(email, platform)). No payment is
 * taken — the promise is early access + early-bird pricing once the report
 * engine ships.
 */
export function CompilerWaitlist({
  className = '',
  label = 'Join the waitlist',
  variant = 'secondary',
}: {
  className?: string
  label?: string
  /** 'secondary' = quiet outline; 'white' = solid conversion action for hero callouts. */
  variant?: 'secondary' | 'white'
}) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [state, setState] = useState<SubmitState>('idle')
  const [message, setMessage] = useState('')
  const emailRef = useRef<HTMLInputElement>(null)

  const triggerClasses =
    variant === 'white'
      ? 'inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-gray-light'
      : `btn btn-secondary inline-flex items-center gap-2 min-h-[44px] ${className}`

  useEffect(() => {
    if (!open) return
    const focusTimer = window.setTimeout(() => emailRef.current?.focus(), 50)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const close = () => {
    if (state !== 'submitting') setOpen(false)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const value = email.trim()
    if (!value) return
    setState('submitting')
    setMessage('')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value, platform: PLATFORM, source: SOURCE }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Something went wrong — please try again.')
      setState('success')
    } catch (err) {
      setState('error')
      setMessage(
        err instanceof Error ? err.message : 'Something went wrong — please try again.'
      )
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClasses}
      >
        <Sparkles size={18} /> {label}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="compiler-waitlist-title"
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
          onClick={close}
        >
          <div
            className="w-full max-w-lg rounded-t-2xl border border-gray-border bg-gray-dark p-6 shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <h3 id="compiler-waitlist-title" className="text-lg font-bold text-white">
                Join the waitlist
              </h3>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="inline-flex min-h-[44px] w-[44px] items-center justify-center rounded-lg text-gray-light transition-colors hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {state === 'success' ? (
              <div className="py-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 size={20} className="text-accent" />
                  <p className="font-semibold text-white">You&apos;re on the list.</p>
                </div>
                <p className="text-sm text-gray-light mb-6">
                  You&apos;ll be the first to know when the report engine ships &mdash; and you&apos;ll
                  get the early-bird invite before anyone else.
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="btn btn-primary btn-sm inline-flex items-center gap-2 min-h-[44px]"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-light mb-4">
                  The <span className="text-white">Agentic Workload Compiler</span> turns your
                  agentic network — agents, tasks, workflows, tools and business volume — into a
                  standardised workload model, then costs it across latency vs batching scenarios.
                </p>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-light mb-2">
                  What you&apos;re signing up for
                </p>
                <ul className="mb-4 space-y-1.5 text-sm text-gray-light">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent" />
                    Early access when the report engine ships
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent" />
                    Early-bird pricing for the first cohort
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent" />
                    A say in what gets built next
                  </li>
                </ul>
                <p className="text-sm text-gray-light mb-6">
                  The compiler boundary is free to run today — no signup needed.{' '}
                  <span className="text-white">The waitlist just decides whether the report engine gets built.</span>
                </p>
                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label htmlFor="compiler-waitlist-email" className="block text-sm mb-2 text-white">
                      Work email
                    </label>
                    <input
                      ref={emailRef}
                      id="compiler-waitlist-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@yourstudio.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input"
                    />
                  </div>
                  {state === 'error' && message && (
                    <p role="alert" className="text-sm text-red-400">
                      {message}
                    </p>
                  )}
                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={close}
                      disabled={state === 'submitting'}
                      className="min-h-[44px] w-full rounded-lg border border-gray-border bg-black/20 px-4 py-2 text-sm text-gray-light transition-colors hover:border-accent disabled:opacity-50 sm:w-auto"
                    >
                      Not now
                    </button>
                    <button
                      type="submit"
                      disabled={state === 'submitting'}
                      className="min-h-[44px] w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-accent/90 disabled:opacity-50 sm:w-auto"
                    >
                      {state === 'submitting' ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 size={16} className="animate-spin" /> Joining…
                        </span>
                      ) : (
                        'Join the waitlist'
                      )}
                    </button>
                  </div>
                </form>
                <p className="mt-4 text-xs text-gray-light/70">
                  No spam. Early access and an early-bird invite when the report engine ships.
                </p>
                <p className="mt-1 text-xs text-gray-light/50">
                  Nothing to pay yet &mdash; pricing lands once the cost engine is real.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}