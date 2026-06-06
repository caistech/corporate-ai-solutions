// @explanatory-header-exempt — auth surface (login / signup / password flows are self-explanatory by web convention)
'use client'

// The CANONICAL admin login entry (PRODUCT_STANDARDS §8.5 dual-auth portal): /admin/login → /admin,
// gated by the ADMIN_EMAILS allowlist. The old /admin/pipeline/login redirects here. The magic-link
// callback (/admin/pipeline/auth/callback) and password reset (/admin/pipeline/password-reset) keep
// their existing paths — those are in the Supabase redirect allowlist, so moving them would break
// the magic-link / reset round-trip; only the entry URL is standardised here.

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/pipeline/supabase-client'
import Link from 'next/link'

type AuthTab = 'login' | 'forgot-password'

export default function AdminLoginPage() {
  const [tab, setTab] = useState<AuthTab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (authError) {
        setError(authError.message)
      } else {
        // Check if user is in ADMIN_EMAILS list
        const response = await fetch('/api/admin/verify-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        const { isAdmin } = await response.json()
        if (!isAdmin) {
          // Sign out and reject
          await supabase.auth.signOut()
          setError('Admin access denied. Please contact your administrator.')
          return
        }
        setSuccess('Signed in! Redirecting to admin dashboard…')
        setEmail('')
        setPassword('')
        // §8.5: admin login lands on the control panel (the /admin dashboard).
        // HARD navigation (not router.push): a soft client nav can race the just-written
        // @supabase/ssr auth cookies, so the server middleware's getUser() sees no session and
        // bounces back to /admin/login (the redirect-loop symptom). A full request guarantees the
        // freshly-set cookies are attached and the server reads a real session.
        window.location.assign('/admin')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)
    try {
      const supabase = createClient()
      const result = await Promise.race([
        supabase.auth.signInWithOtp({
          email,
          options: {
            // Existing, allowlisted callback path — do not change without updating the Supabase
            // redirect allow-list (would break the magic-link round-trip).
            emailRedirectTo: `${window.location.origin}/admin/pipeline/auth/callback`,
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), 12000),
        ),
      ])
      const { error } = result as Awaited<ReturnType<typeof supabase.auth.signInWithOtp>>
      if (error) {
        setError(error.message)
      } else {
        setSent(true)
        setSuccess(`Check your inbox — magic link sent to ${email}`)
      }
    } catch (err) {
      setError(
        err instanceof Error && err.message === 'TIMEOUT'
          ? "Couldn't send the link right now — please try again."
          : err instanceof Error
            ? err.message
            : 'Unknown error',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Existing, allowlisted reset path (see note above).
        redirectTo: `${window.location.origin}/admin/pipeline/password-reset`,
      })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Check your inbox — reset link sent. This link expires in 1 hour.')
        setEmail('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-xl font-bold text-[#0B1F3A] mb-1">Pipeline Admin</h1>
        <p className="text-sm text-[#5C6B7A] mb-6">
          Control dashboard for product managers and distributors. Manage users, validation tests, and outreach workflows.
        </p>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {(['login', 'forgot-password'] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t)
                setError(null)
                setSuccess(null)
                setSent(false)
              }}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                tab === t
                  ? 'text-[#0B1F3A] border-b-2 border-[#0B1F3A]'
                  : 'text-[#5C6B7A] hover:text-[#0B1F3A]'
              }`}
            >
              {t === 'login' ? 'Sign In' : 'Forgot Password'}
            </button>
          ))}
        </div>

        {/* Login Tab */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0B1F3A] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@company.com"
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0B1F3A] mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C6B7A] hover:text-[#0B1F3A]"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setTab('forgot-password')
                  setError(null)
                  setSuccess(null)
                }}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Forgot password?
              </button>
            </div>

            <div className="text-center text-sm text-[#5C6B7A]">
              Not an admin?{' '}
              <Link href="/pipeline/login" className="text-blue-600 hover:text-blue-700 font-medium">
                User login
              </Link>
            </div>

            {/* Magic Link Button */}
            <button
              type="button"
              onClick={() => {
                setTab('login')
                handleMagicLink({ preventDefault: () => {} } as React.FormEvent)
              }}
              className="w-full px-4 py-2 border-2 border-gray-200 text-[#0B1F3A] font-medium rounded-lg hover:border-gray-300 transition-colors"
            >
              {sent ? 'Link sent — check your inbox' : 'Use magic link instead'}
            </button>
          </form>
        )}

        {/* Forgot Password Tab */}
        {tab === 'forgot-password' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0B1F3A] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@company.com"
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Sending…' : 'Send Reset Link'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setTab('login')
                  setError(null)
                  setSuccess(null)
                }}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Back to sign in
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
