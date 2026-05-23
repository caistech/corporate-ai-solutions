import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'node:crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { classifyResponse } from '@/lib/methodology/classify'
import { rollupHypothesisRows } from '@/lib/methodology/rollup'

/**
 * POST /api/methodology/sync
 *
 * Webhook target from InvestorPilot (Session 3 wiring) — also accepts manual
 * mock posts in dev for testing the classification loop without real outreach.
 *
 * Auth:
 *   - If CAS_METHODOLOGY_WEBHOOK_SECRET is set: requires HMAC-SHA256 in
 *     X-Methodology-Signature header (hex-encoded; computed over raw body).
 *   - If env var unset: dev mode — accepts any payload (logs a warning).
 *
 * Body shape (per response):
 *   {
 *     ip_campaign_id: "uuid",         // IP-side campaign ID
 *     ip_partner_id?: "string",       // optional IP-side prospect ID
 *     prospect_name?: "string",
 *     prospect_role?: "string",
 *     prospect_org?: "string",
 *     response_received_at?: "iso8601",
 *     response_raw_text: "string",
 *     response_channel?: "linkedin" | "email"
 *   }
 *
 * Flow:
 *   1. Find the CAS methodology_campaigns row matching ip_campaign_id
 *   2. Load its parent Hypothesis Card + questions
 *   3. LLM-classify the response against the questions + hypothesis rows
 *   4. Upsert methodology_responses (idempotent on (campaign_id, ip_partner_id))
 *   5. Reload all responses for this campaign + roll up the card's hypothesis_rows
 *   6. Persist updated card
 *   7. Return summary
 */

const SyncPayloadSchema = z.object({
  ip_campaign_id: z.string().uuid(),
  ip_partner_id: z.string().max(200).optional(),
  prospect_name: z.string().max(300).optional(),
  prospect_role: z.string().max(300).optional(),
  prospect_org: z.string().max(300).optional(),
  response_received_at: z.string().datetime().optional(),
  response_raw_text: z.string().min(1).max(20000),
  response_channel: z.enum(['linkedin', 'email']).optional(),
})

function verifySignature(rawBody: string, headerSig: string | null, secret: string): boolean {
  if (!headerSig) return false
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  // constant-time compare
  if (headerSig.length !== expected.length) return false
  return crypto.timingSafeEqual(Buffer.from(headerSig), Buffer.from(expected))
}

export async function POST(request: NextRequest) {
  // Read raw body once (need it both for HMAC verification + JSON parse)
  let rawBody: string
  try {
    rawBody = await request.text()
  } catch {
    return NextResponse.json({ error: 'Could not read request body' }, { status: 400 })
  }

  const webhookSecret = process.env.CAS_METHODOLOGY_WEBHOOK_SECRET
  if (webhookSecret) {
    const sig = request.headers.get('x-methodology-signature')
    if (!verifySignature(rawBody, sig, webhookSecret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  } else {
    console.warn(
      '[/api/methodology/sync] CAS_METHODOLOGY_WEBHOOK_SECRET not set — accepting unsigned payload (dev mode)'
    )
  }

  let parsedBody: unknown
  try {
    parsedBody = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = SyncPayloadSchema.safeParse(parsedBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const supabase = supabaseAdmin()

  // 1. Find the CAS campaign row for this IP campaign id
  const { data: campaign, error: campaignErr } = await supabase
    .from('methodology_campaigns')
    .select('id, card_id, questions')
    .eq('ip_campaign_id', parsed.data.ip_campaign_id)
    .maybeSingle()

  if (campaignErr) {
    console.error('[/api/methodology/sync] campaign lookup failed:', campaignErr)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (!campaign) {
    return NextResponse.json(
      { error: `No CAS campaign mirrored for ip_campaign_id ${parsed.data.ip_campaign_id}` },
      { status: 404 }
    )
  }

  // 2. Load the parent Hypothesis Card
  const { data: card, error: cardErr } = await supabase
    .from('methodology_hypothesis_cards')
    .select('id, product_slug, hypothesis_rows')
    .eq('id', campaign.card_id)
    .maybeSingle()

  if (cardErr || !card) {
    console.error('[/api/methodology/sync] card lookup failed:', cardErr)
    return NextResponse.json({ error: 'Parent card not found' }, { status: 500 })
  }

  const questions = Array.isArray(campaign.questions) ? (campaign.questions as string[]) : []
  const hypothesisRows = Array.isArray(card.hypothesis_rows)
    ? (card.hypothesis_rows as Array<{ field: string; hypothesis_text: string; [k: string]: unknown }>)
    : []

  // 3. Classify
  let classification
  try {
    classification = await classifyResponse({
      response_text: parsed.data.response_raw_text,
      questions,
      hypothesis_rows: hypothesisRows,
    })
  } catch (e) {
    console.error('[/api/methodology/sync] classification failed:', e)
    // Persist the raw response anyway — classification is best-effort
    classification = null
  }

  // 4. Upsert response (idempotent on (campaign_id, ip_partner_id) when partner id present)
  const responseRow = {
    campaign_id: campaign.id,
    ip_partner_id: parsed.data.ip_partner_id ?? null,
    prospect_name: parsed.data.prospect_name ?? null,
    prospect_role: parsed.data.prospect_role ?? null,
    prospect_org: parsed.data.prospect_org ?? null,
    response_received_at: parsed.data.response_received_at ?? new Date().toISOString(),
    response_raw_text: parsed.data.response_raw_text,
    response_channel: parsed.data.response_channel ?? null,
    classification: classification?.overall_classification ?? null,
    classification_reasoning: classification?.reasoning ?? null,
    per_question_signal: classification?.per_question_signal ?? null,
    classified_at: classification ? new Date().toISOString() : null,
  }

  const { data: insertedResponse, error: insertErr } = await supabase
    .from('methodology_responses')
    .insert(responseRow)
    .select('id')
    .single()

  if (insertErr) {
    console.error('[/api/methodology/sync] response insert failed:', insertErr)
    return NextResponse.json({ error: 'Failed to persist response' }, { status: 500 })
  }

  // 5. Reload all responses for this campaign + roll up
  const { data: allResponses, error: respFetchErr } = await supabase
    .from('methodology_responses')
    .select('per_question_signal')
    .eq('campaign_id', campaign.id)

  if (respFetchErr) {
    console.error('[/api/methodology/sync] response refetch failed:', respFetchErr)
    return NextResponse.json(
      { response_id: insertedResponse.id, rollup: 'skipped', error: 'refetch failed' },
      { status: 200 }
    )
  }

  const updatedRows = rollupHypothesisRows(
    hypothesisRows,
    (allResponses ?? []) as Array<{ per_question_signal: Record<string, never> | null }>
  )

  // 6. Persist updated card
  const cardStatus = updatedRows.every((r) => r.validation_status === 'confirmed' ||
                                              r.validation_status === 'contradicted' ||
                                              r.validation_status === 'refined')
    ? 'validated'
    : 'validation-in-flight'

  const { error: cardUpdateErr } = await supabase
    .from('methodology_hypothesis_cards')
    .update({ hypothesis_rows: updatedRows, status: cardStatus })
    .eq('id', card.id)

  if (cardUpdateErr) {
    console.error('[/api/methodology/sync] card update failed:', cardUpdateErr)
  }

  return NextResponse.json(
    {
      response_id: insertedResponse.id,
      classification: classification?.overall_classification ?? null,
      card_status: cardStatus,
      rolled_up_rows: updatedRows.length,
    },
    { status: 201 }
  )
}
