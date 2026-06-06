'use client'

import { useEffect, useState } from 'react'
import { Loader2, ShieldCheck, ShieldOff, Copy, Check } from 'lucide-react'

type Status =
  | { state: 'loading' }
  | { state: 'token-missing' }
  | { state: 'ready'; enabled: boolean; count: number }
  | { state: 'error'; message: string }

export function DeploymentBypassToggle() {
  const [status, setStatus] = useState<Status>({ state: 'loading' })
  const [busy, setBusy] = useState(false)
  const [secret, setSecret] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function refresh() {
    try {
      const res = await fetch('/api/admin/vercel-bypass', { credentials: 'include' })
      const data = await res.json()
      if (!res.ok) {
        setStatus({ state: 'error', message: data.error || 'Failed to read status' })
        return
      }
      if (data.tokenMissing) {
        setStatus({ state: 'token-missing' })
        return
      }
      setStatus({ state: 'ready', enabled: !!data.enabled, count: data.count ?? 0 })
    } catch {
      setStatus({ state: 'error', message: 'Network error reading status' })
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function toggle(action: 'enable' | 'disable') {
    setBusy(true)
    setSecret(null)
    setCopied(false)
    try {
      const res = await fetch('/api/admin/vercel-bypass', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus({ state: 'error', message: data.error || `${action} failed` })
        return
      }
      if (action === 'enable' && data.secret) setSecret(data.secret)
      await refresh()
    } catch {
      setStatus({ state: 'error', message: `Network error on ${action}` })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      {status.state === 'loading' && (
        <p className="flex items-center gap-2 text-sm text-gray-light/70">
          <Loader2 className="animate-spin" size={15} /> Checking status…
        </p>
      )}

      {status.state === 'token-missing' && (
        <p className="rounded border border-amber-700/50 bg-amber-900/20 p-3 text-sm text-amber-200">
          <code>VERCEL_API_TOKEN</code> is not set on the server. Add it (sensitive, prod+preview)
          and redeploy, then this toggle activates.
        </p>
      )}

      {status.state === 'error' && (
        <p className="rounded border border-red-700/50 bg-red-900/20 p-3 text-sm text-red-200">
          {status.message}
        </p>
      )}

      {status.state === 'ready' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span
              className={`inline-flex items-center gap-2 text-sm font-medium ${
                status.enabled ? 'text-green-300' : 'text-gray-light/70'
              }`}
            >
              {status.enabled ? <ShieldCheck size={16} /> : <ShieldOff size={16} />}
              {status.enabled ? `Bypass active (${status.count} secret${status.count !== 1 ? 's' : ''})` : 'Bypass off'}
            </span>
            <button
              onClick={() => toggle(status.enabled ? 'disable' : 'enable')}
              disabled={busy}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                status.enabled ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {busy ? <Loader2 className="animate-spin" size={15} /> : null}
              {status.enabled ? 'Revoke bypass' : 'Enable bypass'}
            </button>
          </div>

          {secret && (
            <div className="rounded border border-green-700/50 bg-green-900/20 p-3">
              <p className="mb-2 text-sm text-green-200">
                Secret generated — copy it now (shown once). Put it in the tester machine&rsquo;s{' '}
                <code>.env.local</code> as <code>VERCEL_AUTOMATION_BYPASS_SECRET</code>.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all rounded bg-black/40 px-2 py-1.5 text-xs text-green-100">
                  {secret}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(secret).then(() => {
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    })
                  }}
                  className="inline-flex items-center gap-1 rounded bg-gray-700 px-2 py-1.5 text-xs text-white hover:bg-gray-600"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
