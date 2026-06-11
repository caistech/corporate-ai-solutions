/**
 * /api/cron/cost-sync — daily sync of all infrastructure costs.
 *
 * Thin wrapper over runCostSync() (the shared engine — also driven on demand by the operator
 * "Sync now" button at /api/admin/ops/sync). Auth: CRON_SECRET Bearer token.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { runCostSync } from '@/lib/ops/run-sync'

function getDbClient(): SupabaseClient {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

function verifyCronAuth(request: NextRequest): boolean {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  return Boolean(process.env.CRON_SECRET) && token === process.env.CRON_SECRET
}

export async function POST(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const results = await runCostSync(getDbClient())
    console.log('[cost-sync] Complete:', results)
    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('[cost-sync] Fatal error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
