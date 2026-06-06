/**
 * GET /api/admin/pipeline/new-ideas/card-state?slug=<productSlug>
 *
 * The cookie-authed backend for the coach's `get_intake_progress` CLIENT tool AND the X/14
 * readiness strip. Returns presence-only progress (which of the 14 graded fields + the required
 * feasibility keys are captured / outstanding) so the agent knows what to ask next and the strip
 * stays live. The admit gate re-validates enums + build markers deterministically — this is a
 * progress view, not a verdict.
 *
 * Auth: requireOperator() — /api/admin/* is NOT middleware-gated, so this gates itself.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireOperator } from '@/lib/pipeline/require-operator'
import { summariseCardState, GRADED_FIELDS } from '@/lib/methodology/apply-coach-fields'

export async function GET(request: NextRequest) {
  const operator = await requireOperator()
  if (!operator) {
    return NextResponse.json({ error: 'Operator authentication required' }, { status: 401 })
  }

  const slug = request.nextUrl.searchParams.get('slug')?.trim()
  if (!slug) {
    return NextResponse.json({ error: 'slug query param required' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Select the 14 graded columns + feasibility (the only fields the progress view reads).
  const cols = [...GRADED_FIELDS, 'feasibility'].join(', ')
  const { data, error } = await supabase
    .from('product_validation_status')
    .select(cols)
    .eq('product_slug', slug)
    .maybeSingle()
  if (error) {
    console.error('[card-state] read failed', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'idea row not found' }, { status: 404 })
  }

  const row = data as unknown as Record<string, unknown>
  const state = summariseCardState(row)

  // Raw captured values — so the voice path's Admit button can hand them to the (unchanged)
  // admit gate, which still takes client `fields`. The get_intake_progress tool stringifies only
  // the summary; these values are for the operator browser, not spoken by the agent.
  const fields: Record<string, string> = {}
  for (const f of GRADED_FIELDS) {
    const v = row[f]
    if (typeof v === 'string' && v.trim() !== '') fields[f] = v
  }
  const feasibility = (row.feasibility as Record<string, unknown> | null) ?? {}

  console.log('[card-state] slug=%s %d/%d captured, ready=%s', slug, state.gradedCaptured.length, state.total, state.readyToAdmit)
  return NextResponse.json({ ...state, fields, feasibility })
}
