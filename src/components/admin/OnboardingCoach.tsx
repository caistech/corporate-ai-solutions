'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'
import VoiceCoach from './VoiceCoach'

// One intake conversation: Morgan (voice + an in-widget text box for typing/pasting). The former
// separate "type instead" chat was removed — it was a second conversation Morgan couldn't see, so
// switching to it lost context. Everything now flows through VoiceCoach's single session, which
// saves each field to the card as it's captured and ends at the unchanged admit gate.

export default function OnboardingCoach() {
  const [productName, setProductName] = useState('')
  const [started, setStarted] = useState(false)
  const [creating, setCreating] = useState(false)
  const [productSlug, setProductSlug] = useState<string | null>(null)

  // One door: optional asset identifiers. A live URL flips the product to "deployed" (derived,
  // never chosen) — the admission gate re-derives the build markers from the pinned deployment.
  const [liveUrl, setLiveUrl] = useState('')
  const [githubRepo, setGithubRepo] = useState('')
  const [vercelProject, setVercelProject] = useState('')
  const [supabaseRef, setSupabaseRef] = useState('')
  const [eccProjectId, setEccProjectId] = useState('')
  const isDeployed = liveUrl.trim() !== ''

  const [createError, setCreateError] = useState<string | null>(null)
  const [admitted, setAdmitted] = useState(false)

  // Create the INCOMPLETE-SPEC row, then hand off to the voice coach.
  async function startIdea() {
    if (!productName.trim() || creating) return
    setCreating(true)
    setCreateError(null)
    try {
      const res = await fetch('/api/admin/pipeline/new-ideas/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: productName.trim(),
          // Optional asset fields — create derives entry_mode from liveUrl presence.
          liveUrl: liveUrl.trim() || undefined,
          githubRepo: githubRepo.trim() || undefined,
          vercelProject: vercelProject.trim() || undefined,
          supabaseRef: supabaseRef.trim() || undefined,
          eccProjectId: eccProjectId.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCreateError(data.error || 'Could not create the idea row.')
        return
      }
      setProductSlug(data.productSlug)
      setStarted(true)
    } catch {
      setCreateError('Network error creating the idea.')
    } finally {
      setCreating(false)
    }
  }

  // --- Admitted: terminal success state ---
  if (admitted && productSlug) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-green-700/50">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <h2 className="text-lg font-semibold">Idea admitted to the pipeline</h2>
        </div>
        <p className="text-gray-400 text-sm mb-4">
          {productName} is now in-pipeline with its 14-field spec and feasibility context.
        </p>
        <a
          href={`/admin/pipeline/${productSlug}`}
          className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium text-sm"
        >
          Open in pipeline →
        </a>
      </div>
    )
  }

  // --- Pre-start: one door (name + optional assets; deployed-vs-new derived from the URL) ---
  if (!started) {
    const inputCls =
      'w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500'
    return (
      <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
        <h2 className="text-lg font-semibold mb-2">Start a Product</h2>
        <p className="text-gray-400 text-sm mb-4">
          Name it, then Morgan, the intake coach, draws out the 14-field spec by voice. A brand-new
          idea walks the clean-sheet chain; an already-built product (add its live URL below) is
          audited — the admission gate re-derives what the build evidences.
        </p>

        <input
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && startIdea()}
          placeholder="Product name…"
          className={inputCls}
        />

        {/* Optional asset fields — a live URL derives "deployed" (never chosen). */}
        <div className="mt-4 border-t border-gray-700 pt-4 space-y-2">
          <p className="text-xs text-gray-500">
            Already built? Add its assets (leave blank for a brand-new idea). A live URL switches
            this to a build audit.
          </p>
          <input value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} placeholder="Live URL (https://…)" className={inputCls} />
          <input value={githubRepo} onChange={(e) => setGithubRepo(e.target.value)} placeholder="GitHub repo (owner/name)" className={inputCls} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input value={vercelProject} onChange={(e) => setVercelProject(e.target.value)} placeholder="Vercel project" className={inputCls} />
            <input value={supabaseRef} onChange={(e) => setSupabaseRef(e.target.value)} placeholder="Supabase ref" className={inputCls} />
            <input value={eccProjectId} onChange={(e) => setEccProjectId(e.target.value)} placeholder="ECC project_id (UUID)" className={inputCls} />
          </div>
          {isDeployed && (
            <p className="text-xs text-blue-300/80">
              Deployed product — tell Morgan it&apos;s already built and she&apos;ll confirm what the
              build evidences. The admission gate re-derives the build markers from the pinned deployment.
            </p>
          )}
        </div>

        <button
          onClick={startIdea}
          disabled={!productName.trim() || creating}
          className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:opacity-50 rounded-lg font-medium text-sm flex items-center justify-center gap-2"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : isDeployed ? 'Audit the build →' : 'Start'}
        </button>
        {createError && <p className="text-red-400 text-sm mt-3">{createError}</p>}
      </div>
    )
  }

  // --- Conversation: voice-first with Morgan; one session, fields saved as they're captured. ---
  return productSlug ? (
    <VoiceCoach productSlug={productSlug} productName={productName} onAdmitted={() => setAdmitted(true)} />
  ) : null
}
