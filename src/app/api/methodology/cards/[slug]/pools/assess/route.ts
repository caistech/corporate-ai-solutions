import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { assessBothPools, summariseAssessment } from '@/lib/methodology/pool-discovery'

/**
 * POST /api/methodology/cards/[slug]/pools/assess  — Build #4 phase 2.
 *
 * Evidence-checks the card's two pool hypotheses (idea_card.distributor + idea_card.end_user_pool):
 * gathers web evidence (Brave) that each is a real, reachable population, then has an LLM ASSESS it
 * (real-reachable / weak / reject) and PROPOSE a better-fit pool when weak/reject. The operator drives
 * the back-and-forth: accept a proposal by PATCHing the pool field, then re-run assess.
 *
 * Persists a compact verdict summary onto idea_card.pool_evidence so the reasoning is auditable.
 * Requires BRAVE_API_KEY + ANTHROPIC_API_KEY on the server.
 *
 * Same posture as the sibling validate/cards routes (called from the gated /admin cockpit UI).
 */
export async function POST(_request: NextRequest, { params }: { params: { slug: string } }) {
  if (!process.env.BRAVE_API_KEY || !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'BRAVE_API_KEY and ANTHROPIC_API_KEY must be set on the server to assess pools' },
      { status: 503 }
    )
  }

  const supabase = supabaseAdmin()

  const { data: card, error: cardErr } = await supabase
    .from('methodology_hypothesis_cards')
    .select('id, idea_card')
    .eq('product_slug', params.slug)
    .maybeSingle()

  if (cardErr) {
    console.error('[pools/assess] card lookup failed:', cardErr)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
  if (!card) {
    return NextResponse.json({ error: 'Hypothesis Card not found' }, { status: 404 })
  }

  const ideaCard = (card.idea_card ?? {}) as Record<string, string>
  const distributor = (ideaCard.distributor ?? '').trim()
  const endUser = (ideaCard.end_user_pool ?? '').trim()
  if (distributor.length < 12 || endUser.length < 12) {
    return NextResponse.json(
      {
        error:
          'Both pool hypotheses must be captured before assessment — run the office-hours pool-discovery dialogue to fill the Distributor pool + End-user pool on the idea card first.',
        gate: 'pools-not-captured',
        has_distributor: distributor.length >= 12,
        has_end_user: endUser.length >= 12,
      },
      { status: 422 }
    )
  }

  let assessments
  try {
    assessments = await assessBothPools({ distributor, endUser })
  } catch (e) {
    console.error('[pools/assess] assessment failed:', e)
    return NextResponse.json({ error: `Pool assessment failed: ${(e as Error).message}` }, { status: 502 })
  }

  // Persist a compact, auditable summary onto the card (idea_card values are strings; cap to fit).
  const summary = [summariseAssessment(assessments.distributor), summariseAssessment(assessments.endUser)]
    .join('\n')
    .slice(0, 8000)
  const { error: updErr } = await supabase
    .from('methodology_hypothesis_cards')
    .update({ idea_card: { ...ideaCard, pool_evidence: summary } })
    .eq('id', card.id)
  if (updErr) {
    console.warn('[pools/assess] failed to persist pool_evidence (returning assessment anyway):', updErr)
  }

  // Surface whether either pool needs sharpening (an operator decision before launch).
  const needsWork = [assessments.distributor, assessments.endUser].filter((a) => a.verdict !== 'real-reachable')

  return NextResponse.json({
    assessments,
    both_real_reachable: needsWork.length === 0,
    needs_sharpening: needsWork.map((a) => ({ kind: a.kind, verdict: a.verdict, proposed_pool: a.proposed_pool })),
  })
}
