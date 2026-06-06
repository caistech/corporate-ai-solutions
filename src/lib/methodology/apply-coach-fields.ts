// applyCoachFields — the SOLE live writer of coach-captured fields into
// product_validation_status (docs/VOICE_COACH_PLAN.md §3, BLOCKER-1 fix).
//
// There is no pre-existing field-writer to wrap: the turn API is conversation-only and the
// admit gate is the only writer today. This function becomes the single writer for all three
// coach paths — the voice `save_field` tool, the text-fallback extractor, and the completion
// backstop — so field-writing can't drift per-path.
//
// The schema (14 graded fields, the 8 has_ flags, the 6 feasibility keys, the two enums)
// MIRRORS the admit gate exactly (admit/route.ts). The admit gate stays byte-for-byte
// unchanged (the invariant); these constants are duplicated here deliberately and the
// apply-coach-fields tests pin them so drift is caught.

import type { SupabaseClient } from '@supabase/supabase-js'

// The 14 graded text columns (exact names — mirror admit/route.ts GRADED_FIELDS).
export const GRADED_FIELDS = [
  'promise',
  'distributor',
  'end_user',
  'friction',
  'distributor_outcomes',
  'end_user_outcomes',
  'core_mechanism',
  'icp_geography',
  'icp_partner_type',
  'icp_buyer_title',
  'icp_verticals',
  'icp_company_size',
  'icp_stage',
  'exclusions',
] as const

// The 8 fields that HAVE a has_<field> flag column. Writing a has_ flag for any of the other
// 6 graded fields 500s (admit/route.ts:65-66), so the set is closed.
export const HAS_FLAG_FIELDS = [
  'promise',
  'distributor',
  'end_user',
  'friction',
  'core_mechanism',
  'distributor_outcomes',
  'end_user_outcomes',
  'icp_geography',
] as const

// Feasibility lives in a single JSONB column; these are its keys. Two are enum-constrained
// by live CHECK constraints (demand_tier, distributor_benefit_mode); the rest are free text.
export const FEASIBILITY_FIELDS = [
  'proof_of_demand',
  'demand_tier',
  'why_now',
  'status_quo',
  'product_type',
  'distributor_benefit_mode',
] as const

export const DEMAND_TIERS = ['intuition', 'anecdote', 'article', 'data', 'traction'] as const
export const BENEFIT_MODES = ['paid', 'value-add'] as const

export type GradedField = (typeof GRADED_FIELDS)[number]
export type FeasibilityField = (typeof FEASIBILITY_FIELDS)[number]

export interface CoachFieldInput {
  fields?: Record<string, string>
  feasibility?: Record<string, string>
}

/** A merged, validated update ready to write — plus the feasibility patch to merge into the JSONB. */
export interface CoachUpdate {
  /** Top-level column updates (graded columns + has_ flags). */
  columns: Record<string, unknown>
  /** Partial feasibility object to merge into the existing JSONB column (empty if none given). */
  feasibilityPatch: Partial<Record<FeasibilityField, string>>
  /** The field names actually touched (for observability / the readiness strip). */
  touched: string[]
}

/** Thrown on an unknown field name or an invalid enum value — the security boundary (§8). */
export class CoachFieldError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CoachFieldError'
  }
}

const GRADED = new Set<string>(GRADED_FIELDS)
const HAS_FLAG = new Set<string>(HAS_FLAG_FIELDS)
const FEASIBILITY = new Set<string>(FEASIBILITY_FIELDS)

function nonEmpty(v: unknown): v is string {
  return typeof v === 'string' && v.trim() !== ''
}

/**
 * Pure: validate + shape a coach field set into a write. Rejects unknown field names and
 * invalid enum values (CoachFieldError). Does NOT touch the DB — `applyCoachFields` does the
 * read-modify-write of the feasibility JSONB. Only the keys present in `input` are touched, so
 * a partial/resume set never clears unrelated fields or flips unrelated flags.
 */
export function buildCoachUpdate(input: CoachFieldInput): CoachUpdate {
  const columns: Record<string, unknown> = {}
  const feasibilityPatch: Partial<Record<FeasibilityField, string>> = {}
  const touched: string[] = []

  for (const [key, raw] of Object.entries(input.fields ?? {})) {
    if (!GRADED.has(key)) {
      throw new CoachFieldError(`unknown graded field "${key}"`)
    }
    if (!nonEmpty(raw)) {
      // Skip empties rather than clearing a column or setting a flag on blank — the coach only
      // calls save_field once a field reaches bar, so a blank here is a no-op, not a delete.
      continue
    }
    const value = raw.trim()
    columns[key] = value
    if (HAS_FLAG.has(key)) columns[`has_${key}`] = true
    touched.push(key)
  }

  for (const [key, raw] of Object.entries(input.feasibility ?? {})) {
    if (!FEASIBILITY.has(key)) {
      throw new CoachFieldError(`unknown feasibility field "${key}"`)
    }
    if (!nonEmpty(raw)) continue
    const value = raw.trim()
    if (key === 'demand_tier' && !DEMAND_TIERS.includes(value as (typeof DEMAND_TIERS)[number])) {
      throw new CoachFieldError(`invalid demand_tier "${value}" (one of ${DEMAND_TIERS.join(', ')})`)
    }
    if (
      key === 'distributor_benefit_mode' &&
      !BENEFIT_MODES.includes(value as (typeof BENEFIT_MODES)[number])
    ) {
      throw new CoachFieldError(
        `invalid distributor_benefit_mode "${value}" (one of ${BENEFIT_MODES.join(', ')})`,
      )
    }
    feasibilityPatch[key as FeasibilityField] = value
    touched.push(key)
  }

  return { columns, feasibilityPatch, touched }
}

export interface ApplyResult {
  touched: string[]
}

/**
 * Write a coach-captured field set to product_validation_status. The single writer for the
 * voice tool, the text fallback, and the completion backstop. Merges feasibility into the
 * existing JSONB (read-modify-write) so partial saves accrete rather than overwrite.
 *
 * @throws CoachFieldError on an unknown/invalid field (propagate as a 400/tool error).
 */
export async function applyCoachFields(
  supabase: SupabaseClient,
  productSlug: string,
  input: CoachFieldInput,
): Promise<ApplyResult> {
  if (!nonEmpty(productSlug)) throw new CoachFieldError('productSlug required')

  const { columns, feasibilityPatch, touched } = buildCoachUpdate(input)
  if (touched.length === 0) return { touched: [] }

  if (Object.keys(feasibilityPatch).length > 0) {
    const { data: row, error: readErr } = await supabase
      .from('product_validation_status')
      .select('feasibility')
      .eq('product_slug', productSlug)
      .maybeSingle()
    if (readErr) throw new Error(`[applyCoachFields] feasibility read failed: ${readErr.message}`)
    const current = (row?.feasibility as Record<string, unknown> | null) ?? {}
    columns.feasibility = { ...current, ...feasibilityPatch }
  }

  columns.last_validation_update = new Date().toISOString()

  const { error: writeErr } = await supabase
    .from('product_validation_status')
    .update(columns)
    .eq('product_slug', productSlug)
  if (writeErr) throw new Error(`[applyCoachFields] write failed: ${writeErr.message}`)

  return { touched }
}
