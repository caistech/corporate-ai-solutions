/**
 * POST /api/admin/pipeline/[productId]/survey
 *
 * Records a survey-gate verdict for a BUILT product — now FULLY DETERMINISTIC.
 *
 * Previously this consumed an LLM-emitted survey.json (per-field evidence + P1–P4) produced by
 * the naive-tester OpenCode workflow. That path was non-deterministic: the same/improving
 * deal-findrs build scored 12/14 → 10/14 → 9/14 across three identical runs, with an intra-run
 * self-contradiction (evidenced "Agency Owner / Principal" as buyer title, then failed P2 for "no
 * named archetype"). The model did two jobs — find evidence AND judge it — and the judgement drifted.
 *
 * This route now does the survey itself, in code:
 *   1. resolve the build's base URL,
 *   2. fetch /survey-manifest.json (build-emitted list of marker-bearing routes),
 *   3. fetch each route's live DOM,
 *   4. grep the 14 `data-*` markers (+ data-why-now) and DERIVE per-field evidence + P1–P4
 *      (deriveSurveyFromDom — SURVEY_MARKER_CONTRACT §5; P2/P3 derived from the field results,
 *      so they can no longer contradict them),
 *   5. feed that into loadCardSurvey(slug, { evidence, preHard }) — UNCHANGED — which supplies the
 *      DB half (the 14 columns + the live mvp_url check) and runs survey.ts (UNCHANGED).
 *
 * No model is in the loop. Same DOM ⇒ same verdict. The OpenCode survey workflow (survey.yml),
 * SURVEY_MODE.md, and the auth/model wiring are RETIRED — the cockpit kickoff now POSTs here directly.
 *
 * Body (all optional):
 *   { url?: string, deployment_id?: string }
 *   - url:           override base URL (default https://<slug>.vercel.app)
 *   - deployment_id: bind the recorded gate to a specific build (Delta-2). Omitted ⇒ provisional.
 *
 * Three-door verdict (survey.ts): INCOMPLETE-SPEC → Stage 1/2 · TEARDOWN → re-enter Stage 2 ·
 * RENOVATION → Stage 5. RENOVATION records a gate PASS; the other two FAIL.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { loadCardSurvey, type SurveyEvidence } from '@/lib/methodology/load-card-survey'
import { recordGate } from '@/lib/methodology/pipeline-gates'
import { deriveSurveyFromDom } from '@/lib/methodology/survey-markers'

// Live-state route: never serve a cached DOM/verdict (the recurring "card never updates" class).
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const BodySchema = z.object({
  url: z.string().url().optional(),
  deployment_id: z.string().nullable().optional(),
})

/** Bounded fetch — a hung build must not stall the survey. */
async function fetchText(url: string, ms = 8000): Promise<{ ok: boolean; text: string }> {
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

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } },
) {
  console.log('[SURVEY] ========== START ==========')
  try {
    const productSlug = params.productId.trim().toLowerCase()

    // Body is optional — an empty POST is valid (defaults to the conventional vercel URL).
    let body: unknown = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid survey payload', issues: parsed.error.issues },
        { status: 400 },
      )
    }

    const base = (parsed.data.url ?? `https://${productSlug}.vercel.app`).replace(/\/+$/, '')

    // 1. Route manifest (build-emitted) — SURVEY_MARKER_CONTRACT §4. Closes the page-coverage hole
    //    (the old harness hardcoded ["", "/reports", "/pricing"] — missed /partners, fetched a dead
    //    /pricing anchor). No manifest ⇒ fall back to ["/"] and warn (an under-covered build).
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

    // Map into the loader's evidence half (same shape the LLM path produced).
    const evidence: SurveyEvidence['evidence'] = {}
    for (const [field, ev] of Object.entries(derived.evidence)) {
      evidence[field as keyof SurveyEvidence['evidence']] = ev
    }

    console.log(
      '[SURVEY] slug:', productSlug,
      '· base:', base,
      '· manifest:', manifestOk ? routes.join(',') : 'NONE (fallback /)',
      '· evidenced:', derived.report.filter((r) => r.evidenced).length + '/14',
    )

    // 4. Score — loadCardSurvey + survey.ts are UNCHANGED.
    const card = await loadCardSurvey(productSlug, { evidence, preHard: derived.preHard })
    if (!card.found || !card.result) {
      return NextResponse.json({ error: 'Product validation row not found' }, { status: 404 })
    }

    const r = card.result
    const status: 'pass' | 'fail' = r.verdict === 'RENOVATION' ? 'pass' : 'fail'

    console.log(
      '[SURVEY] verdict:', r.verdict,
      '· evidenced:', `${r.site.evidencedCount}/${r.site.total}`,
      '· mvp ok:', r.mvp.ok,
      '· pre-hard:', r.preHard.passed,
    )

    await recordGate({
      slug: productSlug,
      gate: 'survey',
      status,
      deploymentId: parsed.data.deployment_id ?? null,
      artifactRef: r.mvp.url,
      reason: `${r.verdict} → ${r.nextStage} · evidenced ${r.site.evidencedCount}/${r.site.total} · PRE-HARD ${r.preHard.passed ? 'pass' : 'fail'}`,
      result: r,
    })

    console.log('[SURVEY] ========== END ==========')

    return NextResponse.json(
      {
        success: true,
        slug: productSlug,
        verdict: r.verdict,
        gate_status: status,
        result: r,
        survey: {
          base,
          manifest_ok: manifestOk,
          routes_fetched: routes,
          markers: derived.report, // per-field grep trace — legible, no model
          why_now_present: derived.whyNowPresent,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('[SURVEY] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}