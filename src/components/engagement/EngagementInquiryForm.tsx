'use client'

import { useState, FormEvent } from 'react'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

export function EngagementInquiryForm() {
  const [state, setState] = useState<SubmitState>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state === 'submitting') return
    setState('submitting')
    setErrorMessage('')

    const formData = new FormData(event.currentTarget)
    const payload: Record<string, string | number | undefined> = {}
    formData.forEach((value, key) => {
      const stringValue = typeof value === 'string' ? value.trim() : ''
      if (!stringValue) return
      if (key === 'cohort_size') {
        const n = Number.parseInt(stringValue, 10)
        if (!Number.isNaN(n)) payload[key] = n
      } else {
        payload[key] = stringValue
      }
    })

    try {
      const res = await fetch('/api/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setErrorMessage(json.error || `Submission failed (${res.status})`)
        setState('error')
        return
      }
      setState('success')
    } catch (err) {
      console.error(err)
      setErrorMessage('Network error — please retry or email directly.')
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <div className="bg-gray-dark border border-accent/30 rounded-lg p-8 text-center">
        <CheckCircle2 className="text-accent mx-auto mb-4" size={48} />
        <h3 className="text-2xl font-bold mb-3">Inquiry received</h3>
        <p className="text-gray-light mb-4">
          I&apos;ll respond inside 48 hours with either a discovery-call slot or a
          quick note on fit.
        </p>
        <p className="text-sm text-gray-light/70">
          If your timing is urgent, the Calendly link above goes straight to my open windows.
        </p>
      </div>
    )
  }

  const fieldClass =
    'w-full bg-black border border-gray-border rounded-lg px-4 py-3 text-white placeholder:text-gray-light/40 focus:outline-none focus:border-accent transition-colors'
  const labelClass = 'block text-sm font-medium text-white mb-2'
  const helperClass = 'text-xs text-gray-light/70 mt-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contact */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className={labelClass}>
            Your name <span className="text-orange">*</span>
          </label>
          <input id="name" name="name" type="text" required maxLength={200} className={fieldClass} autoComplete="name" />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            Email <span className="text-orange">*</span>
          </label>
          <input id="email" name="email" type="email" required className={fieldClass} autoComplete="email" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="role" className={labelClass}>Your role</label>
          <input id="role" name="role" type="text" maxLength={200} placeholder="GP / Managing Partner / Director / etc" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="org_name" className={labelClass}>Organization</label>
          <input id="org_name" name="org_name" type="text" maxLength={200} placeholder="Fund / studio / accelerator name" className={fieldClass} autoComplete="organization" />
        </div>
      </div>

      {/* Org context */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="org_type" className={labelClass}>Organization type</label>
          <select id="org_type" name="org_type" className={fieldClass} defaultValue="">
            <option value="">Select…</option>
            <option value="vc-fund">VC fund</option>
            <option value="studio">Venture studio</option>
            <option value="accelerator">Accelerator</option>
            <option value="dev-shop">Dev shop / agency</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="aum_or_revenue" className={labelClass}>AUM or annual program revenue</label>
          <input id="aum_or_revenue" name="aum_or_revenue" type="text" maxLength={200} placeholder="$30M AUM / $1M ARR / etc" className={fieldClass} />
          <p className={helperClass}>Used as a qualification gate &mdash; ballpark is fine.</p>
        </div>
      </div>

      {/* Engagement context */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="cohort_size" className={labelClass}>Cohort size</label>
          <input id="cohort_size" name="cohort_size" type="number" min={1} max={1000} placeholder="e.g. 4" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="cohort_industries" className={labelClass}>Cohort industries</label>
          <input id="cohort_industries" name="cohort_industries" type="text" maxLength={500} placeholder="e.g. construction, fintech, voice AI" className={fieldClass} />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="target_window" className={labelClass}>Target window</label>
          <select id="target_window" name="target_window" className={fieldClass} defaultValue="">
            <option value="">Select…</option>
            <option value="jan-mar">January–March</option>
            <option value="jul-sep">July–September</option>
            <option value="either">Either</option>
          </select>
        </div>
        <div>
          <label htmlFor="engagement_length" className={labelClass}>Engagement length</label>
          <select id="engagement_length" name="engagement_length" className={fieldClass} defaultValue="">
            <option value="">Select…</option>
            <option value="3-month">3 months (default)</option>
            <option value="6-month">6 months</option>
            <option value="flexible">Flexible</option>
          </select>
        </div>
        <div>
          <label htmlFor="deal_shape" className={labelClass}>Deal shape preference</label>
          <select id="deal_shape" name="deal_shape" className={fieldClass} defaultValue="">
            <option value="">Select…</option>
            <option value="A">A &mdash; Studio pays</option>
            <option value="B">B &mdash; Hybrid (cohort co-funds)</option>
            <option value="C">C &mdash; Modular</option>
            <option value="open">Open to discussion</option>
          </select>
        </div>
      </div>

      {/* Past cohort outcomes — Shape-B qualification */}
      <div>
        <label htmlFor="past_cohort_outcomes" className={labelClass}>Past cohort outcomes</label>
        <textarea
          id="past_cohort_outcomes"
          name="past_cohort_outcomes"
          maxLength={2000}
          rows={3}
          placeholder="URL of last cohort batch page, or 1-2 sentences on Series A graduation rate, anchor exits, etc."
          className={fieldClass}
        />
        <p className={helperClass}>
          For Shape B (hybrid model) the brief expects a {'>'}=30% Series A graduation rate of prior cohort.
          Drop a URL or a quick summary &mdash; whichever is faster.
        </p>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className={labelClass}>Anything else</label>
        <textarea
          id="notes"
          name="notes"
          maxLength={4000}
          rows={4}
          placeholder="Optional. Specific outcomes you want from the engagement, timing constraints, etc."
          className={fieldClass}
        />
      </div>

      {state === 'error' && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm">
            <p className="text-red-400 font-medium mb-1">Inquiry could not be submitted</p>
            <p className="text-gray-light">{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={state === 'submitting'}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-orange text-black font-semibold hover:bg-orange/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {state === 'submitting' ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Submitting…
            </>
          ) : (
            'Submit inquiry'
          )}
        </button>
        <p className="text-xs text-gray-light/70">
          I respond inside 48 hours. Required fields marked <span className="text-orange">*</span>.
        </p>
      </div>
    </form>
  )
}
