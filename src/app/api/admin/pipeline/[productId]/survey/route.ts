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
import { deriveFieldsFromLiveUrl } from '@/lib/methodology/live-derive'
import { upsertReadinessResult } from '@/lib/methodology/readiness-results'

// Live-state route: never serve a cached DOM/verdict (the recurring "card never updates" class).
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const BodySchema = z.object({
  url: z.string().url().optional(),
  deployment_id: z.string().nullable().optional(),
})

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

    // Fetch manifest + DOMs and grep the markers via the ONE shared helper (Rider 3) — the same
    // path the gate's server-side re-derive and the coach's pre-gate intake use, so they can't
    // drift on what the build emits. No model, no judgement: same DOM ⇒ same evidence/preHard.
    const derived = await deriveFieldsFromLiveUrl(base)

    // Map into the loader's evidence half (same shape the LLM path produced).
    const evidence: SurveyEvidence['evidence'] = {}
    for (const [field, ev] of Object.entries(derived.evidence)) {
      evidence[field as keyof SurveyEvidence['evidence']] = ev
    }

    console.log(
      '[SURVEY] slug:', productSlug,
      '· base:', derived.base,
      '· manifest:', derived.manifestOk ? derived.routesFetched.join(',') : 'NONE (fallback /)',
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

    // Tier-1: Persist survey verdicts to readiness_results
    const deploymentId = parsed.data.deployment_id ?? null
    
    // P1: Survey ran (always pass/fail when survey runs)
    await upsertReadinessResult({
      productSlug,
      checkCode: 'P1',
      status: status, // pass if RENOVATION, fail otherwise
      source: 'auto',
      evidence: `evidenced ${r.site.evidencedCount}/${r.site.total}`,
      deploymentId,
    })

    // P2: Named distributor archetype (from survey gate)
    const p2Status = r.preHard.passed ? 'pass' : 'fail'
    await upsertReadinessResult({
      productSlug,
      checkCode: 'P2',
      status: p2Status,
      source: 'judge',
      evidence: r.preHard.passed ? 'Named distributor found' : 'No named distributor archetype',
      deploymentId,
    })

    // P3: Gate questions answered (survey ran and produced verdict)
    const p3Status = r.verdict === 'RENOVATION' ? 'pass' : 'fail'
    await upsertReadinessResult({
      productSlug,
      checkCode: 'P3',
      status: p3Status,
      source: 'judge',
      evidence: `Survey verdict: ${r.verdict}`,
      deploymentId,
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
          base: derived.base,
          manifest_ok: derived.manifestOk,
          routes_fetched: derived.routesFetched,
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