import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/methodology/cards/[slug]/validate
 *
 * Kicks off validation campaigns for a Hypothesis Card. Creates a campaign
 * on InvestorPilot via its methodology API + mirrors the campaign metadata
 * into CAS's methodology_campaigns table so sync webhooks can match.
 *
 * Body shape — one campaign per call (call twice to set up both
 * target-user + distributor-candidate):
 *   {
 *     campaign_type: 'target-user' | 'distributor-candidate',
 *     icp_description: '...',
 *     questions: ['...', '...'],
 *     expected_response_count?: 30,
 *     channel_mix?: ['linkedin', 'email']
 *   }
 *
 * Idempotent on (card_id, campaign_type) per the UNIQUE constraint —
 * re-posting updates the existing campaign rather than creating a duplicate.
 *
 * Requires env vars:
 *   INVESTORPILOT_BASE_URL  — e.g. https://investor-pilot-pi.vercel.app
 *   INVESTORPILOT_API_KEY   — shared bearer token (matches IP's METHODOLOGY_API_KEY)
 */

const ValidatePayloadSchema = z.object({
  campaign_type: z.enum(['target-user', 'distributor-candidate']),
  icp_description: z.string().min(10).max(2000),
  questions: z.array(z.string().min(1).max(1000)).min(1).max(20),
  expected_response_count: z.number().int().positive().max(500).optional(),
  channel_mix: z.array(z.enum(['linkedin', 'email'])).min(1).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const ipBase = process.env.INVESTORPILOT_BASE_URL
  const ipKey = process.env.INVESTORPILOT_API_KEY
  if (!ipBase || !ipKey) {
    return NextResponse.json(
      {
        error:
          'INVESTORPILOT_BASE_URL and INVESTORPILOT_API_KEY must be set on the server to create campaigns',
      },
      { status: 503 }
    )
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = ValidatePayloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const supabase = supabaseAdmin()

  // 1. Find the parent Hypothesis Card by slug
  const { data: card, error: cardErr } = await supabase
    .from('methodology_hypothesis_cards')
    .select('id, product_slug')
    .eq('product_slug', params.slug)
    .maybeSingle()

  if (cardErr) {
    console.error('card lookup failed:', cardErr)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
  if (!card) {
    return NextResponse.json({ error: 'Hypothesis Card not found' }, { status: 404 })
  }

  // 2. Create the campaign on InvestorPilot
  const ipPayload = {
    cas_product_slug: params.slug,
    cas_card_id: card.id,
    campaign_type: parsed.data.campaign_type,
    icp_description: parsed.data.icp_description,
    questions: parsed.data.questions,
    expected_response_count: parsed.data.expected_response_count ?? 30,
    channel_mix: parsed.data.channel_mix ?? ['linkedin', 'email'],
  }

  let ipResponse
  try {
    const r = await fetch(`${ipBase}/api/methodology/campaigns`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ipKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ipPayload),
      signal: AbortSignal.timeout(20_000),
    })
    if (!r.ok) {
      const text = await r.text()
      return NextResponse.json(
        { error: `InvestorPilot rejected campaign (HTTP ${r.status}): ${text.slice(0, 300)}` },
        { status: 502 }
      )
    }
    ipResponse = (await r.json()) as { campaign?: { id?: string } }
  } catch (e) {
    console.error('InvestorPilot fetch failed:', e)
    return NextResponse.json(
      { error: `InvestorPilot call failed: ${(e as Error).message}` },
      { status: 502 }
    )
  }

  const ipCampaignId = ipResponse?.campaign?.id
  if (!ipCampaignId) {
    return NextResponse.json(
      { error: 'InvestorPilot returned no campaign id' },
      { status: 502 }
    )
  }

  // 3. Mirror into CAS methodology_campaigns (upsert on UNIQUE (card_id, campaign_type))
  const { data: casCampaign, error: insertErr } = await supabase
    .from('methodology_campaigns')
    .upsert(
      {
        card_id: card.id,
        campaign_type: parsed.data.campaign_type,
        ip_campaign_id: ipCampaignId,
        icp_description: parsed.data.icp_description,
        questions: parsed.data.questions,
        expected_response_count: parsed.data.expected_response_count ?? 30,
        status: 'configured',
      },
      { onConflict: 'card_id,campaign_type' }
    )
    .select()
    .single()

  if (insertErr) {
    console.error('CAS methodology_campaigns upsert failed:', insertErr)
    return NextResponse.json(
      {
        error: 'Campaign created on InvestorPilot but mirror to CAS failed',
        ip_campaign_id: ipCampaignId,
      },
      { status: 500 }
    )
  }

  // Also bump card status from 'dialogue-complete' to 'validation-in-flight'
  await supabase
    .from('methodology_hypothesis_cards')
    .update({ status: 'validation-in-flight' })
    .eq('id', card.id)
    .eq('status', 'dialogue-complete') // only flip from dialogue-complete; don't override later states

  return NextResponse.json({ campaign: casCampaign }, { status: 201 })
}
