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
import { recordUsage, INTERNAL_ORG_ID, type UsageEventInput } from '@/lib/ops/usage'

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
})

const BodySchema = z.object({
  productSlug: z.string().min(1).max(80),
  events: z.array(EventSchema).min(1).max(MAX_EVENTS),
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

  const { productSlug, events } = parsed.data
  const mapped: UsageEventInput[] = events.map((e) => ({
    productSlug,
    provider: e.provider,
    model: e.model ?? null,
    api: e.api ?? null,
    unitType: e.unitType,
    units: e.units,
    occurredAt: e.occurredAt,
    metadata: e.metadata,
    organisationId: INTERNAL_ORG_ID, // forced — a product cannot attribute usage elsewhere
  }))

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  try {
    const result = await recordUsage(db, mapped)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('[ingest/usage] recordUsage error:', error)
    return NextResponse.json({ error: 'Failed to record usage' }, { status: 500 })
  }
}
