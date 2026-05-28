// @explanatory-header-exempt — auth surface (password reset flow)
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/pipeline/supabase-client'

export default function PasswordResetPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [tokenInvalid, setTokenInvalid] = useState(false)

  // Verify token is in URL
  useEffect(() => {
    const token = searchParams.get('token')
    const type = searchParams.get('type')
    
    if (!token || type !== 'recovery') {
      setTokenInvalid(true)
    }
  }, [searchParams])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      
      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        setPassword('')
        setConfirmPassword('')
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/pipeline/login')
        }, 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  if (tokenInvalid) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-xl font-bold text-[#0B1F3A] mb-4">Reset Password</h1>
          <div className="bg-red-50 border border-red-200 text-red-700 rounded p-4 text-sm">
            <p className="font-medium mb-2">Invalid or expired link</p>
            <p className="mb-4">This reset link has expired or is invalid. Reset links are valid for 1 hour.</p>
            <a
              href="/pipeline/login"
              className="inline-block px-4 py-2 bg-[#FF6B35] text-white font-semibold rounded hover:bg-[#e85a25] transition-colors"
            >
              Back to Log In
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-xl font-bold text-[#0B1F3A] mb-4">Password Reset</h1>
          <div className="bg-[#0B7A5C]/10 border border-[#0B7A5C]/30 text-[#0B7A5C] rounded p-4 text-sm">
            <p className="font-medium mb-2">Success!</p>
            <p>Your password has been reset. Redirecting to log in…</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-xl font-bold text-[#0B1F3A] mb-1">Reset Password</h1>
        <p className="text-sm text-[#5C6B7A] mb-6">
          Enter your new password below.
        </p>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
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

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 min-h-[44px] border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1E5AA8] focus:border-transparent"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[44px] bg-[#FF6B35] text-white font-semibold rounded px-4 py-2 hover:bg-[#e85a25] disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>

        <p className="text-xs text-[#5C6B7A] text-center mt-4">
          Remember your password?{' '}
          <a href="/pipeline/login" className="text-[#1E5AA8] hover:underline">
            Back to log in
          </a>
        </p>
      </div>
    </div>
  )
}
