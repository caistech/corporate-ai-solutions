import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { advancesPastReview, missingGateCritical, missingLabels, poolsCaptured } from '@/lib/methodology/gate-critical'
import { hasPassedGate, recordGate } from '@/lib/methodology/pipeline-gates'
import { KNOWN_FEATURES } from '@/lib/methodology/features'

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
    // The first gate (editable post-intake) + the structured idea-card (office-hours
    // produces/refines it) + the Gate-2 GO that unlocks scale-infra provisioning.
    build_type: z.enum(['product', 'shared-service', 'infra-product-candidate']).optional(),
    idea_card: z.record(z.string(), z.string().max(8000)).optional(),
    gate2_go: z.boolean().optional(),
    // Which conditional features this product has — drives the readiness scorer's
    // applicability (a CONDITIONAL-* check is N/A when its feature isn't here).
    // Enum derives from the single source (KNOWN_FEATURES) so it never drifts from the canon.
    features: z.array(z.enum(KNOWN_FEATURES)).optional(),
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

    // ⚑ GATE-CRITICAL ENFORCEMENT (the cardinal self-audit finding): a card cannot
    // advance past the review gates (to validation+) while its build-type's gate-critical
    // idea-card fields are blank. Makes the UI's claim true. (Gate-1 readiness is no longer
    // an operator field — it derives from the scorer; see lib/methodology/score.ts isMvpReady.)
    if (advancesPastReview(d.pipeline_stage)) {
      const { data: cur } = await supabase
        .from('methodology_hypothesis_cards')
        .select('build_type, idea_card')
        .eq('product_slug', params.slug)
        .maybeSingle()
      const buildType = (d.build_type ?? cur?.build_type) as string | null
      const ideaCard = (d.idea_card ?? cur?.idea_card) as Record<string, string> | null
      const missing = missingGateCritical(buildType, ideaCard)
      if (missing.length) {
        return NextResponse.json(
          {
            error: `Can't advance ${params.slug} to stage ${d.pipeline_stage}: gate-critical fields are blank — ${missingLabels(missing).join(', ')}. Fill them on the idea card first (build type: ${buildType ?? 'product'}).`,
            gate: 'gate-critical-incomplete',
            missing,
          },
          { status: 412 },
        )
      }
    }

    const updatePayload: Record<string, unknown> = {}
    if (d.status !== undefined) updatePayload.status = d.status
    if (d.decision_reason !== undefined) updatePayload.decision_reason = d.decision_reason ?? null
    if (d.pipeline_stage !== undefined) updatePayload.pipeline_stage = d.pipeline_stage
    if (d.monetisation_lane !== undefined) updatePayload.monetisation_lane = d.monetisation_lane
    if (d.engine_cluster !== undefined) updatePayload.engine_cluster = d.engine_cluster
    if (d.build_status !== undefined) updatePayload.build_status = d.build_status
    if (d.mvp_url !== undefined) updatePayload.mvp_url = d.mvp_url
    if (d.build_type !== undefined) updatePayload.build_type = d.build_type
    if (d.idea_card !== undefined) updatePayload.idea_card = d.idea_card
    if (d.gate2_go !== undefined) updatePayload.gate2_go = d.gate2_go
    if (d.features !== undefined) updatePayload.features = d.features
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

    // Build #4 phase 1: when the idea-card edit lands BOTH pool hypotheses, the office-hours
    // pool-discovery dialogue has concluded — record the (long-stubbed) office-hours gate PASS.
    // Once-only (guarded by hasPassedGate) and non-blocking (a gate-write hiccup never fails the PATCH).
    if (d.idea_card !== undefined && poolsCaptured((data?.idea_card ?? null) as Record<string, string> | null)) {
      try {
        if (!(await hasPassedGate(params.slug, 'office-hours'))) {
          await recordGate({
            slug: params.slug,
            gate: 'office-hours',
            status: 'pass',
            artifactRef: 'pool-discovery: distributor + end_user_pool captured on the idea card',
            recordedBy: 'cockpit:pool-discovery',
          })
        }
      } catch (e) {
        console.warn('[PATCH card] office-hours gate record skipped:', (e as Error).message)
      }
    }

    return NextResponse.json({ card: data })
  } catch (e) {
    console.error('API error (PATCH /api/methodology/cards/[slug]):', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
