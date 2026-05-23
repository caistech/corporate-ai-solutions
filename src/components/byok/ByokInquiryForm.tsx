'use client'

import { useState, FormEvent } from 'react'
import { CheckCircle2, Loader2, Rocket } from 'lucide-react'

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

interface Props {
  productSlug: string
  productName: string
}

// Canonical Decision 2 intent placeholder copy — do not paraphrase.
const INTENT_PLACEHOLDER =
  "Interested to know how you're going to use this — and love for you to share your experience and your use case when it's up."

export function ByokInquiryForm({ productSlug, productName }: Props) {
  const [state, setState] = useState<SubmitState>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [deployUrl, setDeployUrl] = useState<string>('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state === 'submitting') return
    setState('submitting')
    setErrorMessage('')

    const formData = new FormData(event.currentTarget)
    const payload = {
      product_slug: productSlug,
      name: String(formData.get('name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      phone: String(formData.get('phone') || '').trim() || undefined,
      intent: String(formData.get('intent') || '').trim() || undefined,
    }

    try {
      const res = await fetch('/api/byok-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrorMessage(json.error || `Submission failed (${res.status})`)
        setState('error')
        return
      }
      setDeployUrl(json.deployUrl || '')
      setState('success')
    } catch (err) {
      console.error(err)
      setErrorMessage('Network error — please retry.')
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <div className="bg-gray-dark border border-accent/30 rounded-lg p-8 text-center">
        <CheckCircle2 className="text-accent mx-auto mb-4" size={48} />
        <h3 className="text-2xl font-bold mb-3">Thanks — over to you</h3>
        <p className="text-gray-light mb-6">
          Continue to the one-click Vercel deploy for {productName}. You bring your own keys; the deploy lands in your own GitHub + Vercel account.
        </p>
        {deployUrl ? (
          <a
            href={deployUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 text-base"
          >
            <Rocket size={18} /> Deploy {productName} to your own Vercel
          </a>
        ) : (
          <p className="text-sm text-gray-light/70">
            Deploy URL unavailable. Check back shortly or email directly.
          </p>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
          Name <span className="text-accent">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none focus:border-accent"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
          Email <span className="text-accent">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none focus:border-accent"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-white mb-2">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none focus:border-accent"
        />
      </div>

      <div>
        <label htmlFor="intent" className="block text-sm font-medium text-white mb-2">
          Intent
        </label>
        <textarea
          id="intent"
          name="intent"
          rows={4}
          placeholder={INTENT_PLACEHOLDER}
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none focus:border-accent placeholder:text-gray-500"
        />
      </div>

      {state === 'error' && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={state === 'submitting'}
        className="btn btn-primary w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-base disabled:opacity-60"
      >
        {state === 'submitting' ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Submitting…
          </>
        ) : (
          <>
            Continue to deploy <Rocket size={18} />
          </>
        )}
      </button>

      <p className="text-xs text-gray-light/60 text-center">
        On submit you&apos;ll be handed off to Vercel&apos;s deploy flow for {productName}. The form
        captures a lightweight lead so we can follow up on your use case.
      </p>
    </form>
  )
}
