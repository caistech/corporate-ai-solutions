'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SourceType } from '@/lib/reverse-scout/types'

interface PortfolioOption {
  name: string
  text: string
}

const SOURCE_TYPES: { value: SourceType; label: string }[] = [
  { value: 'paste', label: 'Pasted description' },
  { value: 'repo', label: 'Repository' },
  { value: 'doc', label: 'Document' },
]

const inputClass =
  'w-full rounded-lg border border-gray-border bg-black px-3 py-2 text-base text-white placeholder:text-gray-light focus:border-accent focus:outline-none'

export function NewAssetForm({ portfolioOptions }: { portfolioOptions: PortfolioOption[] }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [sourceType, setSourceType] = useState<SourceType>('paste')
  const [rawRef, setRawRef] = useState('')
  const [sourceText, setSourceText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function prefill(option: PortfolioOption) {
    setName(option.name)
    setSourceText(option.text)
    setSourceType('paste')
    setError(null)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/reverse-scout/assets', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          source_type: sourceType,
          raw_ref: rawRef.trim() || undefined,
          source_text: sourceText.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create asset')
      router.push(`/admin/reverse-scout/${json.asset.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create asset')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {portfolioOptions.length > 0 && (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-light">Prefill from a portfolio product</label>
          <select
            className={inputClass}
            defaultValue=""
            onChange={(e) => {
              const opt = portfolioOptions.find((o) => o.name === e.target.value)
              if (opt) prefill(opt)
            }}
          >
            <option value="" disabled>
              Select a product to dogfood on…
            </option>
            {portfolioOptions.map((o) => (
              <option key={o.name} value={o.name}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="rs-name" className="mb-1 block text-xs font-medium text-gray-light">
            Asset name
          </label>
          <input
            id="rs-name"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Crew scheduler"
            required
          />
        </div>
        <div>
          <label htmlFor="rs-source-type" className="mb-1 block text-xs font-medium text-gray-light">
            Source type
          </label>
          <select
            id="rs-source-type"
            className={inputClass}
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value as SourceType)}
          >
            {SOURCE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="rs-raw-ref" className="mb-1 block text-xs font-medium text-gray-light">
          Reference <span className="text-gray-light">(optional — repo URL, doc name)</span>
        </label>
        <input
          id="rs-raw-ref"
          className={inputClass}
          value={rawRef}
          onChange={(e) => setRawRef(e.target.value)}
          placeholder="https://github.com/…"
        />
      </div>

      <div>
        <label htmlFor="rs-source-text" className="mb-1 block text-xs font-medium text-gray-light">
          Asset material
        </label>
        <textarea
          id="rs-source-text"
          className={`${inputClass} min-h-[160px] resize-y`}
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          placeholder="Paste what the asset does — the more concrete, the better the abstraction."
          required
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto"
      >
        {submitting ? 'Adding…' : 'Add asset'}
      </button>
    </form>
  )
}
