import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/methodology/cards/[slug] — fetch a single Hypothesis Card by product slug
 * PATCH /api/methodology/cards/[slug] — update the card's decision status + reason
 *
 * PATCH is the decision-control endpoint used by /admin/methodology/[slug]:
 * operator picks REDESIGN-TO-FIT / PERSONAL-INTEREST-OVERRIDE / KILL with a
 * one-line reason. Locks decision_made_at to NOW().
 */

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = supabaseAdmin()
    const { data, error } = await supabase
      .from('methodology_hypothesis_cards')
      .select('*')
      .eq('product_slug', params.slug)
      .maybeSingle()

    if (error) {
      console.error('methodology_hypothesis_cards select failed:', error)
      return NextResponse.json({ error: 'Failed to read card' }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }
    return NextResponse.json({ card: data })
  } catch (e) {
    console.error('API error (GET /api/methodology/cards/[slug]):', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const PatchSchema = z.object({
  status: z.enum([
    'dialogue-complete',
    'validation-in-flight',
    'validated',
    'redesign-to-fit',
    'personal-interest-override',
    'kill',
  ]),
  decision_reason: z.string().max(4000).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const body = await request.json()
    const parsed = PatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', issues: parsed.error.issues },
        { status: 400 }
      )
    }

    const supabase = supabaseAdmin()

    const isTerminalDecision =
      parsed.data.status === 'redesign-to-fit' ||
      parsed.data.status === 'personal-interest-override' ||
      parsed.data.status === 'kill'

    const updatePayload: Record<string, unknown> = {
      status: parsed.data.status,
      decision_reason: parsed.data.decision_reason ?? null,
    }
    if (isTerminalDecision) {
      updatePayload.decision_made_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('methodology_hypothesis_cards')
      .update(updatePayload)
      .eq('product_slug', params.slug)
      .select()
      .single()

    if (error) {
      console.error('methodology_hypothesis_cards update failed:', error)
      return NextResponse.json({ error: 'Failed to update card' }, { status: 500 })
    }

    return NextResponse.json({ card: data })
  } catch (e) {
    console.error('API error (PATCH /api/methodology/cards/[slug]):', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
