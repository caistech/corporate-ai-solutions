'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

type Stage = 'card' | 'pattern'

const LABELS: Record<Stage, { idle: string; running: string }> = {
  card: { idle: 'Generate Capability Card', running: 'Analysing… (~10–20s, please wait)' },
  pattern: { idle: 'Abstract Pattern', running: 'Abstracting on Opus… (~30–60s, please wait)' },
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
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setError(null)
    setRunning(true)
    try {
      const res = await fetch(`/api/admin/reverse-scout/assets/${assetId}/${stage}`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `Stage failed (HTTP ${res.status})`)
      // The result is persisted; reload so the server component re-reads and renders it.
      // A hard reload (not router.refresh) guarantees the new card/pattern shows — the soft
      // refresh proved unreliable here, leaving the page unchanged after a successful run.
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stage failed')
      setRunning(false)
    }
    // On success we intentionally do NOT clear `running` — the page reloads, so the spinner
    // stays until the fresh render replaces it.
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
          Working — this calls the model and can take a bit. The page refreshes with the result when it&apos;s ready.
        </p>
      )}
      {disabled && disabledHint && !running && <p className="text-xs text-gray-light">{disabledHint}</p>}
      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
      )}
    </div>
  )
}
