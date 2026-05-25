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

const PatchSchema = z
  .object({
    status: z
      .enum([
        'ideation',
        'dialogue-complete',
        'validation-in-flight',
        'validated',
        'redesign-to-fit',
        'personal-interest-override',
        'kill',
      ])
      .optional(),
    decision_reason: z.string().max(4000).optional(),
    // Soft-archive toggle — true sets archived_at = NOW(), false clears it.
    archived: z.boolean().optional(),
    // Promote an ideation-agent inbox idea into the pipeline — false flips it out
    // of the inbox, after which it counts against the intake WIP gate (Rule 16).
    inbox: z.boolean().optional(),
    // Cockpit fields — partial updates from the pipeline cockpit.
    pipeline_stage: z
      .enum(['ideation', 'feasibility', 'validation', 'go-no-go', 'build', 'ship'])
      .optional(),
    monetisation_lane: z
      .enum(['1-paid-saas', '2-studio', '3-contract', '4-byok'])
      .nullable()
      .optional(),
    engine_cluster: z.string().max(120).nullable().optional(),
    build_status: z.enum(['none', 'thin-mvp', 'fat-mvp', 'full']).optional(),
    mvp_url: z.string().url().max(500).nullable().optional(),
    mvp_ready: z.boolean().optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, { message: 'No fields to update' })

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

    const d = parsed.data
    const updatePayload: Record<string, unknown> = {}
    if (d.status !== undefined) updatePayload.status = d.status
    if (d.decision_reason !== undefined) updatePayload.decision_reason = d.decision_reason ?? null
    if (d.pipeline_stage !== undefined) updatePayload.pipeline_stage = d.pipeline_stage
    if (d.monetisation_lane !== undefined) updatePayload.monetisation_lane = d.monetisation_lane
    if (d.engine_cluster !== undefined) updatePayload.engine_cluster = d.engine_cluster
    if (d.build_status !== undefined) updatePayload.build_status = d.build_status
    if (d.mvp_url !== undefined) updatePayload.mvp_url = d.mvp_url
    if (d.mvp_ready !== undefined) updatePayload.mvp_ready = d.mvp_ready
    if (d.archived !== undefined) {
      updatePayload.archived_at = d.archived ? new Date().toISOString() : null
    }
    if (d.inbox !== undefined) updatePayload.inbox = d.inbox

    const isTerminalDecision =
      d.status === 'redesign-to-fit' ||
      d.status === 'personal-interest-override' ||
      d.status === 'kill'
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
