// @explanatory-header-exempt — auth surface (login / signup / password flows are self-explanatory by web convention)
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/pipeline/supabase-client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/pipeline/auth/callback`,
        },
      })
      if (error) {
        setError(error.message)
      } else {
        setSent(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-xl font-bold text-[#0B1F3A] mb-1">Pipeline</h1>
        <p className="text-sm text-[#5C6B7A] mb-6">Sign in with a magic link.</p>

        {sent ? (
          <div className="bg-[#0B7A5C]/10 border border-[#0B7A5C]/30 text-[#0B7A5C] rounded p-4 text-sm">
            Check your inbox — the magic link was sent to <strong>{email}</strong>. The link opens this app at <code>/pipeline/auth/callback</code> and signs you in.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1E5AA8] focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[44px] bg-[#FF6B35] text-white font-semibold rounded px-4 py-2 hover:bg-[#e85a25] disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
