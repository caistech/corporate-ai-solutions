/**
 * POST /api/admin/pipeline/new-ideas/save-field
 *
 * The cookie-authed backend for the voice coach's `save_field` CLIENT tool. The operator browser
 * (VoiceCoach.tsx) supplies the tool implementation, which POSTs here with the operator's session
 * cookie — so identity is the authed operator, no server-to-server token needed (this repo does
 * voice via client tools + the authed browser, not server webhooks).
 *
 * Body: { productSlug, field, value }. Routes the single field into the 14-graded / feasibility
 * shape (routeCoachField — rejects unknown names with 400), then applyCoachFields (the SOLE live
 * writer) persists it + the has_ flag. The admit gate still re-validates everything later; this
 * only accrues progress so the X/14 strip and get_intake_progress stay live.
 *
 * Auth: requireOperator() — /api/admin/* is NOT middleware-gated, so this gates itself.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireOperator } from '@/lib/pipeline/require-operator'
import { applyCoachFields, routeCoachField, CoachFieldError } from '@/lib/methodology/apply-coach-fields'

export async function POST(request: NextRequest) {
  const operator = await requireOperator()
  if (!operator) {
    return NextResponse.json({ error: 'Operator authentication required' }, { status: 401 })
  }

  let body: { productSlug?: string; field?: string; value?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  const { productSlug, field, value } = body
  console.log('[save-field] op=%s slug=%s field=%s', operator.email, productSlug, field)

  if (!productSlug || !field || typeof value !== 'string') {
    return NextResponse.json({ error: 'productSlug, field and value are required' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  try {
    const input = routeCoachField(field, value) // throws CoachFieldError on an unknown name
    const { touched } = await applyCoachFields(supabase, productSlug, input)
    console.log('[save-field] wrote', touched)
    return NextResponse.json({ ok: true, touched })
  } catch (e) {
    if (e instanceof CoachFieldError) {
      console.warn('[save-field] rejected:', e.message)
      return NextResponse.json({ error: e.message }, { status: 400 })
    }
    console.error('[save-field] error', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'save failed' }, { status: 500 })
  }
}
