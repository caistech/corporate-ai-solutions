import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'

// Webhook contract for Connexions panel → Pipeline Tracker bridge.
// Mirrors the directive's §3.7 payload but trimmed to what the live Connexions
// stack actually emits today (no commercial 4-dim scoring — Tracker handles
// triage via Dennis-side priority/next_action updates).
//
// The richer scoring/extraction fields can be added later as a follow-up event
// (event_type='connexions_intake_completed' supports a JSON body) once
// Connexions's analyze-interview path is extended.

const IntakeSchema = z.object({
  source: z.enum(['connexions_platform_trust_sprint', 'voice_intake']),
  interview_id: z.string().min(1),
  agent_id: z.string().min(1).optional(),
  agent_name: z.string().min(1).optional(),
  completed_at: z.string().min(1),
  participant: z.object({
    name: z.string().min(1).optional().nullable(),
    email: z.string().email().optional().nullable(),
    company: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
  }),
  transcript_url: z.string().url().optional().nullable(),
  duration_seconds: z.number().int().nonnegative().optional().nullable(),
  // Optional scoring/extraction block — accepted but not required.
  // Connexions can send it once analyze-interview is panel-aware; for now
  // Tracker stores whatever lands.
  extras: z.record(z.string(), z.unknown()).optional().nullable(),
})

type IntakePayload = z.infer<typeof IntakeSchema>

function unauthorized(reason: string) {
  return NextResponse.json({ error: 'Unauthorized', reason }, { status: 401 })
}

export async function POST(request: NextRequest) {
  // Shared-secret auth
  const expected = process.env.CONNEXIONS_WEBHOOK_SECRET
  if (!expected) {
    console.error('[pipeline-intake] CONNEXIONS_WEBHOOK_SECRET not configured')
    return NextResponse.json(
      { error: 'Server misconfigured' },
      { status: 500 }
    )
  }
  const authHeader = request.headers.get('authorization') ?? ''
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  if (!match || match[1] !== expected) {
    return unauthorized('Missing or invalid bearer token')
  }

  // Owner UUID — Dennis's auth.users id. Required because the webhook has no
  // user session; the row would otherwise have a NULL owner_id and be invisible
  // to Dennis's RLS-scoped reads.
  const ownerId = process.env.PIPELINE_OWNER_USER_ID
  if (!ownerId) {
    console.error('[pipeline-intake] PIPELINE_OWNER_USER_ID not configured')
    return NextResponse.json(
      { error: 'Server misconfigured' },
      { status: 500 }
    )
  }

  let payload: IntakePayload
  try {
    const body = await request.json()
    const parsed = IntakeSchema.safeParse(body)
    if (!parsed.success) {
      console.warn('[pipeline-intake] Payload validation failed', {
        issues_count: parsed.error.issues.length,
      })
      return NextResponse.json(
        { error: 'Invalid payload', issues: parsed.error.issues },
        { status: 400 }
      )
    }
    payload = parsed.data
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const supabase = supabaseAdmin()

  // Compute next_action_due = today + 2 days (matches the 48h SLA on the
  // Connexions panel entry page).
  const due = new Date()
  due.setDate(due.getDate() + 2)
  const dueIso = due.toISOString().slice(0, 10)

  const contactName =
    payload.participant.name?.trim() ||
    payload.participant.email?.trim() ||
    'Unnamed prospect'

  const tags = ['connexions', 'pending_review']
  if (payload.source === 'connexions_platform_trust_sprint') {
    tags.push('shape_1')
  }

  const { data: contact, error: contactError } = await supabase
    .schema('pipeline')
    .from('contacts')
    .insert({
      owner_id: ownerId,
      name: contactName,
      email: payload.participant.email ?? null,
      company: payload.participant.company ?? null,
      source: payload.source,
      what_they_want: null,
      status: 'open',
      priority: 2,
      next_action: 'Review interview transcript',
      next_action_due: dueIso,
      tags,
    })
    .select()
    .single()

  if (contactError) {
    console.error('[pipeline-intake] contact insert failed', {
      code: contactError.code,
      message: contactError.message,
    })
    return NextResponse.json(
      { error: 'Failed to create contact', detail: contactError.message },
      { status: 500 }
    )
  }

  const summaryParts: string[] = [
    payload.agent_name
      ? `Voice intake completed via ${payload.agent_name}.`
      : 'Voice intake completed.',
  ]
  if (payload.duration_seconds != null) {
    summaryParts.push(`Duration: ${payload.duration_seconds}s.`)
  }

  const eventBody = {
    interview_id: payload.interview_id,
    agent_id: payload.agent_id ?? null,
    agent_name: payload.agent_name ?? null,
    completed_at: payload.completed_at,
    transcript_url: payload.transcript_url ?? null,
    duration_seconds: payload.duration_seconds ?? null,
    participant: payload.participant,
    extras: payload.extras ?? null,
  }

  const { error: eventError } = await supabase
    .schema('pipeline')
    .from('events')
    .insert({
      owner_id: ownerId,
      contact_id: contact.id,
      event_type: 'connexions_intake_completed',
      summary: summaryParts.join(' '),
      body: JSON.stringify(eventBody),
      occurred_at: payload.completed_at,
    })

  if (eventError) {
    // Contact was created; event failed. Log loudly but don't fail the request
    // because the contact row is what Dennis triages from — losing the event
    // is recoverable (he can read the transcript via transcript_url if it's
    // still in the request).
    console.error('[pipeline-intake] event insert failed', {
      contact_id: contact.id,
      code: eventError.code,
      message: eventError.message,
    })
  }

  console.log('[pipeline-intake] Contact created', {
    contact_id: contact.id,
    source: payload.source,
    interview_id: payload.interview_id,
  })

  return NextResponse.json(
    {
      success: true,
      contact_id: contact.id,
      event_logged: !eventError,
    },
    { status: 200 }
  )
}
