import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'node:crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { classifyResponse, type ClassificationSignal } from '@/lib/methodology/classify'
import { rollupHypothesisRows } from '@/lib/methodology/rollup'

/**
 * POST /api/methodology/sync
 *
 * Webhook target accepting TWO payload shapes:
 *
 *   1. Mock / channel-direct shape (Session 2; also useable as a debug
 *      injection path). Carries raw response text; CAS classifies it.
 *   2. Connexions methodology-intake shape (Session 3). Carries the
 *      transcript + Connexions' per-question signal extraction (when
 *      Anthropic succeeded on the Connexions side); CAS persists the
 *      extraction directly and falls back to its own classifier only
 *      if extraction is null.
 *
 * Auth (both shapes):
 *   - If CAS_METHODOLOGY_WEBHOOK_SECRET is set: requires HMAC-SHA256 in
 *     X-Methodology-Signature header (hex with optional 'sha256=' prefix).
 *   - If unset: dev mode — accepts unsigned (logs a warning).
 *
 * Discriminator: presence of `event === 'methodology.intake.completed'`
 * routes the request through the Connexions path. Otherwise the mock path.
 */

// ─── Schemas ─────────────────────────────────────────────────────────

const MockPayloadSchema = z.object({
  ip_campaign_id: z.string().uuid(),
  ip_partner_id: z.string().max(200).optional(),
  prospect_name: z.string().max(300).optional(),
  prospect_role: z.string().max(300).optional(),
  prospect_org: z.string().max(300).optional(),
  response_received_at: z.string().datetime().optional(),
  response_raw_text: z.string().min(1).max(20_000),
  response_channel: z.enum(['linkedin', 'email']).optional(),
})

const SignalEnum = z.enum([
  'confirms',
  'contradicts',
  'refines',
  'off-topic',
  'wants-more-info',
])

const ConnexionsPayloadSchema = z.object({
  event: z.literal('methodology.intake.completed'),
  intake_id: z.string(),
  connexions_agent_slug: z.string().optional(),
  cas_card_id: z.string().uuid().optional(),
  cas_product_slug: z.string().optional(),
  ip_campaign_id: z.string().uuid(),
  campaign_type: z.enum(['target-user', 'distributor-candidate']).optional(),
  completed_at: z.string().optional(),
  duration_seconds: z.number().nullable().optional(),
  ref: z.string().nullable().optional(),
  src: z.string().nullable().optional(),
  prospect: z
    .object({
      name: z.string().nullable().optional(),
      email: z.string().nullable().optional(),
      company: z.string().nullable().optional(),
      role: z.string().nullable().optional(),
      linkedin_url: z.string().nullable().optional(),
    })
    .optional(),
  questions: z.array(z.string()).optional(),
  // Optional — Connexions today doesn't always capture transcripts (the
  // ElevenLabs webhook handler is a no-op pending Session 3.5). When empty,
  // we still persist the response row with prospect info but skip
  // classification.
  transcript_excerpt: z.string().max(20_000).optional(),
  extraction: z
    .object({
      per_question_signal: z.record(z.string(), SignalEnum),
      overall_classification: SignalEnum,
      summary: z.string(),
    })
    .nullable()
    .optional(),
})

// ─── HMAC ────────────────────────────────────────────────────────────

function verifySignature(rawBody: string, headerSig: string | null, secret: string): boolean {
  if (!headerSig) return false
  // Accept both `sha256=<hex>` (Connexions / GitHub convention) and raw hex.
  const sigHex = headerSig.startsWith('sha256=') ? headerSig.slice(7) : headerSig
  const expectedHex = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  if (sigHex.length !== expectedHex.length) return false
  return crypto.timingSafeEqual(Buffer.from(sigHex), Buffer.from(expectedHex))
}

