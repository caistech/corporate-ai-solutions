/**
 * POST /api/admin/pipeline/[productId]/agent-ready — the #42 AGENT-DISCOVERABLE producer.
 *
 * Probes the product's LIVE public surface for the three Layer-1 markers (/llms.txt, JSON-LD,
 * /.well-known/ manifest), promotes the card to `public-web` if any marker is found (so #42 is
 * scored), writes the #42 verdict via the readiness seam, and returns the recomputed score.
 *
 * Body: { deploymentId?: string }  (optional — binds the verdict to a deploy for freshness;
 *        productId/slug comes from the path.)
 *
 * Mirrors the rescore route's contract: this route ORCHESTRATES; the producer
 * (runAgentReadinessProducer) WRITES verdicts via upsertReadinessResult / mutates features via
 * addFeatures. It tests the LIVE url, so the deploy under test must be live first.
 *
 * This is the headless HTTP producer. A future browser-driven /agent-ready live pass plugs into
 * the same seam at a higher precedence (see agent-ready-probe.ts).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadCardScore } from '@/lib/methodology/readiness'
import { runAgentReadinessProducer } from '@/lib/methodology/agent-ready-probe'

// Live-state route: never serve a cached verdict/score.
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } },
) {
  console.log('[AGENT-READY] ========== START ==========')
  try {
    const productSlug = params.productId.trim().toLowerCase()

    let body: { deploymentId?: string } = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }
    const deploymentId = (body.deploymentId ?? '').trim() || null

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
        { error: 'no live URL (mvp_url) to probe — capture it (review intake) first' },
        { status: 422 },
      )
    }

    // --- Run the #42 producer against the live URL. It promotes the card + writes the verdict ---
    // --- via its own seam; an unreachable surface records nothing (degrade-don't-fake).        ---
    const result = await runAgentReadinessProducer(supabase, productSlug, mvpUrl, deploymentId)

    // Recompute (compute-on-read) so the caller sees the effect of the verdict / promotion.
    const card = await loadCardScore(productSlug)

    console.log(
      '[AGENT-READY] slug:', productSlug,
      '· applicable:', result.applicable,
      '· promoted:', result.promoted,
      '· verdict:', result.status,
      '· markers:', result.evidence,
      '· score:', card.score?.score ?? null,
    )
    console.log('[AGENT-READY] ========== END ==========')

    return NextResponse.json({
      success: true,
      slug: productSlug,
      deploymentId,
      checkCode: '42',
      applicable: result.applicable,
      promoted: result.promoted, // true when this run first tagged the card public-web
      verdict: result.status, // 'pass' | 'fail' | null (null = not applicable / unreachable)
      markers: result.markers,
      evidence: result.evidence,
      unreachable: result.unreachable,
      score: card.score?.score ?? null,
      band: card.score?.band ?? null,
      hardGatePassed: card.score?.hardGate.passed ?? null,
    })
  } catch (error) {
    console.error('[AGENT-READY] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
