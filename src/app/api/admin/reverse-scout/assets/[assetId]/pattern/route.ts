/**
 * POST /api/admin/reverse-scout/assets/[assetId]/pattern — run Stage 2 (Pattern Abstraction,
 * the moat) and persist the pattern + its sector map. Requires a Capability Card first.
 *
 * Operator-only. Re-runnable: a new pattern (+ sectors) is appended and the newest wins on read.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/reverse-scout/operator'
import { getAssetDetail, savePattern } from '@/lib/reverse-scout/store'
import { abstractPattern } from '@/lib/reverse-scout/engine'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
// Stage 2 runs on Opus and may need multiple internal passes — give it room.
export const maxDuration = 150

export async function POST(_request: NextRequest, { params }: { params: { assetId: string } }) {
  const auth = await requireOperator()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const detail = await getAssetDetail(params.assetId)
    if (!detail) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    if (!detail.card) {
      return NextResponse.json({ error: 'Generate the Capability Card (Stage 1) first' }, { status: 409 })
    }

    const draft = await abstractPattern(detail.card)
    const pattern = await savePattern(detail.asset.id, draft)
    return NextResponse.json({ pattern })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to abstract pattern'
    console.error('[reverse-scout] generate pattern error:', err)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
