/**
 * /api/admin/ops/sources
 *   GET  — list every cost source (active + retired) with its organisation.
 *   POST — create a new cost source (provider / name / billing model / balance / threshold / org).
 *
 * Operator-only (ADMIN_EMAILS). /api/admin/* is outside the middleware matcher, so the route
 * gates itself via requireOperator(). Writes use the service-role client (cost tables are
 * admin-only under RLS).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireOperator } from '@/lib/ops/auth'
import {
  listSources,
  createSource,
  BILLING_MODELS,
  type BillingModel,
  type SourceInput,
} from '@/lib/ops/sources'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

function num(v: unknown): number | undefined {
  if (v === undefined || v === null || v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : NaN
}

export async function GET() {
  const gate = await requireOperator()
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })
  const sources = await listSources(db())
  return NextResponse.json({ sources })
}

export async function POST(request: NextRequest) {
  const gate = await requireOperator()
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const provider = String(body.provider ?? '').trim()
  const name = String(body.name ?? '').trim()
  if (!provider) return NextResponse.json({ error: 'provider is required' }, { status: 400 })
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const billing = body.billing_model as BillingModel | undefined
  if (billing !== undefined && !BILLING_MODELS.includes(billing)) {
    return NextResponse.json({ error: `billing_model must be one of ${BILLING_MODELS.join(', ')}` }, { status: 400 })
  }

  const fixed = num(body.fixed_cost_usd)
  const balance = num(body.balance_usd)
  const threshold = num(body.alert_threshold_usd)
  for (const [label, v] of [['fixed_cost_usd', fixed], ['balance_usd', balance], ['alert_threshold_usd', threshold]] as const) {
    if (Number.isNaN(v) || (typeof v === 'number' && v < 0)) {
      return NextResponse.json({ error: `${label} must be a non-negative number` }, { status: 400 })
    }
  }

  const input: SourceInput = {
    provider,
    name,
    billing_model: billing,
    organisation_id: body.organisation_id ? String(body.organisation_id) : undefined,
    fixed_cost_usd: fixed,
    balance_usd: balance,
    alert_threshold_usd: threshold,
    source_ref: body.source_ref ? String(body.source_ref) : undefined,
    notes: body.notes ? String(body.notes) : undefined,
    billing_url: body.billing_url ? String(body.billing_url) : undefined,
  }

  const result = await createSource(db(), input)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ success: true, id: result.id }, { status: 201 })
}
