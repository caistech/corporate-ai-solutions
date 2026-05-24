'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/pipeline/supabase-client'

const MIN_LENGTH = 8

export function ChangePasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    setErr(null)

    if (password.length < MIN_LENGTH) {
      setErr(`Password must be at least ${MIN_LENGTH} characters.`)
      return
    }
    if (password !== confirm) {
      setErr('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setErr(error.message)
        return
      }
      // updateUser keeps the current session — no re-login needed.
      setMsg('Password updated. Your session stays signed in.')
      setPassword('')
      setConfirm('')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 pr-11 text-base text-white outline-none focus:border-accent min-h-[44px]'

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="text-sm uppercase tracking-wider text-gray-light/70">New password</span>
        <div className="relative mt-1">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            className={inputClass}
            placeholder="At least 8 characters"
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-light hover:text-white"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </label>

      <label className="block">
        <span className="text-sm uppercase tracking-wider text-gray-light/70">Confirm new password</span>
        <div className="relative mt-1">
          <input
            type={showConfirm ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            className={inputClass}
            placeholder="Re-enter the new password"
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label={showConfirm ? 'Hide password' : 'Show password'}
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-light hover:text-white"
          >
            {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </label>

      {msg && (
        <p className="text-sm text-emerald-300" role="status">
          {msg}
        </p>
      )}
      {err && (
        <p className="text-sm text-red-300" role="alert">
          {err}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="min-h-[44px] w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-accent/90 disabled:opacity-50 sm:w-auto"
      >
        {submitting ? 'Updating…' : 'Update password'}
      </button>
    </form>
  )
}
