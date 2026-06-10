/**
 * POST /api/admin/ops/balance — record / adjust a cost source's balance + alert threshold.
 *
 * For providers without a remaining-credit API (Anthropic, OpenAI, Open Code Zen, …) the
 * operator records the current balance here; the daily cron (and this route, immediately)
 * then alerts when it drops below the threshold. Auto-synced providers (OpenRouter) are
 * updated by the cron but can also be overridden here.
 *
 * Auth: operator-only. NOTE /api/admin/* is NOT covered by the middleware matcher
 * (['/pipeline/*','/admin/*','/api/methodology/*']), so this route checks the operator
 * session + ADMIN_EMAILS allowlist itself.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { recordBalance, evaluateLowBalancesAndAlert } from '@/lib/ops/balances'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const INTERNAL_ORG_ID = '00000000-0000-0000-0000-000000000001'

function isOperator(email: string | undefined | null): boolean {
  const allow = (process.env.ADMIN_EMAILS || 'mcmdennis@gmail.com,dennis@corporateaisolutions.com')
    .split(/[,:]/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return allow.includes((email || '').toLowerCase())
}

async function getOperatorEmail(): Promise<string | null> {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } },
  )
  const { data } = await supabase.auth.getUser()
  return data.user?.email ?? null
}

export async function POST(request: NextRequest) {
  const email = await getOperatorEmail()
  if (!email) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  if (!isOperator(email)) return NextResponse.json({ error: 'Operator access required' }, { status: 403 })

  let body: { provider?: string; name?: string; balance_usd?: number; alert_threshold_usd?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const provider = (body.provider || '').trim().toLowerCase()
  if (!provider) return NextResponse.json({ error: 'provider is required' }, { status: 400 })

  const balanceUsd = body.balance_usd
  const thresholdUsd = body.alert_threshold_usd
  if (balanceUsd !== undefined && (typeof balanceUsd !== 'number' || !Number.isFinite(balanceUsd) || balanceUsd < 0)) {
    return NextResponse.json({ error: 'balance_usd must be a non-negative number' }, { status: 400 })
  }
  if (thresholdUsd !== undefined && (typeof thresholdUsd !== 'number' || !Number.isFinite(thresholdUsd) || thresholdUsd < 0)) {
    return NextResponse.json({ error: 'alert_threshold_usd must be a non-negative number' }, { status: 400 })
  }
  if (balanceUsd === undefined && thresholdUsd === undefined) {
    return NextResponse.json({ error: 'Provide balance_usd and/or alert_threshold_usd' }, { status: 400 })
  }

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const result = await recordBalance(db, {
    provider,
    name: body.name,
    balanceUsd,
    thresholdUsd,
    organisationId: INTERNAL_ORG_ID,
  })
  if (!result) return NextResponse.json({ error: 'Failed to record balance' }, { status: 500 })

  // Alert immediately if this update put the source below its threshold (near-real-time,
  // rather than waiting for the next daily cron).
  const alerted = await evaluateLowBalancesAndAlert(db)

  return NextResponse.json({ success: true, id: result.id, alerted })
}
