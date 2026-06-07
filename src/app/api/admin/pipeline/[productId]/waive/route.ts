// POST/DELETE /api/admin/pipeline/[productId]/waive
//
// Per-check readiness waiver — the operator's adjudication on a finding the machine can't (or
// shouldn't) auto-fix. GOLDEN RULE: a waiver is deliberate + logged, never a silent na. It lifts
// the finding's effect on the gate/score (score.ts treats a waived check as resolved + drops it
// from the weighted denominator) WITHOUT faking a pass — the card still surfaces it as "waived"
// with the reason + who waived it.
//
//   POST   { check_code, reason, acknowledge? }  → record/refresh an active waiver.
//   DELETE { check_code }                         → lift it (active=false; the reason is kept for audit).
//
// A reason is always required. Waiving a HARD / CONDITIONAL-HARD check additionally requires an
// explicit acknowledge (the type-to-confirm the UI enforces) — mirrors the rubric's "overriding a
// HARD-gate failure needs an explicit per-check confirm".

import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/pipeline/require-operator'
import { supabaseAdmin } from '@/lib/supabase'

const isHardTier = (t: string | null | undefined): boolean =>
  t === 'HARD' || t === 'CONDITIONAL-HARD'

export async function POST(
  req: NextRequest,
  { params }: { params: { productId: string } },
) {
  const operator = await requireOperator()
  if (!operator) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const slug = params.productId.trim().toLowerCase()

  let checkCode = ''
  let reason = ''
  let acknowledge = false
  try {
    const body = await req.json()
    if (body && typeof body.check_code === 'string') checkCode = body.check_code.trim()
    if (body && typeof body.reason === 'string') reason = body.reason.trim()
    acknowledge = !!(body && body.acknowledge)
  } catch {
    /* fall through to validation below */
  }

  if (!checkCode) return NextResponse.json({ error: 'check_code is required' }, { status: 400 })
  if (!reason) return NextResponse.json({ error: 'A reason is required to waive a check' }, { status: 400 })

  const supabase = supabaseAdmin()

  // Look up the check so we know whether it's a HARD-gate waiver (extra confirm) and that it exists.
  const { data: criterion, error: critErr } = await supabase
    .from('readiness_criteria')
    .select('code, tier, check_label')
    .eq('code', checkCode)
    .maybeSingle()

  if (critErr) {
    console.error('[waive] criteria lookup failed', critErr)
    return NextResponse.json({ error: 'failed to look up the check' }, { status: 500 })
  }
  if (!criterion) {
    return NextResponse.json({ error: `unknown check_code "${checkCode}"` }, { status: 404 })
  }
  if (isHardTier(criterion.tier) && !acknowledge) {
    return NextResponse.json(
      { error: 'Waiving a HARD-gate check requires an explicit acknowledge (type-to-confirm).' },
      { status: 400 },
    )
  }

  const { error: upErr } = await supabase
    .from('readiness_waivers')
    .upsert(
      {
        product_slug: slug,
        check_code: checkCode,
        reason,
        waived_by: operator.email,
        active: true,
      },
      { onConflict: 'product_slug,check_code' },
    )

  if (upErr) {
    console.error('[waive] upsert failed', upErr)
    return NextResponse.json({ error: 'failed to record the waiver' }, { status: 500 })
  }

  console.log('[waive] recorded', { slug, checkCode, by: operator.email })
  return NextResponse.json({ waived: true, slug, check_code: checkCode })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { productId: string } },
) {
  const operator = await requireOperator()
  if (!operator) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const slug = params.productId.trim().toLowerCase()

  let checkCode = ''
  try {
    const body = await req.json()
    if (body && typeof body.check_code === 'string') checkCode = body.check_code.trim()
  } catch {
    /* fall through */
  }
  if (!checkCode) {
    // also accept ?check_code= for convenience
    checkCode = (req.nextUrl.searchParams.get('check_code') || '').trim()
  }
  if (!checkCode) return NextResponse.json({ error: 'check_code is required' }, { status: 400 })

  const supabase = supabaseAdmin()
  const { error } = await supabase
    .from('readiness_waivers')
    .update({ active: false })
    .eq('product_slug', slug)
    .eq('check_code', checkCode)

  if (error) {
    console.error('[waive] lift failed', error)
    return NextResponse.json({ error: 'failed to lift the waiver' }, { status: 500 })
  }

  console.log('[waive] lifted', { slug, checkCode, by: operator.email })
  return NextResponse.json({ lifted: true, slug, check_code: checkCode })
}
