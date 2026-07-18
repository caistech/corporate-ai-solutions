'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2 } from 'lucide-react'

type Stage = 'card' | 'pattern'

const LABELS: Record<Stage, { idle: string; running: string; done: string }> = {
  card: {
    idle: 'Generate Capability Card',
    running: 'Analysing… (~10–20s, please wait)',
    done: 'Capability Card generated — see above.',
  },
  pattern: {
    idle: 'Abstract Pattern',
    running: 'Abstracting on Opus… (~30–60s, please wait)',
    done: 'Pattern map generated — see above.',
  },
}

export function StageRunner({
  assetId,
  stage,
  hasResult,
  disabled,
  disabledHint,
}: {
  assetId: string
  stage: Stage
  hasResult: boolean
  disabled?: boolean
  disabledHint?: string
}) {
  const router = useRouter()
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function run() {
    setError(null)
    setDone(false)
    setRunning(true)
    try {
      const res = await fetch(`/api/admin/reverse-scout/assets/${assetId}/${stage}`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `Stage failed (HTTP ${res.status})`)
      // Soft-refresh re-runs the server component so the new result renders above.
      // Client state (this `done` flag) survives the refresh, so the confirmation stays visible.
      setDone(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stage failed')
    } finally {
      setRunning(false)
    }
  }

  const label = hasResult ? `Re-run · ${LABELS[stage].idle}` : LABELS[stage].idle

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={run}
        disabled={running || disabled}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {running && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {running ? LABELS[stage].running : label}
      </button>
      {running && (
        <p className="text-xs text-gray-light" role="status">
          Working — this calls the model and can take a bit. Leave this open; the result appears above when it&apos;s
          ready.
        </p>
      )}
      {done && !running && !error && (
        <p className="flex items-center gap-2 rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          {LABELS[stage].done}
        </p>
      )}
      {disabled && disabledHint && !running && <p className="text-xs text-gray-light">{disabledHint}</p>}
      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
      )}
    </div>
  )
}
