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
  // Initial status — a fresh idea lands at 'ideation' (no dialogue yet); a
  // backfilled dialogue card lands at 'dialogue-complete'. Defaults to
  // 'dialogue-complete' for backward-compatible dialogue POSTs.
  status: z.enum(['ideation', 'dialogue-complete']).optional(),
  // Cockpit fields — optional so a dialogue POST and a "add chosen product"
  // POST can both create a card; absent keys are left at column defaults.
  pipeline_stage: z
    .enum(['ideation', 'feasibility', 'validation', 'go-no-go', 'build', 'ship'])
    .optional(),
  monetisation_lane: z.enum(['1-paid-saas', '2-studio', '3-contract', '4-byok']).optional(),
  engine_cluster: z.string().max(120).optional(),
  build_status: z.enum(['none', 'thin-mvp', 'fat-mvp', 'full']).optional(),
  mvp_url: z.string().url().max(500).optional(),
  mvp_ready: z.boolean().optional(),
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
    // Cockpit fields are only written when provided, so a dialogue re-post
    // doesn't clobber a build_status/mvp_url an operator set in the cockpit.
    const upsertRow: Record<string, unknown> = {
      product_slug: parsed.data.product_slug,
      origin_summary: parsed.data.origin_summary ?? null,
      original_end_user: parsed.data.original_end_user ?? null,
      hypothesis_rows: parsed.data.hypothesis_rows,
      status: parsed.data.status ?? 'dialogue-complete',
    }
    if (parsed.data.pipeline_stage !== undefined) upsertRow.pipeline_stage = parsed.data.pipeline_stage
    if (parsed.data.monetisation_lane !== undefined) upsertRow.monetisation_lane = parsed.data.monetisation_lane
    if (parsed.data.engine_cluster !== undefined) upsertRow.engine_cluster = parsed.data.engine_cluster
    if (parsed.data.build_status !== undefined) upsertRow.build_status = parsed.data.build_status
    if (parsed.data.mvp_url !== undefined) upsertRow.mvp_url = parsed.data.mvp_url
    if (parsed.data.mvp_ready !== undefined) upsertRow.mvp_ready = parsed.data.mvp_ready

    const { data, error } = await supabase
      .from('methodology_hypothesis_cards')
      .upsert(upsertRow, { onConflict: 'product_slug' })
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
