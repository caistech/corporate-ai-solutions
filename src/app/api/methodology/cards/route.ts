import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/methodology/cards
 *
 * Create a Hypothesis Card from a Phase Zero-A dialogue session.
 *
 * Body shape:
 *   {
 *     product_slug: 'rehearsals-ai',
 *     origin_summary?: '...',
 *     original_end_user?: '...',
 *     hypothesis_rows: [
 *       { field: 'original_end_user', hypothesis_text: '...', validation_status: 'pending' },
 *       ...
 *     ]
 *   }
 *
 * Idempotent on product_slug — re-posting updates the card rather than
 * 409'ing. The dialogue may evolve; latest call wins.
 */

const HypothesisRowSchema = z.object({
  field: z.string().min(1).max(200),
  hypothesis_text: z.string().min(1).max(4000),
  validation_status: z
    .enum(['pending', 'in-flight', 'confirmed', 'contradicted', 'refined'])
    .default('pending'),
  notes: z.string().max(2000).optional(),
})

const CardCreateSchema = z.object({
  product_slug: z.string().min(1).max(120),
  origin_summary: z.string().max(4000).optional(),
  original_end_user: z.string().max(2000).optional(),
  hypothesis_rows: z.array(HypothesisRowSchema).max(50),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = CardCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', issues: parsed.error.issues },
        { status: 400 }
      )
    }

    const supabase = supabaseAdmin()

    // Upsert on product_slug (UNIQUE constraint). Latest dialogue wins.
    const { data, error } = await supabase
      .from('methodology_hypothesis_cards')
      .upsert(
        {
          product_slug: parsed.data.product_slug,
          origin_summary: parsed.data.origin_summary ?? null,
          original_end_user: parsed.data.original_end_user ?? null,
          hypothesis_rows: parsed.data.hypothesis_rows,
          status: 'dialogue-complete',
        },
        { onConflict: 'product_slug' }
      )
      .select()
      .single()

    if (error) {
      console.error('methodology_hypothesis_cards upsert failed:', error)
      return NextResponse.json({ error: 'Failed to save card' }, { status: 500 })
    }

    return NextResponse.json({ card: data }, { status: 201 })
  } catch (error) {
    console.error('API error (/api/methodology/cards):', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = supabaseAdmin()
    const { data, error } = await supabase
      .from('methodology_hypothesis_cards')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('methodology_hypothesis_cards select failed:', error)
      return NextResponse.json({ error: 'Failed to list cards' }, { status: 500 })
    }

    return NextResponse.json({ cards: data ?? [] })
  } catch (error) {
    console.error('API error (/api/methodology/cards GET):', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
