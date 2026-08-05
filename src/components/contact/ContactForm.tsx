'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { SITE, FOUNDER } from '@/lib/constants'

/**
 * The contact form. Client-side because it has state; everything else on /contact is now server
 * rendered around it.
 *
 * TWO THINGS WERE WRONG HERE AND BOTH ARE FIXED.
 *
 * 1. It sent nothing. The submit handler was `await new Promise(r => setTimeout(r, 1000))` followed
 *    by the success screen — the deployed bundle contained no network call at all. Everyone who
 *    chose to write rather than book a call was told "Message Sent!", waited two days, and concluded
 *    their enquiry was ignored. There was no way to discover it had happened. That is the failure
 *    PRODUCT_STANDARDS §9 records from the f2k onboarding form, and a fake success is worse than no
 *    form, because the visitor stops looking for another way to reach you. The `/api/leads` route
 *    already existed and already emailed; the form simply never called it.
 *
 * 2. The whole PAGE was client-only. `useSearchParams()` with no Suspense boundary opts a route out
 *    of server rendering entirely, so /contact server-rendered 27 characters — "Loading... Report a
 *    problem" — and the phone number, the email address and the Calendly link all waited on
 *    JavaScript. The enquiry type now arrives as a prop resolved on the server, so this component no
 *    longer reads search params and the rest of the page renders immediately.
 */
export function ContactForm({ defaultType }: { defaultType: string }) {
  const [formState, setFormState] = useState({ isSubmitting: false, isSuccess: false, error: '' })
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: defaultType,
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormState({ isSubmitting: true, isSuccess: false, error: '' })

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          company: null,
          source_page: '/contact',
          source_agent: 'contact-form',
          intent: formData.type,
          problem_description: formData.message,
        }),
      })

      if (!res.ok) throw new Error(`lead submit failed: ${res.status}`)
      setFormState({ isSubmitting: false, isSuccess: true, error: '' })
    } catch (err) {
      console.error('[contact] submit failed:', err)
      setFormState({
        isSubmitting: false,
        isSuccess: false,
        error: `Sorry — that didn't send. Please email ${SITE.email} or book a call, and I'll come straight back to you.`,
      })
    }
  }

  if (formState.isSuccess) {
    return (
      <div className="card-green p-8 text-center">
        <div className="text-4xl mb-4">✓</div>
        <h3 className="text-xl font-bold mb-2">Message Sent</h3>
        <p className="text-gray-light mb-4">
          It has landed in my inbox and I&apos;ll come back to you within 24-48 hours.
        </p>
        <p className="text-base text-gray-light">
          Want to talk sooner?{' '}
          <a
            href={FOUNDER.calendly}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-white"
          >
            Book a call →
          </a>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card p-8 space-y-6">
      <p className="text-base text-gray-light mb-4">
        Or leave a message and we&apos;ll get back to you:
      </p>

      {/* A failed send must SAY it failed and offer a path that works. Never a silent drop, and
          never the success screen. */}
      {formState.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-base text-red-200"
        >
          {formState.error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="label" htmlFor="contact-name">
            Your Name *
          </label>
          <input
            id="contact-name"
            type="text"
            required
            className="input"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div>
          <label className="label" htmlFor="contact-email">
            Email *
          </label>
          <input
            id="contact-email"
            type="email"
            required
            className="input"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="label" htmlFor="contact-phone">
            Phone
          </label>
          <input
            id="contact-phone"
            type="tel"
            className="input"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div>
          <label className="label" htmlFor="contact-type">
            Inquiry Type *
          </label>
          <select
            id="contact-type"
            required
            className="input"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          >
            <option value="general">General Inquiry</option>
            <option value="subscribe">Subscribe to Platforms</option>
            <option value="build">Have something built (audit / sprint)</option>
            <option value="partner">Partnership / Revenue Share</option>
            <option value="media">Media / Press</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="contact-message">
          Message *
        </label>
        <textarea
          id="contact-message"
          required
          className="textarea"
          placeholder="Tell us what you're looking for..."
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        />
      </div>

      <Button type="submit" fullWidth disabled={formState.isSubmitting}>
        {formState.isSubmitting ? 'Sending...' : 'Send Message →'}
      </Button>
    </form>
  )
}
