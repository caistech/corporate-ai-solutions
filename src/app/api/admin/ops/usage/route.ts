/**
 * GET /api/admin/ops/usage — filtered per-product/per-API usage analytics for the Cost Dashboard.
 *
 * Backs the interactive charts on /admin/ops: the client re-hits this whenever a filter changes
 * (product / provider / API / date range) and re-renders. Read-only aggregation over usage_events.
 *
 * Operator-only (ADMIN_EMAILS). /api/admin/* is outside the middleware matcher, so the route gates
 * itself via requireOperator(). Reads use the service-role client (usage tables are admin-only RLS).
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireOperator } from '@/lib/ops/auth'
import { getUsageAnalytics, type UsageFilter } from '@/lib/ops/usage'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET(req: NextRequest) {
  const gate = await requireOperator()
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const params = req.nextUrl.searchParams
  const filter: UsageFilter = {
    from: params.get('from') || undefined,
    to: params.get('to') || undefined,
    productSlug: params.get('productSlug') || undefined,
    provider: params.get('provider') || undefined,
    api: params.get('api') || undefined,
  }

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  try {
    const analytics = await getUsageAnalytics(db, filter)
    return NextResponse.json({ analytics })
  } catch (error) {
    console.error('[ops/usage] GET error:', error)
    return NextResponse.json({ error: 'Failed to load usage analytics' }, { status: 500 })
  }
}
