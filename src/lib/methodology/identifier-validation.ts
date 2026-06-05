// The ONE definition of "is this a valid live build" (Rider 6, DRY).
//
// In the one-door model, the create route only CAPTURES identifiers; validation moves to the
// GATE (admit). This module is the single home for the format + live-probe checks so create and
// admit can't drift on two copies. (Extracted from the superseded create/route.ts review branch.)

export interface Identifiers {
  liveUrl: string
  githubRepo: string
  vercelProject: string
  supabaseRef: string
  eccProjectId: string
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const REPO_RE = /^[\w.-]+\/[\w.-]+$/ // owner/name
export const SUPABASE_REF_RE = /^[a-z0-9]{20}$/ // 20-char project ref
export const VERCEL_PROJECT_RE = /^(prj_[A-Za-z0-9]+|[a-z0-9][a-z0-9._-]{0,99})$/i

/** Live probe: the URL must actually resolve. 2xx/3xx counts as live. */
export async function urlResolves(url: string): Promise<boolean> {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 8000)
    const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal })
    clearTimeout(t)
    return res.status >= 200 && res.status < 400
  } catch {
    return false
  }
}

/** Live probe: the GitHub repo must exist. Uses GITHUB_TOKEN when present (rate limit). */
export async function repoExists(ownerName: string): Promise<boolean> {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 8000)
    const headers: Record<string, string> = { Accept: 'application/vnd.github+json' }
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
    const res = await fetch(`https://api.github.com/repos/${ownerName}`, { headers, signal: ctrl.signal })
    clearTimeout(t)
    return res.status === 200
  } catch {
    return false
  }
}

/**
 * Validate the five identifiers for a deployed product. Returns human-legible blockers
 * (empty ⇒ ok). All five are required; format checks are cheap (no network), live probes only
 * run when the format passes (don't waste a network call on junk).
 */
export async function validateIdentifiers(id: Identifiers): Promise<string[]> {
  const blockers: string[] = []

  // Presence — all five required.
  if (!id.liveUrl) blockers.push('live URL required')
  if (!id.githubRepo) blockers.push('github repo (owner/name) required')
  if (!id.vercelProject) blockers.push('vercel project required')
  if (!id.supabaseRef) blockers.push('supabase project ref required')
  if (!id.eccProjectId) blockers.push('ecc_project_id required')
  if (blockers.length > 0) return blockers

  // Format checks (cheap, no network).
  if (!REPO_RE.test(id.githubRepo)) blockers.push(`github repo must be "owner/name": ${id.githubRepo}`)
  if (!UUID_RE.test(id.eccProjectId)) blockers.push(`ecc_project_id must be a UUID: ${id.eccProjectId}`)
  if (!SUPABASE_REF_RE.test(id.supabaseRef)) blockers.push(`supabase_ref looks malformed (expect 20-char ref): ${id.supabaseRef}`)
  if (!VERCEL_PROJECT_RE.test(id.vercelProject)) blockers.push(`vercel_project looks malformed: ${id.vercelProject}`)

  // Live probes — only if format passed.
  if (REPO_RE.test(id.githubRepo) && !(await repoExists(id.githubRepo))) {
    blockers.push(`github repo not found (or private without GITHUB_TOKEN): ${id.githubRepo}`)
  }
  if (!(await urlResolves(id.liveUrl))) {
    blockers.push(`live URL did not resolve (need HTTP 2xx/3xx): ${id.liveUrl}`)
  }

  return blockers
}
