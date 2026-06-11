/**
 * POST /api/admin/ops/sync — run the cost sync on demand (the "Sync now" button).
 *
 * Same engine as the daily cron (runCostSync), but operator-gated instead of CRON_SECRET-gated,
 * so the operator can pull fresh balances/spend without waiting for 06:00. Returns the per-provider
 * outcome summary so the UI can report what synced and what needs a key.
 *
 * Operator-only (ADMIN_EMAILS). /api/admin/* is outside the middleware matcher, so the route gates
 * itself via requireOperator(). Writes use the service-role client (cost tables are admin-only RLS).
 */
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireOperator } from '@/lib/ops/auth'
import { runCostSync } from '@/lib/ops/run-sync'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
// The sync fans out to several provider APIs; give it room beyond the default.
export const maxDuration = 60

export async function POST() {
  const gate = await requireOperator()
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  try {
    const results = await runCostSync(db)
    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('[ops/sync] error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
