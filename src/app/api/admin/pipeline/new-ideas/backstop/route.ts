/**
 * POST /api/admin/pipeline/new-ideas/backstop
 *
 * The voice coach's completion backstop (VOICE_COACH_PLAN §3). The operator browser (VoiceCoach)
 * POSTs the full transcript when the call ends; this extracts any field the agent captured
 * conversationally but failed to save_field, and fills GAPS ONLY — it never overwrites a value the
 * save_field path already confirmed. The admit gate re-validates regardless.
 *
 * Cookie-authed (requireOperator) — consistent with save_field; no server-to-server token. Runs on
 * the operator's authed session; degrades to a no-op if ANTHROPIC_API_KEY is absent.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireOperator } from '@/lib/pipeline/require-operator'
import { applyCoachFields, GRADED_FIELDS } from '@/lib/methodology/apply-coach-fields'
import { extractFromTranscript, type TranscriptTurn } from '@/lib/methodology/extract-from-transcript'

const present = (v: unknown): boolean => typeof v === 'string' && v.trim() !== ''

export async function POST(request: NextRequest) {
  const operator = await requireOperator()
  if (!operator) {
    return NextResponse.json({ error: 'Operator authentication required' }, { status: 401 })
  }

  let body: { productSlug?: string; transcript?: TranscriptTurn[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }
  const { productSlug, transcript } = body
  if (!productSlug || !Array.isArray(transcript)) {
    return NextResponse.json({ error: 'productSlug and transcript[] required' }, { status: 400 })
  }

  const extracted = await extractFromTranscript(transcript)
  const exFields = extracted.fields ?? {}
  const exFeasibility = extracted.feasibility ?? {}
  if (Object.keys(exFields).length === 0 && Object.keys(exFeasibility).length === 0) {
    return NextResponse.json({ ok: true, touched: [] }) // nothing extracted (or no API key) — no-op
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Gap-fill only: read the current row, keep extracted values ONLY for fields not already captured.
  const { data: row } = await supabase
    .from('product_validation_status')
    .select([...GRADED_FIELDS, 'feasibility'].join(', '))
    .eq('product_slug', productSlug)
    .maybeSingle()
  const current = (row as unknown as Record<string, unknown>) ?? {}
  const currentFeas = (current.feasibility as Record<string, unknown> | null) ?? {}

  const gapFields: Record<string, string> = {}
  for (const [k, v] of Object.entries(exFields)) if (!present(current[k])) gapFields[k] = v
  const gapFeasibility: Record<string, string> = {}
  for (const [k, v] of Object.entries(exFeasibility)) if (!present(currentFeas[k])) gapFeasibility[k] = v

  if (Object.keys(gapFields).length === 0 && Object.keys(gapFeasibility).length === 0) {
    return NextResponse.json({ ok: true, touched: [] }) // everything already captured by save_field
  }

  try {
    const { touched } = await applyCoachFields(supabase, productSlug, { fields: gapFields, feasibility: gapFeasibility })
    console.log('[backstop] filled gaps for %s:', productSlug, touched)
    return NextResponse.json({ ok: true, touched })
  } catch (e) {
    console.error('[backstop] error', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'backstop failed' }, { status: 500 })
  }
}
