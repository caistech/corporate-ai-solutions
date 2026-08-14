/**
 * POST /api/ingest/usage — usage ingestion endpoint (Phase 2 keystone).
 *
 * Products are separate apps with their own Supabase + BYOK keys; they must NEVER hold the cockpit
 * service-role key. So they don't write usage_events directly — they POST their metered usage here,
 * authenticated by a shared bearer token (USAGE_INGEST_TOKEN), and THIS route (which alone holds the
 * cockpit service-role key) writes the rows via recordUsage(). One ingestion door, one secret.
 *
 * Auth: bearer token === USAGE_INGEST_TOKEN. Fails CLOSED — if the env var is unset, every request
 * is rejected (never an open ingestion endpoint). NOT operator-gated (products aren't operators);
 * /api/ingest/* sits outside the operator middleware matcher, so this token check IS the gate.
 *
 * Shape: { productSlug, events: [{ provider, model?, api?, unitType, units, occurredAt?, metadata? }] }.
 * organisation_id is forced to internal server-side — a product cannot attribute usage to another org.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { recordUsage, recordCalls, INTERNAL_ORG_ID, type UsageEventInput, type AiCallInput } from '@/lib/ops/usage'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const MAX_EVENTS = 500

const EventSchema = z.object({
  provider: z.string().min(1).max(60),
  model: z.string().max(120).nullish(),
  api: z.string().max(60).nullish(),
  unitType: z.string().min(1).max(60),
  units: z.number().finite().nonnegative(),
  occurredAt: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  callId: z.string().uuid().optional(),
})

/** Slice 0B — call-grain records. Optional: pre-0B events-only bodies stay valid. */
const CallSchema = z.object({
  callId: z.string().uuid(),
  provider: z.string().min(1).max(60),
  operation: z.string().min(1).max(80),
  status: z.enum(['ok', 'error', 'timeout', 'refused']),
  environment: z.string().max(40).nullish(),
  modelRequested: z.string().max(120).nullish(),
  modelUsed: z.string().max(120).nullish(),
  operationVersion: z.string().max(60).nullish(),
  startedAt: z.string().datetime().optional(),
  latencyMs: z.number().int().nonnegative().nullish(),
  errorClass: z.enum(['rate_limit', 'auth', 'server', 'schema', 'timeout', 'other']).nullish(),
  attempt: z.number().int().positive().max(32).nullish(),
  rootCallId: z.string().uuid().nullish(),
  fallbackFrom: z.string().max(120).nullish(),
  inputTokens: z.number().int().nonnegative().nullish(),
  outputTokens: z.number().int().nonnegative().nullish(),
  cacheReadTokens: z.number().int().nonnegative().nullish(),
  cacheWriteTokens: z.number().int().nonnegative().nullish(),
  structuredValid: z.boolean().nullish(),
  schemaName: z.string().max(120).nullish(),
  refusalClass: z.string().max(60).nullish(),
  toolsOffered: z.number().int().nonnegative().nullish(),
  toolsCalled: z.number().int().nonnegative().nullish(),
  toolsWellformed: z.number().int().nonnegative().nullish(),
  sessionId: z.string().max(120).nullish(),
  requestId: z.string().max(120).nullish(),
  userRef: z.string().max(120).nullish(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

const BodySchema = z
  .object({
    productSlug: z.string().min(1).max(80),
    events: z.array(EventSchema).max(MAX_EVENTS).optional(),
    calls: z.array(CallSchema).max(MAX_EVENTS).optional(),
  })
  // Was `events` required min(1). Now either array may carry the payload, but an empty body is
  // still rejected rather than answered 200 with nothing recorded.
  .refine((b) => (b.events?.length ?? 0) > 0 || (b.calls?.length ?? 0) > 0, {
    message: 'Body must contain at least one event or call',
  })

/** Bearer-token gate. Fails closed when USAGE_INGEST_TOKEN is unset. */
function authorized(req: NextRequest): boolean {
  const expected = process.env.USAGE_INGEST_TOKEN
  if (!expected) {
    console.error('[ingest/usage] USAGE_INGEST_TOKEN not set — rejecting (fail closed)')
    return false
  }
  const header = req.headers.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  return token.length > 0 && token === expected
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.issues.slice(0, 5) },
      { status: 400 },
    )
  }

  const { productSlug, events, calls } = parsed.data
  const mapped: UsageEventInput[] = (events ?? []).map((e) => ({
    productSlug,
    provider: e.provider,
    model: e.model ?? null,
    api: e.api ?? null,
    unitType: e.unitType,
    units: e.units,
    occurredAt: e.occurredAt,
    metadata: e.metadata,
    organisationId: INTERNAL_ORG_ID, // forced — a product cannot attribute usage elsewhere
    callId: e.callId ?? null,
  }))

  const mappedCalls: AiCallInput[] = (calls ?? []).map((c) => ({ ...c, productSlug }))

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  try {
    // Calls first: a unit row referencing a call that failed to land is the less useful half.
    const callResult = mappedCalls.length > 0 ? await recordCalls(db, mappedCalls) : { inserted: 0, unpriced: 0 }
    const result = mapped.length > 0 ? await recordUsage(db, mapped) : { inserted: 0, unpriced: 0 }
    return NextResponse.json({
      success: true,
      ...result,
      callsInserted: callResult.inserted,
      callsUnpriced: callResult.unpriced,
    })
  } catch (error) {
    console.error('[ingest/usage] recordUsage error:', error)
    return NextResponse.json({ error: 'Failed to record usage' }, { status: 500 })
  }
}