// ─── InvestorPilot relay ─────────────────────────────────────────────
//
// After CAS records a Connexions interview's evidence, mark the matching
// InvestorPilot partner as interviewed by forwarding the intake to IP's
// existing receiver (POST /api/webhooks/connexions-intake). This replaces
// the retired legacy Connexions→IP direct feed: CAS becomes a second
// authorized caller on the SAME contract (HMAC-SHA256 of the body with the
// shared CONNEXIONS_INTAKE_WEBHOOK_SECRET, X-Connexions-Signature header).
// IP dedups on external_intake_id = intake_id, so during the cutover window
// both the legacy forwarder and this relay can fire for one interview with
// no double-count.
//
// Non-blocking by contract: this function never throws — every failure is
// caught and logged so the /sync 201 is never affected by relay outcome.
async function relayInterviewedToInvestorPilot(
  data: z.infer<typeof ConnexionsPayloadSchema>
): Promise<void> {
  const url = process.env.INVESTORPILOT_INTAKE_WEBHOOK_URL
  const secret = process.env.CONNEXIONS_INTAKE_WEBHOOK_SECRET
  if (!url || !secret) {
    console.log(
      '[/api/methodology/sync] IP relay skipped: env missing (INVESTORPILOT_INTAKE_WEBHOOK_URL / CONNEXIONS_INTAKE_WEBHOOK_SECRET)'
    )
    return
  }

  const prospect = data.prospect ?? {}
  // Map the Connexions methodology payload → IP's IntakePayload. Keep
  // intake_id identical (it is IP's dedup key) and pass ref through (the IP
  // partner UUID IP resolves the partner from). answers stays [] in v1 to
  // match the legacy feed.
  const body = JSON.stringify({
    intake_id: data.intake_id,
    ref: data.ref ?? null,
    src: data.src ?? null,
    intake_slug: data.cas_product_slug ?? null,
    completed_at: data.completed_at ?? null,
    prospect: {
      name: prospect.name ?? null,
      email: prospect.email ?? null,
      company: prospect.company ?? null,
      linkedin_url: prospect.linkedin_url ?? null,
    },
    summary: data.extraction?.summary ?? null,
    answers: [],
    duration_seconds: data.duration_seconds ?? null,
  })

  const signature = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex')

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-connexions-signature': signature,
      },
      body,
    })
    let detail: unknown = null
    try {
      detail = await res.json()
    } catch {
      /* IP may return a non-JSON body on some errors — ignore */
    }
    if (res.ok) {
      const deduplicated = !!(detail as { deduplicated?: boolean } | null)?.deduplicated
      console.log(
        `[/api/methodology/sync] IP relay ok: intake_id=${data.intake_id} status=${res.status}` +
          (deduplicated ? ' deduplicated=true (IP already had this interview)' : '')
      )
    } else {
      console.error(
        `[/api/methodology/sync] IP relay failed: intake_id=${data.intake_id} status=${res.status}` +
          (res.status === 401
            ? ' (401 = CONNEXIONS_INTAKE_WEBHOOK_SECRET mismatch between CAS and IP)'
            : '') +
          ` body=${JSON.stringify(detail)}`
      )
    }
  } catch (e) {
    console.error(
      `[/api/methodology/sync] IP relay threw (non-blocking — sync still succeeds): intake_id=${data.intake_id}`,
      e
    )
  }
}

