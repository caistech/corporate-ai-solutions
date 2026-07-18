/**
 * POST /api/admin/reverse-scout/assets/[assetId]/card — run Stage 1 (Capability Card) and persist.
 *
 * Operator-only. Re-runnable: a new card row is appended and the newest wins on read.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/reverse-scout/operator'
import { getAsset, saveCapabilityCard } from '@/lib/reverse-scout/store'
import { generateCapabilityCard } from '@/lib/reverse-scout/engine'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
// Stage 1 is a single Sonnet call, but keep headroom over the platform default.
export const maxDuration = 120

export async function POST(_request: NextRequest, { params }: { params: { assetId: string } }) {
  const auth = await requireOperator()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const asset = await getAsset(params.assetId)
    if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })

    const draft = await generateCapabilityCard({
      name: asset.name,
      source_type: asset.source_type,
      source_text: asset.source_text,
    })
    const card = await saveCapabilityCard(asset.id, draft)
    return NextResponse.json({ card })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate Capability Card'
    console.error('[reverse-scout] generate card error:', err)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
