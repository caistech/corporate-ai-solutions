// The ONE methodology_hypothesis_cards creation path.
//
// Factored out of POST /api/methodology/cards (cards/route.ts) so the route AND the
// review-intake (new-ideas/create/route.ts) enroll a card through the SAME upsert —
// not two copies of the SQL. enrollMethodologyCard (enroll-card.ts) is dead code and
// is NOT used; this is the live mechanism (the same upsert AddChosenProduct triggers).
//
// Upsert on product_slug (UNIQUE): latest dialogue wins; cockpit fields are written
// only when provided so a re-post never clobbers operator-set build_status/mvp_url.
// Intake bookkeeping (intake_source / inbox / override) is written only on CREATE.
// Idempotent — safe to re-run for the same slug.
//
// The table has no FKs and every non-product_slug column defaults (hypothesis_rows
// '[]', status 'dialogue-complete', features '{}'), so a minimal { product_slug }
// input is a complete, valid row — which is all loadCardScore (readiness.ts:27) needs.

import type { SupabaseClient } from '@supabase/supabase-js'

export interface MethodologyCardUpsertInput {
  product_slug: string
  origin_summary?: string | null
  original_end_user?: string | null
  hypothesis_rows?: unknown[]
  status?: 'ideation' | 'dialogue-complete'
  pipeline_stage?: string
  monetisation_lane?: string
  engine_cluster?: string
  build_status?: string
  mvp_url?: string
  mvp_ready?: boolean
  build_type?: string
  idea_card?: Record<string, string>
  // Intake bookkeeping — only applied on CREATE.
  cockpit_intake?: boolean
  intake_source?: 'operator' | 'ideation-agent'
  intake_override_reason?: string
}

export async function upsertMethodologyCard(
  supabase: SupabaseClient,
  input: MethodologyCardUpsertInput,
): Promise<{ card: Record<string, unknown> | null; isNew: boolean }> {
  // New card vs re-post — drives the create-only intake bookkeeping below.
  const { data: existing } = await supabase
    .from('methodology_hypothesis_cards')
    .select('id')
    .eq('product_slug', input.product_slug)
    .maybeSingle()
  const isNew = !existing

  const fromIdeationAgent = input.intake_source === 'ideation-agent'
  const overrideReason = input.intake_override_reason?.trim() || undefined

  const upsertRow: Record<string, unknown> = {
    product_slug: input.product_slug,
    origin_summary: input.origin_summary ?? null,
    original_end_user: input.original_end_user ?? null,
    hypothesis_rows: input.hypothesis_rows ?? [],
    status: input.status ?? 'dialogue-complete',
  }
  // Intake-gate bookkeeping — only on CREATE, so a re-post never clobbers the
  // origin/inbox state of an existing card (the columns default on the row).
  if (isNew) {
    upsertRow.intake_source = fromIdeationAgent ? 'ideation-agent' : 'operator'
    upsertRow.inbox = fromIdeationAgent // agent deposits land in the inbox
    if (overrideReason && input.cockpit_intake && !fromIdeationAgent) {
      upsertRow.intake_override_reason = overrideReason
      upsertRow.intake_override_at = new Date().toISOString()
    }
  }
  // Cockpit fields — only written when provided (absent keys stay at column defaults).
  if (input.pipeline_stage !== undefined) upsertRow.pipeline_stage = input.pipeline_stage
  if (input.monetisation_lane !== undefined) upsertRow.monetisation_lane = input.monetisation_lane
  if (input.engine_cluster !== undefined) upsertRow.engine_cluster = input.engine_cluster
  if (input.build_status !== undefined) upsertRow.build_status = input.build_status
  if (input.mvp_url !== undefined) upsertRow.mvp_url = input.mvp_url
  if (input.mvp_ready !== undefined) upsertRow.mvp_ready = input.mvp_ready
  if (input.build_type !== undefined) upsertRow.build_type = input.build_type
  if (input.idea_card !== undefined) upsertRow.idea_card = input.idea_card

  const { data, error } = await supabase
    .from('methodology_hypothesis_cards')
    .upsert(upsertRow, { onConflict: 'product_slug' })
    .select()
    .single()

  if (error) {
    throw new Error(`upsertMethodologyCard("${input.product_slug}"): ${error.message}`)
  }
  return { card: data, isNew }
}
