// Resolve a Vercel project's CURRENT production deployment to its IMMUTABLE URL (Rider 2).
//
// True deployment-pinning (eng-review finding #2): a deployment_id STAMP alone does not pin —
// the gate must derive from a build that can't change under it. The live alias
// (<project>.vercel.app) always serves the newest deploy, so two gate runs across a redeploy
// disagree. The per-deployment URL (<project>-<hash>.vercel.app) is immutable: re-fetching it
// always returns the same DOM ⇒ identical deployment_id → identical verdict by construction.
//
// Needs VERCEL_TOKEN (a new operational dependency, surfaced in feature-preflight). Optional
// VERCEL_TEAM_ID scopes the lookup to a team project. ANY failure (no token, API error, no
// READY production deployment) returns null → the gate falls back to UNPINNED (no marker
// gating), and never claims deployment-pinned determinism for it.

export interface ResolvedDeployment {
  /** The Vercel deployment uid — stamped on the verdict as deployment_id. */
  deploymentId: string
  /** The IMMUTABLE per-deployment URL to derive from, e.g. https://my-app-abc123.vercel.app */
  immutableUrl: string
}

/**
 * Resolve the current READY production deployment for a Vercel project (name or prj_ id).
 * Returns null on any failure — the caller treats null as "not pinnable" (unpinned fallback).
 */
export async function resolveProdDeployment(vercelProject: string): Promise<ResolvedDeployment | null> {
  const token = process.env.VERCEL_TOKEN
  if (!token || !vercelProject) return null

  const teamId = process.env.VERCEL_TEAM_ID
  const params = new URLSearchParams({
    app: vercelProject,
    target: 'production',
    state: 'READY',
    limit: '1',
  })
  if (teamId) params.set('teamId', teamId)

  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 8000)
    const res = await fetch(`https://api.vercel.com/v6/deployments?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: ctrl.signal,
    })
    clearTimeout(t)
    if (!res.ok) return null

    const json = (await res.json()) as { deployments?: Array<{ uid?: string; url?: string }> }
    const dep = json.deployments?.[0]
    if (!dep?.uid || !dep?.url) return null

    // dep.url is the host without scheme (e.g. "my-app-abc123.vercel.app") — the immutable one.
    const immutableUrl = dep.url.startsWith('http') ? dep.url : `https://${dep.url}`
    return { deploymentId: dep.uid, immutableUrl }
  } catch {
    return null
  }
}
