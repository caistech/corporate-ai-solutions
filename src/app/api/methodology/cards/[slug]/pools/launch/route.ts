import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { deriveStreamSpec, type StreamSpec } from '@/lib/methodology/pool-discovery'

/**
 * POST /api/methodology/cards/[slug]/pools/launch  — Build #4 phase 3.
 *
 * Derives, per stream, an ICP description + interview questions from the card's AGREED pool
 * hypotheses (idea_card.distributor + idea_card.end_user_pool) — replacing the operator-typed ICP +
 * InvestorPilot's 180-char raw-query truncation. Then auto-creates BOTH streams by calling the
 * existing validate route (which keeps its Gate-1 HARD-gate guard, IP campaign + Connexions panel +
 * discovery kick-off intact — this route only FEEDS it the derived specs).
 *
 * Body: { dry_run?: boolean }. dry_run=true returns the derived specs WITHOUT firing — the
 * operator's confirm-or-edit preview (consequence: launching fires real outreach + API cost).
 *
 * Requires ANTHROPIC_API_KEY (derivation). The validate route guards its own InvestorPilot env.
 */

const BodySchema = z.object({ dry_run: z.boolean().optional() }).optional()

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY must be set on the server to derive stream specs' },
      { status: 503 }
    )
  }

  let body: { dry_run?: boolean } | undefined
  try {
    body = BodySchema.parse(await request.json().catch(() => ({})))
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const dryRun = body?.dry_run ?? false

  const supabase = supabaseAdmin()
  const { data: card, error: cardErr } = await supabase
    .from('methodology_hypothesis_cards')
    .select('idea_card')
    .eq('product_slug', params.slug)
    .maybeSingle()

  if (cardErr) {
    console.error('[pools/launch] card lookup failed:', cardErr)
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
          'Both pool hypotheses must be captured (and ideally assessed) before launching streams — fill the Distributor pool + End-user pool on the idea card first.',
        gate: 'pools-not-captured',
      },
      { status: 422 }
    )
  }

  // Derive both stream specs from the agreed pools.
  let specs: StreamSpec[]
  try {
    specs = await Promise.all([
      deriveStreamSpec('distributor', distributor),
      deriveStreamSpec('end-user', endUser),
    ])
  } catch (e) {
    console.error('[pools/launch] spec derivation failed:', e)
    return NextResponse.json({ error: `Stream-spec derivation failed: ${(e as Error).message}` }, { status: 502 })
  }

  // dry-run: return the derived specs for the operator to confirm/edit — fire nothing.
  if (dryRun) {
    return NextResponse.json({ dry_run: true, specs })
  }

  // Fire both streams through the existing validate route (it owns Gate-1 + IP + Connexions).
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://corporate-ai-solutions.vercel.app').replace(/\/$/, '')
  const results: Array<{ campaign_type: string; status: number; body: unknown }> = []
  for (const spec of specs) {
    try {
      const r = await fetch(`${appUrl}/api/methodology/cards/${params.slug}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_type: spec.campaign_type,
          icp_description: spec.icp_description,
          questions: spec.questions,
        }),
        signal: AbortSignal.timeout(60_000),
      })
      results.push({ campaign_type: spec.campaign_type, status: r.status, body: await r.json().catch(() => null) })
    } catch (e) {
      results.push({ campaign_type: spec.campaign_type, status: 0, body: { error: (e as Error).message } })
    }
  }

  const allOk = results.every((r) => r.status >= 200 && r.status < 300)
  return NextResponse.json({ launched: allOk, specs, results }, { status: allOk ? 201 : 207 })
}
