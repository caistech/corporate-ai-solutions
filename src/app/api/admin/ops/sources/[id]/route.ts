/**
 * /api/admin/ops/sources/[id]
 *   PATCH  — edit any field of a cost source (incl. is_active to retire/restore, balance, threshold).
 *   DELETE — permanently remove a source (and its cost_entries via FK cascade).
 *
 * Operator-only. Editing balance/threshold here also re-evaluates low-balance alerts immediately
 * so a freshly-recorded low balance emails the admin without waiting for the daily cron.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireOperator } from '@/lib/ops/auth'
import { updateSource, deleteSource, BILLING_MODELS, type BillingModel, type SourceInput } from '@/lib/ops/sources'
import { evaluateLowBalancesAndAlert } from '@/lib/ops/balances'

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

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireOperator()
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const patch: Partial<SourceInput> = {}
  if (body.provider !== undefined) patch.provider = String(body.provider)
  if (body.name !== undefined) patch.name = String(body.name)
  if (body.organisation_id !== undefined) patch.organisation_id = body.organisation_id ? String(body.organisation_id) : null
  if (body.source_ref !== undefined) patch.source_ref = body.source_ref ? String(body.source_ref) : null
  if (body.notes !== undefined) patch.notes = body.notes ? String(body.notes) : null
  if (body.billing_url !== undefined) patch.billing_url = body.billing_url ? String(body.billing_url) : null
  if (body.is_active !== undefined) patch.is_active = Boolean(body.is_active)

  if (body.billing_model !== undefined) {
    const billing = body.billing_model as BillingModel
    if (!BILLING_MODELS.includes(billing)) {
      return NextResponse.json({ error: `billing_model must be one of ${BILLING_MODELS.join(', ')}` }, { status: 400 })
    }
    patch.billing_model = billing
  }

  for (const key of ['fixed_cost_usd', 'balance_usd', 'alert_threshold_usd'] as const) {
    if (body[key] !== undefined) {
      const v = num(body[key])
      if (Number.isNaN(v) || (typeof v === 'number' && v < 0)) {
        return NextResponse.json({ error: `${key} must be a non-negative number` }, { status: 400 })
      }
      patch[key] = v ?? null
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const client = db()
  const result = await updateSource(client, params.id, patch)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 500 })

  // A balance/threshold edit may have put this source below its line — alert now, not next cron.
  let alerted: unknown = undefined
  if (patch.balance_usd !== undefined || patch.alert_threshold_usd !== undefined) {
    alerted = await evaluateLowBalancesAndAlert(client)
  }
  return NextResponse.json({ success: true, id: result.id, alerted })
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireOperator()
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const result = await deleteSource(db(), params.id)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ success: true })
}
