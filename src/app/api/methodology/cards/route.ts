import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { computeIntakeGate, type IntakeGateCard } from '@/lib/methodology-intake-gate'
import { upsertMethodologyCard } from '@/lib/methodology/upsert-card'

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
  // The FIRST gate — routes the card down a different gate path (product vs
  // shared-service vs infra-product-candidate). Captured at the front door.
  build_type: z.enum(['product', 'shared-service', 'infra-product-candidate']).optional(),
  // The structured intake one-pager (gate-critical fields inside). Free-form
  // key→text; the office-hours interview typically PRODUCES this post-intake.
  idea_card: z.record(z.string(), z.string().max(8000)).optional(),
  // Intake WIP gate (Rule 16). `cockpit_intake` marks a fresh MANUAL operator add
  // from the cockpit — the only thing the gate blocks (dialogue re-posts + agent
  // deposits are exempt). `intake_source` records origin; an 'ideation-agent'
  // deposit lands in the inbox and never counts against the gate.
  // `intake_override_reason` force-admits past a blocked gate and is logged on the card.
  cockpit_intake: z.boolean().optional(),
  intake_source: z.enum(['operator', 'ideation-agent']).optional(),
  intake_override_reason: z.string().trim().min(1).max(2000).optional(),
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

    // Is this a brand-new card, or a re-post/update of an existing slug? The
    // intake WIP gate (Rule 16) only fires on genuinely-new MANUAL operator
    // intake — never on dialogue re-posts (idempotent upserts) or agent deposits.
    const { data: existing } = await supabase
      .from('methodology_hypothesis_cards')
      .select('id')
      .eq('product_slug', parsed.data.product_slug)
      .maybeSingle()
    const isNew = !existing

    const fromIdeationAgent = parsed.data.intake_source === 'ideation-agent'
    const overrideReason = parsed.data.intake_override_reason?.trim() || undefined

    // RULE 16 — block fresh manual operator intake while the board is untriaged.
    // Reasoned override (a written justification) force-admits one product and is
    // logged on the card. The always-on ideation agent's deposits (inbox) and any
    // re-post of an existing card are exempt.
    if (isNew && parsed.data.cockpit_intake && !fromIdeationAgent) {
      const { data: allCards } = await supabase
        .from('methodology_hypothesis_cards')
        .select('product_slug, status, pipeline_stage, archived_at, inbox')
      const gate = computeIntakeGate((allCards ?? []) as IntakeGateCard[])
      if (!gate.open && !overrideReason) {
        return NextResponse.json(
          {
            error: `Intake blocked (Rule 16): drain the backlog first. ${gate.untriagedCount} card(s) are untriaged — push each into research or record a terminal decision (kill / personal-interest / redesign), or supply an override reason to force this one through.`,
            gate: 'intake-wip',
            untriaged_count: gate.untriagedCount,
            untriaged: gate.untriaged,
          },
          { status: 412 }
        )
      }
      if (!gate.open && overrideReason) {
        console.warn(
          `[intake-gate] Rule 16 override: admitting '${parsed.data.product_slug}' with ${gate.untriagedCount} untriaged. Reason: ${overrideReason}`
        )
      }
    }

    // Upsert on product_slug via the ONE shared card-creation path (also used by
    // the review-intake in new-ideas/create). Latest dialogue wins; cockpit fields
    // are only written when provided; intake bookkeeping only on CREATE.
    try {
      const { card } = await upsertMethodologyCard(supabase, parsed.data)
      return NextResponse.json({ card }, { status: 201 })
    } catch (e) {
      console.error('methodology_hypothesis_cards upsert failed:', e)
      return NextResponse.json({ error: 'Failed to save card' }, { status: 500 })
    }
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
