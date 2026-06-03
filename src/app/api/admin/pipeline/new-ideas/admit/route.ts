/**
 * POST /api/admin/pipeline/new-ideas/admit
 *
 * The ADMISSION write path. Takes the coach's resolved 14 graded fields + the
 * feasibility context, validates the admission gate, and writes the row, flipping
 * INCOMPLETE-SPEC -> in-pipeline (is_draft=false).
 *
 * Schema-verified against product_validation_status (2026-06-04). Do NOT add
 * columns/flags beyond the lists below — the 6 ICP fields have no has_ flag (writing
 * one 500s), icp_prospect_type is a stale orphan (never write it), and demand_tier /
 * distributor_benefit_mode are enforced by live CHECK constraints.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// The 14 graded text columns (exact names).
const GRADED_FIELDS = [
  'promise',
  'distributor',
  'end_user',
  'friction',
  'distributor_outcomes',
  'end_user_outcomes',
  'core_mechanism',
  'icp_geography',
  'icp_partner_type',   // canonical prospect-type column (label "Prospect Type"; storage "partner" for lineage)
  'icp_buyer_title',
  'icp_verticals',
  'icp_company_size',
  'icp_stage',
  'exclusions',
] as const

// The 8 fields that HAVE a has_<field> flag column. Set true on presence.
const HAS_FLAG_FIELDS = [
  'promise',
  'distributor',
  'end_user',
  'friction',
  'core_mechanism',
  'distributor_outcomes',
  'end_user_outcomes',
  'icp_geography',
] as const
// The other 6 (icp_partner_type, icp_buyer_title, icp_verticals, icp_company_size,
// icp_stage, exclusions) have NO has_ column — writing one 500s.

const DEMAND_TIERS = ['intuition', 'anecdote', 'article', 'data', 'traction'] as const
const BENEFIT_MODES = ['paid', 'value-add'] as const

type GradedField = (typeof GRADED_FIELDS)[number]

interface Feasibility {
  proof_of_demand: string
  demand_tier: string
  why_now?: string
  status_quo?: string
  product_type?: string
  distributor_benefit_mode: string
}

interface AdmitBody {
  productSlug: string
  displayName?: string
  fields: Partial<Record<GradedField, string>>
  feasibility: Feasibility
}

function present(v: unknown): boolean {
  return v !== null && v !== undefined && String(v).trim() !== ''
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AdmitBody
    const { productSlug, displayName, fields, feasibility } = body

    if (!productSlug) {
      return NextResponse.json({ error: 'productSlug required' }, { status: 400 })
    }
    if (!fields || !feasibility) {
      return NextResponse.json({ error: 'fields and feasibility required' }, { status: 400 })
    }

    // --- Admission gate (legible blockers) ---
    const blockers: string[] = []

    // 1. Proof of demand — HARD gate (any tier).
    if (!present(feasibility.proof_of_demand)) {
      blockers.push('no proof of demand')
    }
    if (!DEMAND_TIERS.includes(feasibility.demand_tier as (typeof DEMAND_TIERS)[number])) {
      blockers.push(`demand_tier must be one of ${DEMAND_TIERS.join(', ')}`)
    }

    // 2. All 14 graded fields present (robustness-bar enforcement is the coach's job
    //    upstream; here we hard-check presence — an empty field is INCOMPLETE-SPEC).
    const below = GRADED_FIELDS.filter((f) => !present(fields[f]))
    if (below.length > 0) {
      blockers.push(`fields below bar: ${below.join(', ')}`)
    }

    // 3. Distributor relationship coherence — benefit mode must be set + valid.
    //    (The end-user-love -> distributor dependency is enforced conversationally by
    //    the coach; the durable signal of a resolved node 7(b) is a valid benefit mode.)
    if (!BENEFIT_MODES.includes(feasibility.distributor_benefit_mode as (typeof BENEFIT_MODES)[number])) {
      blockers.push('distributor benefit not grounded (distributor_benefit_mode unset)')
    }

    if (blockers.length > 0) {
      return NextResponse.json({ admitted: false, blockers }, { status: 422 })
    }

    // --- Build the write payload ---
    const row: Record<string, unknown> = {
      // 14 graded fields
      ...Object.fromEntries(GRADED_FIELDS.map((f) => [f, fields[f]])),
      // 8 has_ flags (skip the 6 without a column)
      ...Object.fromEntries(HAS_FLAG_FIELDS.map((f) => [`has_${f}`, true])),
      // feasibility context (enum keys validated above; CHECK constraints are the backstop)
      feasibility: {
        proof_of_demand: feasibility.proof_of_demand,
        demand_tier: feasibility.demand_tier,
        why_now: feasibility.why_now ?? null,
        status_quo: feasibility.status_quo ?? null,
        product_type: feasibility.product_type ?? null,
        distributor_benefit_mode: feasibility.distributor_benefit_mode,
      },
      // admission flip: INCOMPLETE-SPEC -> in-pipeline
      is_draft: false,
      last_validation_update: new Date().toISOString(),
    }
    if (present(displayName)) row.display_name = displayName // display_name is NOT NULL; only overwrite if provided

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Update the existing INCOMPLETE-SPEC row (created by …/new-ideas/create).
    const { data, error } = await supabase
      .from('product_validation_status')
      .update(row)
      .eq('product_slug', productSlug)
      .select('product_slug')
      .single()

    if (error) {
      // A CHECK-constraint rejection (bad enum) surfaces here as a legible DB error.
      console.error('[admit] update failed', error.message)
      return NextResponse.json({ admitted: false, error: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ admitted: false, error: 'idea row not found' }, { status: 404 })
    }

    return NextResponse.json({ admitted: true, productSlug: data.product_slug })
  } catch (error) {
    console.error('[admit] error', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}