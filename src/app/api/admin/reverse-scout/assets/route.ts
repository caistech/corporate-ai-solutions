/**
 * POST /api/admin/reverse-scout/assets — create an asset to run through the pipeline.
 * GET  /api/admin/reverse-scout/assets — list assets (newest first).
 *
 * Operator-only (self-guarded — /api/admin/* is outside the middleware matcher).
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/reverse-scout/operator'
import { createAsset, listAssets } from '@/lib/reverse-scout/store'
import type { SourceType } from '@/lib/reverse-scout/types'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const SOURCE_TYPES: SourceType[] = ['repo', 'paste', 'doc']

export async function GET() {
  const auth = await requireOperator()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  try {
    return NextResponse.json({ assets: await listAssets() })
  } catch (err) {
    console.error('[reverse-scout] listAssets error:', err)
    return NextResponse.json({ error: 'Failed to list assets' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireOperator()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  let body: { name?: string; source_type?: string; raw_ref?: string; source_text?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const name = (body.name || '').trim()
  const sourceType = (body.source_type || 'paste').trim() as SourceType
  const sourceText = (body.source_text || '').trim()
  const rawRef = (body.raw_ref || '').trim() || null

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })
  if (!SOURCE_TYPES.includes(sourceType)) {
    return NextResponse.json({ error: `source_type must be one of ${SOURCE_TYPES.join(', ')}` }, { status: 400 })
  }
  if (!sourceText) return NextResponse.json({ error: 'source_text is required (paste the asset material)' }, { status: 400 })

  try {
    const asset = await createAsset({ name, source_type: sourceType, raw_ref: rawRef, source_text: sourceText })
    return NextResponse.json({ asset }, { status: 201 })
  } catch (err) {
    console.error('[reverse-scout] createAsset error:', err)
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 })
  }
}
