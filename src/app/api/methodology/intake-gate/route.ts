import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { computeIntakeGate, type IntakeGateCard } from '@/lib/methodology-intake-gate'

/**
 * GET /api/methodology/intake-gate
 *
 * The pipeline intake WIP gate (MONETISATION_RULES Rule 16 / BUSINESS_MODEL §4,
 * Gate 0). Returns whether NEW manual operator intake is currently allowed, and
 * if not, the untriaged cards blocking it. Any session or agent acting for the
 * operator checks this before admitting a product.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = supabaseAdmin()
    const { data, error } = await supabase
      .from('methodology_hypothesis_cards')
      .select('product_slug, status, pipeline_stage, archived_at, inbox')

    if (error) {
      console.error('intake-gate select failed:', error)
      return NextResponse.json({ error: 'Failed to compute intake gate' }, { status: 500 })
    }

    const gate = computeIntakeGate((data ?? []) as IntakeGateCard[])
    return NextResponse.json({
      open: gate.open,
      untriaged_count: gate.untriagedCount,
      untriaged: gate.untriaged,
    })
  } catch (e) {
    console.error('API error (GET /api/methodology/intake-gate):', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
