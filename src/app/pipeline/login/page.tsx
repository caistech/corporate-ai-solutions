// @explanatory-header-exempt — auth surface (login / signup / password flows are self-explanatory by web convention)
'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/pipeline/supabase-client'

type AuthTab = 'signup' | 'login' | 'forgot-password'

export default function LoginPage() {
  const [tab, setTab] = useState<AuthTab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/pipeline/auth/callback`,
        },
      })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Check your inbox — confirm your email to activate your account.')
        setEmail('')
        setPassword('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Signed in! Redirecting…')
        setEmail('')
        setPassword('')
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
            emailRedirectTo: `${window.location.origin}/pipeline/auth/callback`,
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
        redirectTo: `${window.location.origin}/pipeline/password-reset`,
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
        <h1 className="text-xl font-bold text-[#0B1F3A] mb-1">Pipeline Cockpit</h1>
        <p className="text-sm text-[#5C6B7A] mb-6">
          The product-validation pipeline. Sign in to triage ideas through the go/no-go gates.
        </p>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {(['signup', 'login', 'forgot-password'] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t)
                setError(null)
                setSuccess(null)
                setSent(false)
              }}
              className={`pb-2 px-2 text-sm font-medium transition-colors ${
                tab === t
                  ? 'text-[#FF6B35] border-b-2 border-[#FF6B35]'
                  : 'text-[#5C6B7A] hover:text-[#0B1F3A]'
              }`}
            >
              {t === 'signup' && 'Sign Up'}
              {t === 'login' && 'Log In'}
              {t === 'forgot-password' && 'Forgot Password'}
            </button>
          ))}
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 bg-[#0B7A5C]/10 border border-[#0B7A5C]/30 text-[#0B7A5C] rounded p-3 text-sm">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">
            {error}
          </div>
        )}

        {/* Sign Up Form */}
        {tab === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1E5AA8] focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 min-h-[44px] border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1E5AA8] focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[44px] bg-[#FF6B35] text-white font-semibold rounded px-4 py-2 hover:bg-[#e85a25] disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Creating account…' : 'Sign Up'}
            </button>
            <p className="text-xs text-[#5C6B7A] text-center">
              Or use magic link: switch to <button
                type="button"
                onClick={() => setTab('login')}
                className="text-[#1E5AA8] hover:underline"
              >
                Log In
              </button>
            </p>
          </form>
        )}

        {/* Log In Form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1E5AA8] focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 min-h-[44px] border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1E5AA8] focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[44px] bg-[#FF6B35] text-white font-semibold rounded px-4 py-2 hover:bg-[#e85a25] disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Logging in…' : 'Log In'}
            </button>
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-[#5C6B7A]">or</span>
              </div>
            </div>
            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault()
                setError(null)
                setSuccess(null)
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
                    setSuccess(`Magic link sent to ${email}`)
                  }
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Unknown error')
                } finally {
                  setSubmitting(false)
                }
              }}
              disabled={submitting}
              className="w-full min-h-[44px] bg-gray-100 text-[#0B1F3A] font-semibold rounded px-4 py-2 hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Sending…' : 'Send Magic Link'}
            </button>
            <button
              type="button"
              onClick={() => setTab('forgot-password')}
              className="w-full text-sm text-[#1E5AA8] hover:underline text-center"
            >
              Forgot password?
            </button>
          </form>
        )}

        {/* Forgot Password Form */}
        {tab === 'forgot-password' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label htmlFor="forgot-email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                id="forgot-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1E5AA8] focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>
            <p className="text-xs text-[#5C6B7A]">
              We&apos;ll send you a link to reset your password. The link expires in 1 hour.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[44px] bg-[#FF6B35] text-white font-semibold rounded px-4 py-2 hover:bg-[#e85a25] disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Sending…' : 'Send Reset Link'}
            </button>
            <button
              type="button"
              onClick={() => setTab('login')}
              className="w-full text-sm text-[#1E5AA8] hover:underline text-center"
            >
              Back to Log In
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
