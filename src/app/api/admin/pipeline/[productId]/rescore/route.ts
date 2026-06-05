/**
 * POST /api/admin/pipeline/[productId]/rescore — the post-fix RE-SCORE TRIGGER (keystone).
 *
 * Manually invoked for now (no ECC relay, no /loop) so we can prove the score moves on
 * one real fix before automating. It orchestrates the HEADLESS verdict producer(s) to
 * re-run against the product's live URL and rewrite readiness_results, so loadCardScore
 * reflects the post-fix state — then returns the recomputed score + a per-check freshness
 * view (which checks are current vs stale-and-pending an agent).
 *
 * Body: { deploymentId: string }  (productId comes from the path.)
 *
 * WHAT IT RE-RUNS — only HEADLESS producers (server re-runs them against the live URL
 * with no agent/browser):
 *   - the SURVEY producer (the existing /survey route): writes P1 (auto) + P2/P3
 *     (deterministic data-* DOM grep, survey-markers.ts). This is the producer that moves
 *     the HARD gate — e.g. deal-findrs' P2 reseller-banlist failure — because the markers
 *     are read by a plain server-side fetch of the deployed HTML, not a browser.
 *
 * WHAT IT DOES NOT RE-RUN — AGENT-REQUIRED producers (need a Claude Code skill walking the
 * URL): naive-tester (validation-test is an INGEST route) and voice-auditor. Their verdicts
 * are left in place and surface as STALE in the freshness view until an agent re-runs them.
 * (run-test's auto checks are headless too but own only DEFER code 8 and don't yet thread
 * deployment_id — a follow-up, not a gate mover.)
 *
 * CONTRACT: the trigger ORCHESTRATES; the producer WRITES verdicts via its own
 * upsertReadinessResult seam (we never hard-code a slash-command call or write
 * readiness_results directly here). The seam stays at readiness_results.
 *
 * DEPLOY TIMING: the producer tests the LIVE url, so the post-fix deploy must be live
 * first. deploymentId is REQUIRED input (the caller supplies the deploy the verdicts bind
 * to); we never guess it.
 *
 * IDEMPOTENT per (productId, deploymentId): upsertReadinessResult is delete-then-insert per
 * check, so re-invoking for the same deploy rewrites the same verdicts (fresh scored_at) —
 * never duplicates.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadCardScore } from '@/lib/methodology/readiness'
import { loadCardFreshness } from '@/lib/methodology/freshness'

// Live-state route: never serve a cached verdict/score.
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } },
) {
  console.log('[RESCORE] ========== START ==========')
  try {
    const productSlug = params.productId.trim().toLowerCase()

    let body: { deploymentId?: string } = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }
    const deploymentId = (body.deploymentId ?? '').trim()
    if (!deploymentId) {
      return NextResponse.json(
        {
          error:
            'deploymentId required — supply the post-fix deployment the verdicts should bind to. The producers test the LIVE url, so the new deploy must be live first.',
        },
        { status: 400 },
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: product } = await supabase
      .from('product_validation_status')
      .select('product_slug, mvp_url')
      .eq('product_slug', productSlug)
      .maybeSingle()

    if (!product) {
      return NextResponse.json(
        { error: `No product_validation_status row for "${productSlug}"` },
        { status: 404 },
      )
    }
    const mvpUrl = (product.mvp_url as string | null)?.trim() || null
    if (!mvpUrl) {
      return NextResponse.json(
        { error: 'no live URL (mvp_url) to re-score against — capture it (review intake) first' },
        { status: 422 },
      )
    }

    // --- Orchestrate the HEADLESS survey producer against the live URL, binding to ---
    // --- the supplied deploy. It writes P1/P2/P3 via its own upsertReadinessResult.  ---
    // /api/admin/* is not middleware-gated (matcher: /pipeline, /admin, /api/methodology),
    // so this server-to-server call needs no session cookie.
    const origin = request.nextUrl.origin
    const ranProducers: string[] = []
    let surveyVerdict: string | null = null

    const surveyRes = await fetch(
      `${origin}/api/admin/pipeline/${encodeURIComponent(productSlug)}/survey`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: mvpUrl, deployment_id: deploymentId }),
      },
    )
    const surveyJson = await surveyRes.json().catch(() => ({}))
    if (!surveyRes.ok) {
      return NextResponse.json(
        {
          error: 'survey producer failed',
          producer: 'survey',
          status: surveyRes.status,
          detail: (surveyJson as { error?: string })?.error ?? null,
        },
        { status: 502 },
      )
    }
    ranProducers.push('survey')
    surveyVerdict = (surveyJson as { verdict?: string })?.verdict ?? null

    // --- Recompute (compute-on-read) + freshness against the deploy we just scored. ---
    const [card, freshness] = await Promise.all([
      loadCardScore(productSlug),
      loadCardFreshness(productSlug, deploymentId),
    ])

    console.log(
      '[RESCORE] slug:', productSlug,
      '· deploy:', deploymentId,
      '· surveyVerdict:', surveyVerdict,
      '· score:', card.score?.score ?? null,
      '· band:', card.score?.band ?? null,
      '· hardGate:', card.score?.hardGate.passed ?? null,
      '· stale:', freshness.summary.stale,
    )
    console.log('[RESCORE] ========== END ==========')

    return NextResponse.json({
      success: true,
      slug: productSlug,
      deploymentId,
      ranProducers, // headless producers re-run this pass
      surveyVerdict,
      score: card.score?.score ?? null,
      band: card.score?.band ?? null,
      hardGatePassed: card.score?.hardGate.passed ?? null,
      toReachGo: card.score?.toReachGo ?? [],
      freshness, // per-check current | stale | missing | unknown (stale = pending an agent re-run)
    })
  } catch (error) {
    console.error('[RESCORE] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
