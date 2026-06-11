/**
 * /api/admin/ops/orgs
 *   GET  — list organisations (internal + clients) to assign sources to.
 *   POST — add a new organisation / client so its costs can be tracked separately.
 *
 * Operator-only. Lets the operator stand up a fresh client and allocate that client's API
 * providers to it ("set it up like a new client").
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireOperator } from '@/lib/ops/auth'
import { listOrganisations, createOrganisation, type Organisation } from '@/lib/ops/sources'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const ORG_TYPES: Organisation['type'][] = ['internal', 'client', 'partner']

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET() {
  const gate = await requireOperator()
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })
  const organisations = await listOrganisations(db())
  return NextResponse.json({ organisations })
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

  const name = String(body.name ?? '').trim()
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const type = body.type as Organisation['type'] | undefined
  if (type !== undefined && !ORG_TYPES.includes(type)) {
    return NextResponse.json({ error: `type must be one of ${ORG_TYPES.join(', ')}` }, { status: 400 })
  }

  let mrr: number | null | undefined
  if (body.fixed_mrr_usd !== undefined && body.fixed_mrr_usd !== null && body.fixed_mrr_usd !== '') {
    const n = Number(body.fixed_mrr_usd)
    if (!Number.isFinite(n) || n < 0) {
      return NextResponse.json({ error: 'fixed_mrr_usd must be a non-negative number' }, { status: 400 })
    }
    mrr = n
  }

  const result = await createOrganisation(db(), { name, type, fixed_mrr_usd: mrr })
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ success: true, id: result.id }, { status: 201 })
}
