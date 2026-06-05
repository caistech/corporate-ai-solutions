// The ONE live-URL → survey-evidence derivation path (Rider 3, three callers).
//
// Factored out of survey/route.ts so the SAME fetch+manifest+derive runs for all three
// callers and they can't drift on what the build emits:
//   1. the coach (pre-gate, live-URL intake) — to auto-prefill the 14 fields,
//   2. the GATE (admit/route.ts) — server-authoritative re-derive for the verdict,
//   3. the post-gate survey route.
//
// Pure-ish: does the live fetches (manifest + each route's DOM), then delegates the marker
// grep + P1/P2/P3 derivation to deriveSurveyFromDom (no model, no judgement). Same DOM in ⇒
// same evidence/preHard out — the anti-flake invariant the survey rewrite established.

import { deriveSurveyFromDom, type DeriveOutput } from './survey-markers'

export interface LiveDeriveResult {
  /** The normalised base actually fetched. */
  base: string
  /** Did the homepage answer HTTP 200? (drives P1) */
  rootOk: boolean
  /** Did /survey-manifest.json yield a usable routes[] (vs the ['/'] fallback)? */
  manifestOk: boolean
  /** The routes actually fetched (manifest ∪ '/'). */
  routesFetched: string[]
  /** Per-field evidence — the shape loadCardSurvey/survey.ts consume. */
  evidence: DeriveOutput['evidence']
  /** P1/P2/P3(/P4) derived from the field results (never re-judged). */
  preHard: DeriveOutput['preHard']
  /** Per-field grep trace — legible diagnostics for the response/logs. */
  report: DeriveOutput['report']
  /** data-why-now present (P3 input). */
  whyNowPresent: boolean
}

/** Bounded fetch — a hung build must not stall the derive. Mirrors the survey route's prior local. */
export async function fetchText(url: string, ms = 8000): Promise<{ ok: boolean; text: string }> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      signal: ctrl.signal,
      headers: { 'User-Agent': 'cais-survey/1' },
    })
    return { ok: res.ok, text: res.ok ? await res.text() : '' }
  } catch {
    return { ok: false, text: '' }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Derive the 14-field survey evidence + P1/P2/P3 from a live build base URL.
 *
 * 1. fetch /survey-manifest.json (build-emitted marker-bearing routes; fall back to ['/']),
 * 2. fetch each route's live DOM (homepage 200 ⇒ P1),
 * 3. grep the data-* markers and derive evidence + pre-hard (deriveSurveyFromDom).
 *
 * The caller decides WHICH base to pass: the post-gate survey passes the live alias; the GATE
 * passes the resolved IMMUTABLE deployment URL (Rider 2) so its verdict is deployment-pinned.
 * The helper itself is agnostic to that choice — it derives from whatever base it's handed.
 */
export async function deriveFieldsFromLiveUrl(baseUrl: string): Promise<LiveDeriveResult> {
  const base = baseUrl.replace(/\/+$/, '')

  // 1. Route manifest (build-emitted) — SURVEY_MARKER_CONTRACT §4. No manifest ⇒ fall back to ['/'].
  let routes: string[] = ['/']
  let manifestOk = false
  const manifest = await fetchText(`${base}/survey-manifest.json`)
  if (manifest.ok) {
    try {
      const mj = JSON.parse(manifest.text)
      if (Array.isArray(mj?.routes) && mj.routes.length) {
        routes = mj.routes.map(String)
        manifestOk = true
      }
    } catch {
      /* malformed manifest ⇒ fall back to ['/'] */
    }
  }
  if (!routes.includes('/')) routes.unshift('/')
  routes = Array.from(new Set(routes))

  // 2. Fetch every route's DOM. P1 = the homepage answered 200.
  const doms: string[] = []
  let rootOk = false
  for (const r of routes) {
    const path = r.startsWith('/') ? r : `/${r}`
    const { ok, text } = await fetchText(`${base}${path}`)
    if (path === '/') rootOk = ok
    if (ok) doms.push(text)
  }

  // 3. Grep markers → derive per-field evidence + P1–P4 (no model, no judgement).
  const derived = deriveSurveyFromDom({ doms, rootOk })

  return {
    base,
    rootOk,
    manifestOk,
    routesFetched: routes,
    evidence: derived.evidence,
    preHard: derived.preHard,
    report: derived.report,
    whyNowPresent: derived.whyNowPresent,
  }
}
