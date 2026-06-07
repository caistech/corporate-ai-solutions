/**
 * Headless AUTO-probe producer — the server-runnable verdicts the orchestrator (rescore) can
 * re-run with no browser and no repo: a plain fetch of the product's LIVE url + cheap signal
 * checks. Writes verdicts through the shared upsertReadinessResult seam (same contract as the
 * survey producer), binding to the supplied deployment.
 *
 * SCOPE — intentionally only the checks a server-side HTTP fetch can honestly judge. Most rubric
 * checks need a BROWSER (naive-tester: responsive, UX, auth flows) or the product REPO
 * (@caistech-first, env hygiene, preflight) — those belong to the agent/CI runner, NOT here.
 * Adding a check that this can't really verify (and faking a pass) is the failure mode this scope
 * guards against. Degrade-don't-fake: if the fetch fails, we record NOTHING (no fabricated pass).
 *
 * Currently covers: #7 (scaffold title is the product name, not the Next default). Extension
 * point below — add a probe only when a live-HTML/header fetch can truly decide it.
 */

import { upsertReadinessResult } from './readiness-results'

export interface ProbeResult {
  code: string
  status: 'pass' | 'fail'
  evidence: string
}

// Default scaffold / framework titles that mean "metadata was never customised".
const BAD_TITLES = [/create next app/i, /^next\.?js$/i, /^untitled/i, /^react app$/i, /^vite/i]

export async function runHeadlessAutoProbes(
  slug: string,
  url: string,
  deploymentId: string,
): Promise<ProbeResult[]> {
  const target = /^https?:\/\//i.test(url) ? url : `https://${url}`
  let html = ''
  try {
    const res = await fetch(target, { redirect: 'follow', headers: { 'user-agent': 'cais-readiness-probe' } })
    html = await res.text()
  } catch (err) {
    // Can't reach the live URL → degrade-don't-fake: record nothing (the check stays "not tested"
    // rather than a fabricated verdict).
    console.warn('[auto-probes] fetch failed, recording nothing:', target, err instanceof Error ? err.message : err)
    return []
  }

  const results: ProbeResult[] = []

  // #7 — the browser-tab title is the product name, not the scaffold default.
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  const title = (m?.[1] ?? '').trim()
  const titleOk = title.length > 0 && !BAD_TITLES.some((r) => r.test(title))
  results.push({
    code: '7',
    status: titleOk ? 'pass' : 'fail',
    evidence: title ? `<title>="${title}"` : 'no <title> element found',
  })

  // --- extension point: add a probe here ONLY when a live-HTML/header fetch can truly decide it ---

  for (const r of results) {
    await upsertReadinessResult({
      productSlug: slug,
      checkCode: r.code,
      status: r.status,
      source: 'auto',
      evidence: r.evidence,
      deploymentId,
    })
  }
  return results
}
