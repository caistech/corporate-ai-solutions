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
    .select('id, product_slug, mvp_ready, mvp_url')
    .eq('product_slug', params.slug)
    .maybeSingle()

  if (cardErr) {
    console.error('card lookup failed:', cardErr)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
  if (!card) {
    return NextResponse.json({ error: 'Hypothesis Card not found' }, { status: 404 })
  }

  // Gate 1 — "is the thin MVP ready?". The research outreach embeds the MVP
  // link, so kick-off is blocked until the card is mvp_ready with an mvp_url.
  // No MVP, no link, no send.
  if (!card.mvp_ready || !card.mvp_url) {
    return NextResponse.json(
      {
        error:
          'Gate 1 not met: the thin MVP is not ready. Set an mvp_url and mark the card mvp_ready before kicking off research — the outreach embeds the MVP link.',
        gate: 'mvp-ready',
        mvp_ready: card.mvp_ready ?? false,
        has_mvp_url: Boolean(card.mvp_url),
      },
      { status: 412 }
    )
  }

  // ip_org_id: the IP organisation that hosts the research prospects + where the
  // operator approves outreach (Option A — the canonical CAS org in IP). Override
  // via INVESTORPILOT_METHODOLOGY_ORG_ID; falls back to the known canonical org id
  // (a non-secret identifier, not a credential).
  const ipOrgId =
    process.env.INVESTORPILOT_METHODOLOGY_ORG_ID || '13127cee-a2ae-4ee4-b957-76e94ceab2be'

  // 2. Create the campaign on InvestorPilot
  const ipPayload = {
    cas_product_slug: params.slug,
    cas_card_id: card.id,
    campaign_type: parsed.data.campaign_type,
    icp_description: parsed.data.icp_description,
    questions: parsed.data.questions,
    expected_response_count: parsed.data.expected_response_count ?? 30,
    channel_mix: parsed.data.channel_mix ?? ['linkedin', 'email'],
    // Gate-1 payload: the thin-MVP link the outreach embeds for both streams.
    mvp_url: card.mvp_url,
    // Option A: research prospects live in the canonical CAS org in IP, where the
    // operator reviews + approves the drafted invites.
    ip_org_id: ipOrgId,
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

  // 4. Create the Connexions panel (voice intake) for this campaign + mirror
  //    the URL onto the CAS campaign row. Connexions does the structured-Q&A
  //    extraction on its side; CAS sync ingests the analysed payload.
  //    Soft failure — the panel is the validation rail, but if Connexions is
  //    unavailable we still return the campaign so the operator can retry.
  const connexionsBase = process.env.CONNEXIONS_BASE_URL
  const connexionsSecret = process.env.CAS_METHODOLOGY_WEBHOOK_SECRET
  let connexionsPanelSlug: string | null = null
  let connexionsPanelUrl: string | null = null
  let connexionsWarn: string | null = null

  if (!connexionsBase) {
    connexionsWarn = 'CONNEXIONS_BASE_URL not set; panel creation skipped'
  } else if (!connexionsSecret) {
    connexionsWarn = 'CAS_METHODOLOGY_WEBHOOK_SECRET not set; panel creation skipped (without secret, inbound webhook auth fails)'
  } else {
    try {
      const cxPayload = {
        cas_card_id: card.id,
        cas_product_slug: params.slug,
        ip_campaign_id: ipCampaignId,
        campaign_type: parsed.data.campaign_type,
        icp_description: parsed.data.icp_description,
        questions: parsed.data.questions,
        mvp_url: card.mvp_url,
        sync_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://corporate-ai-solutions.vercel.app'}/api/methodology/sync`,
        sync_secret: connexionsSecret,
      }
      const cxRes = await fetch(`${connexionsBase}/api/methodology/panels`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ipKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cxPayload),
        signal: AbortSignal.timeout(30_000),
      })
      if (!cxRes.ok) {
        const text = await cxRes.text()
        connexionsWarn = `Connexions panel create returned ${cxRes.status}: ${text.slice(0, 300)}`
        console.warn('[validate]', connexionsWarn)
      } else {
        const cxJson = (await cxRes.json()) as {
          panel?: { slug?: string; public_url?: string }
        }
        connexionsPanelSlug = cxJson.panel?.slug ?? null
        const path = cxJson.panel?.public_url ?? (connexionsPanelSlug ? `/p/${connexionsPanelSlug}` : null)
        if (path) {
          connexionsPanelUrl = path.startsWith('http') ? path : `${connexionsBase}${path}`
        }

        if (connexionsPanelUrl) {
          await supabase
            .from('methodology_campaigns')
            .update({
              connexions_panel_slug: connexionsPanelSlug,
              connexions_panel_url: connexionsPanelUrl,
            })
            .eq('id', casCampaign.id)
        }
      }
    } catch (e) {
      connexionsWarn = `Connexions panel create failed: ${(e as Error).message}`
      console.warn('[validate]', connexionsWarn)
    }
  }

  // 4b. Gate-1 kick-off → discovery + drafting on InvestorPilot. Only once we
  //     have a Connexions interview URL to embed in the invite. IP's activate
  //     returns 202 fast (discovery + drafting run in IP's background via
  //     waitUntil), so this doesn't block validate. Soft-fail: a kick-off hiccup
  //     shouldn't fail the whole validate — the operator can re-trigger.
  let activateWarn: string | null = null
  if (connexionsPanelUrl) {
    try {
      const aRes = await fetch(
        `${ipBase}/api/methodology/campaigns/${ipCampaignId}/activate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${ipKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            connexions_interview_url: connexionsPanelUrl,
            mvp_url: card.mvp_url,
          }),
          signal: AbortSignal.timeout(20_000),
        }
      )
      if (!aRes.ok) {
        activateWarn = `IP activate returned ${aRes.status}: ${(await aRes.text()).slice(0, 200)}`
        console.warn('[validate]', activateWarn)
      } else {
        // Mark the CAS campaign as sourcing — IP is now discovering + drafting.
        await supabase
          .from('methodology_campaigns')
          .update({ status: 'sourcing' })
          .eq('id', casCampaign.id)
      }
    } catch (e) {
      activateWarn = `IP activate call failed: ${(e as Error).message}`
      console.warn('[validate]', activateWarn)
    }
  } else {
    activateWarn =
      'No Connexions panel URL — discovery not kicked off (campaign + panel only). Re-run validate once the panel exists.'
  }

  // 5. Bump card status from 'dialogue-complete' to 'validation-in-flight'
  await supabase
    .from('methodology_hypothesis_cards')
    .update({ status: 'validation-in-flight' })
    .eq('id', card.id)
    .eq('status', 'dialogue-complete') // only flip from dialogue-complete; don't override later states

  return NextResponse.json(
    {
      campaign: {
        ...casCampaign,
        connexions_panel_slug: connexionsPanelSlug,
        connexions_panel_url: connexionsPanelUrl,
      },
      ...(connexionsWarn ? { connexions_warning: connexionsWarn } : {}),
      ...(activateWarn ? { activate_warning: activateWarn } : {}),
    },
    { status: 201 }
  )
}
