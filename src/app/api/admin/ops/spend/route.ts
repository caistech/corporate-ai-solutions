/**
 * POST /api/admin/ops/spend — record a manual spend figure for a source.
 *
 * For providers with no usage/cost API (Brave, Hunter, Unipile, Resend, …), the operator reads
 * the amount off the provider's billing console and records it here. It writes a cost_entry for the
 * given date (default today), so the source shows up in "This Month" / "By Provider" totals just
 * like an auto-synced one. Upserts on (source_id, entry_date), so re-recording corrects the figure.
 *
 * Operator-only (ADMIN_EMAILS); /api/admin/* gates itself. Service-role writes (admin-only RLS).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireOperator } from '@/lib/ops/auth'
import { recordSyncOutcome } from '@/lib/ops/providers'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export async function POST(request: NextRequest) {
  const gate = await requireOperator()
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  let body: { source_id?: string; amount_usd?: number; entry_date?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const sourceId = (body.source_id || '').trim()
  if (!sourceId) return NextResponse.json({ error: 'source_id is required' }, { status: 400 })

  const amount = Number(body.amount_usd)
  if (!Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ error: 'amount_usd must be a non-negative number' }, { status: 400 })
  }

  const entryDate = body.entry_date && ISO_DATE.test(body.entry_date)
    ? body.entry_date
    : new Date().toISOString().split('T')[0]

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { error } = await db.from('cost_entries').upsert(
    {
      source_id: sourceId,
      entry_date: entryDate,
      cost_usd: amount,
      usage_json: { manual: true },
    } as never,
    { onConflict: 'source_id,entry_date' },
  )
  if (error) {
    console.error('[ops/spend] upsert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Mark the source so the dashboard shows it's tracked by hand (not a stale/failed auto-sync).
  await recordSyncOutcome(db, sourceId, {
    status: 'manual',
    detail: `spend recorded by hand ($${amount.toFixed(2)} for ${entryDate})`,
  })

  return NextResponse.json({ success: true, entry_date: entryDate, amount_usd: amount })
}