// ─── Handler ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
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

  const isConnexions =
    typeof parsedBody === 'object' &&
    parsedBody !== null &&
    (parsedBody as { event?: unknown }).event === 'methodology.intake.completed'

  // Normalise to a common internal shape: { ip_campaign_id, response_raw_text,
  // response_channel, prospect_*, classification?, classification_reasoning?,
  // per_question_signal? }
  interface NormalisedResponse {
    ip_campaign_id: string
    ip_partner_id: string | null
    prospect_name: string | null
    prospect_role: string | null
    prospect_org: string | null
    response_received_at: string
    response_raw_text: string
    response_channel: 'linkedin' | 'email' | 'voice' | null
    classification: ClassificationSignal | null
    classification_reasoning: string | null
    per_question_signal: Record<string, ClassificationSignal> | null
  }

  let normalised: NormalisedResponse
  let questionsOverride: string[] | null = null
  // Carried to the tail so the IP relay (Connexions branch only) can map
  // the validated payload after the rollup + card-status update.
  let connexionsData: z.infer<typeof ConnexionsPayloadSchema> | null = null

  if (isConnexions) {
    const parsed = ConnexionsPayloadSchema.safeParse(parsedBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid Connexions payload', issues: parsed.error.issues },
        { status: 400 }
      )
    }
    connexionsData = parsed.data
    const prospect = parsed.data.prospect ?? {}
    const hasTranscript = !!parsed.data.transcript_excerpt && parsed.data.transcript_excerpt.length > 0
    const placeholderText = `(transcript unavailable — Connexions interview ${parsed.data.intake_id}; completed ${parsed.data.completed_at ?? '(no timestamp)'}. Prospect: ${prospect.name ?? '(unnamed)'}${prospect.company ? ` @ ${prospect.company}` : ''}. Re-fetch from ElevenLabs once Session 3.5 ships.)`
    normalised = {
      ip_campaign_id: parsed.data.ip_campaign_id,
      ip_partner_id: parsed.data.intake_id, // Connexions interview id stands in
      prospect_name: prospect.name ?? null,
      prospect_role: prospect.role ?? null,
      prospect_org: prospect.company ?? null,
      response_received_at: parsed.data.completed_at ?? new Date().toISOString(),
      response_raw_text: hasTranscript ? parsed.data.transcript_excerpt! : placeholderText,
      response_channel: 'voice',
      classification: parsed.data.extraction?.overall_classification ?? null,
      classification_reasoning: parsed.data.extraction?.summary ?? null,
      per_question_signal: parsed.data.extraction?.per_question_signal ?? null,
    }
    questionsOverride = parsed.data.questions ?? null
  } else {
    const parsed = MockPayloadSchema.safeParse(parsedBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', issues: parsed.error.issues },
        { status: 400 }
      )
    }
    normalised = {
      ip_campaign_id: parsed.data.ip_campaign_id,
      ip_partner_id: parsed.data.ip_partner_id ?? null,
      prospect_name: parsed.data.prospect_name ?? null,
      prospect_role: parsed.data.prospect_role ?? null,
      prospect_org: parsed.data.prospect_org ?? null,
      response_received_at: parsed.data.response_received_at ?? new Date().toISOString(),
      response_raw_text: parsed.data.response_raw_text,
      response_channel: parsed.data.response_channel ?? null,
      classification: null,
      classification_reasoning: null,
      per_question_signal: null,
    }
  }

  const supabase = supabaseAdmin()

  // Look up CAS campaign by ip_campaign_id
  const { data: campaign, error: campaignErr } = await supabase
    .from('methodology_campaigns')
    .select('id, card_id, questions')
    .eq('ip_campaign_id', normalised.ip_campaign_id)
    .maybeSingle()

  if (campaignErr) {
    console.error('[/api/methodology/sync] campaign lookup failed:', campaignErr)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
  if (!campaign) {
    return NextResponse.json(
      { error: `No CAS campaign mirrored for ip_campaign_id ${normalised.ip_campaign_id}` },
      { status: 404 }
    )
  }

  // Load parent card
  const { data: card, error: cardErr } = await supabase
    .from('methodology_hypothesis_cards')
    .select('id, product_slug, hypothesis_rows')
    .eq('id', campaign.card_id)
    .maybeSingle()
  if (cardErr || !card) {
    console.error('[/api/methodology/sync] card lookup failed:', cardErr)
    return NextResponse.json({ error: 'Parent card not found' }, { status: 500 })
  }

  const questions = questionsOverride
    ?? (Array.isArray(campaign.questions) ? (campaign.questions as string[]) : [])
  const hypothesisRows = Array.isArray(card.hypothesis_rows)
    ? (card.hypothesis_rows as Array<{ field: string; hypothesis_text: string; [k: string]: unknown }>)
    : []

  // Classify on CAS if we don't already have extraction from Connexions.
  // Skip classification on placeholder text (no transcript means no signal).
  const isPlaceholder = normalised.response_raw_text.startsWith('(transcript unavailable')
  if (!normalised.classification && !isPlaceholder && normalised.response_raw_text && questions.length > 0) {
    try {
      const c = await classifyResponse({
        response_text: normalised.response_raw_text,
        questions,
        hypothesis_rows: hypothesisRows,
      })
      normalised.classification = c.overall_classification
      normalised.classification_reasoning = c.reasoning
      normalised.per_question_signal = c.per_question_signal
    } catch (e) {
      console.error('[/api/methodology/sync] CAS classification fallback failed:', e)
    }
  }

  // Insert response row
  const { data: insertedResponse, error: insertErr } = await supabase
    .from('methodology_responses')
    .insert({
      campaign_id: campaign.id,
      ip_partner_id: normalised.ip_partner_id,
      prospect_name: normalised.prospect_name,
      prospect_role: normalised.prospect_role,
      prospect_org: normalised.prospect_org,
      response_received_at: normalised.response_received_at,
      response_raw_text: normalised.response_raw_text,
      response_channel: normalised.response_channel,
      classification: normalised.classification,
      classification_reasoning: normalised.classification_reasoning,
      per_question_signal: normalised.per_question_signal,
      classified_at: normalised.classification ? new Date().toISOString() : null,
    })
    .select('id')
    .single()

  if (insertErr) {
    console.error('[/api/methodology/sync] response insert failed:', insertErr)
    return NextResponse.json({ error: 'Failed to persist response' }, { status: 500 })
  }

  // Roll up across all responses for this campaign
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
    (allResponses ?? []) as Array<{ per_question_signal: Record<string, ClassificationSignal> | null }>
  )

  const cardStatus = updatedRows.every((r) =>
    r.validation_status === 'confirmed' ||
    r.validation_status === 'contradicted' ||
    r.validation_status === 'refined'
  )
    ? 'validated'
    : 'validation-in-flight'

  const { error: cardUpdateErr } = await supabase
    .from('methodology_hypothesis_cards')
    .update({ hypothesis_rows: updatedRows, status: cardStatus })
    .eq('id', card.id)

  if (cardUpdateErr) {
    console.error('[/api/methodology/sync] card update failed:', cardUpdateErr)
  }

  // Relay to InvestorPilot — mark the matching partner as interviewed.
  // Connexions branch only (the mock/debug path has no IP partner ref).
  // Awaited but self-contained: relayInterviewedToInvestorPilot never
  // throws, so the 201 below is never affected by the relay outcome.
  // (Use waitUntil from @vercel/functions if it gets added to the repo;
  // until then the awaited call is the safe fallback.)
  if (isConnexions && connexionsData) {
    await relayInterviewedToInvestorPilot(connexionsData)
  }

  return NextResponse.json(
    {
      source: isConnexions ? 'connexions' : 'mock',
      response_id: insertedResponse.id,
      classification: normalised.classification,
      card_status: cardStatus,
      rolled_up_rows: updatedRows.length,
    },
    { status: 201 }
  )
}
