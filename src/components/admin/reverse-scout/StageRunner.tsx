'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Stage = 'card' | 'pattern'

const LABELS: Record<Stage, { idle: string; running: string }> = {
  card: { idle: 'Generate Capability Card', running: 'Analysing…' },
  pattern: { idle: 'Abstract Pattern', running: 'Abstracting… (Opus, ~30–60s)' },
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

  async function run() {
    setError(null)
    setRunning(true)
    try {
      const res = await fetch(`/api/admin/reverse-scout/assets/${assetId}/${stage}`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `Stage failed (HTTP ${res.status})`)
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
        className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {running ? LABELS[stage].running : label}
      </button>
      {disabled && disabledHint && !running && <p className="text-xs text-gray-light">{disabledHint}</p>}
      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
      )}
    </div>
  )
}
