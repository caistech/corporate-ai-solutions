/**
 * POST /api/admin/pipeline/new-ideas/admit
 *
 * THE GATE — deterministic, identical for all, membership granted atomically (PR1).
 *
 * Takes the coach's resolved 14 graded fields + feasibility, then gates:
 *   1. FIELD PRESENCE (existing) — proof-of-demand, the 14 fields, a valid benefit mode.
 *   2. URL-DERIVED BUILD MARKERS (new) — for a product carrying a live URL, the gate
 *      RE-DERIVES P1/P2/P3 server-side from the build (Rider 3) and requires them to PASS
 *      (deal-findrs reseller → P2 fail → bounced). DEPLOYMENT-PINNED (Rider 2): it resolves the
 *      project's current prod deployment via the Vercel API and derives from the IMMUTABLE
 *      <project>-<hash>.vercel.app URL — not the mutable alias — so identical deployment +
 *      answers → identical verdict. UNPINNED FALLBACK: no vercel_project / resolve fails ⇒ NOT
 *      pinned ⇒ NO build-marker gating (treated as no-URL for markers; never claimed pinned).
 *      The gate NEVER trusts client/coach-passed markers and NEVER judges quality (anti-flake).
 *   3. (review with full identifiers) FORMAT/LIVE identifier validation via the shared validator.
 *
 * PASS → write the spec, then admit_product(...) RPC flips is_draft + creates the card (Z) +
 * the manifest row (Y) ATOMICALLY (Rider 4, invariant #1). FAIL → 422, ZERO writes (no card, no
 * manifest, not in portfolio — bounced to coaching).
 *
 * PR1 SCOPE HONESTY: this does NOT enforce "bare assertion → fail" for NO-URL products — that
 * needs the KB evidence source (PR2). In PR1 a no-URL product passes on field presence alone.
 *
 * Schema-verified against product_validation_status (2026-06-04). Do NOT add columns/flags beyond
 * the lists below — the 6 ICP fields have no has_ flag (writing one 500s), icp_prospect_type is a
 * stale orphan, and demand_tier / distributor_benefit_mode are enforced by live CHECK constraints.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { deriveFieldsFromLiveUrl } from '@/lib/methodology/live-derive'
import { resolveProdDeployment } from '@/lib/methodology/vercel-deployment'
import { validateIdentifiers, type Identifiers } from '@/lib/methodology/identifier-validation'

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

    // Field-presence failures short-circuit (zero writes) before any live work.
    if (blockers.length > 0) {
      return NextResponse.json({ admitted: false, blockers }, { status: 422 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // --- Existence + captured identifiers (finding #3: admit must carry refs to the manifest) ---
    const { data: rowData, error: rowErr } = await supabase
      .from('product_validation_status')
      .select('product_slug, mvp_url, vercel_project, supabase_ref, github_repo, ecc_project_id, display_name')
      .eq('product_slug', productSlug)
      .maybeSingle()
    if (rowErr) {
      console.error('[admit] row lookup failed', rowErr.message)
      return NextResponse.json({ admitted: false, error: rowErr.message }, { status: 500 })
    }
    if (!rowData) {
      return NextResponse.json({ admitted: false, error: 'idea row not found' }, { status: 404 })
    }
    const rec = rowData as Record<string, string | null>
    const liveUrl = (rec.mvp_url ?? '').trim()
    const vercelProject = (rec.vercel_project ?? '').trim()
    const supabaseRef = (rec.supabase_ref ?? '').trim()

    // --- URL-derived build markers (deployment-pinned re-derive) ---
    const gateBlockers: string[] = []
    let pinned = false
    let deploymentId: string | null = null

    if (liveUrl) {
      // TRUE pin: resolve the prod deployment + derive from its IMMUTABLE URL (Rider 2).
      const resolved = vercelProject ? await resolveProdDeployment(vercelProject) : null
      if (resolved) {
        pinned = true
        deploymentId = resolved.deploymentId
        const derived = await deriveFieldsFromLiveUrl(resolved.immutableUrl)
        const failing = derived.preHard
          .filter((p) => ['P1', 'P2', 'P3'].includes(p.code) && p.status !== 'pass')
          .map((p) => `${p.code}: ${p.evidence ?? 'fail'}`)
        if (failing.length > 0) {
          gateBlockers.push(`build markers failed (deployment ${deploymentId}): ${failing.join(' · ')}`)
        }
      } else {
        // UNPINNED fallback — cannot pin (no vercel_project or Vercel resolve failed). Per Rider 2
        // we do NOT gate on the mutable live alias (that reintroduces non-determinism); the product
        // passes the marker leg ungated, and the verdict is NOT claimed deployment-pinned.
        console.warn(`[admit] ${productSlug}: live URL present but not deployment-pinnable — marker gate skipped (unpinned)`)
      }

      // For a fully-identified review submission, format/live-validate the five identifiers
      // (Rider 6, the shared validator). Optional asset fields ⇒ only when all five are present.
      const id: Identifiers = {
        liveUrl,
        githubRepo: (rec.github_repo ?? '').trim(),
        vercelProject,
        supabaseRef,
        eccProjectId: (rec.ecc_project_id ?? '').trim(),
      }
      if (Object.values(id).every((v) => v !== '')) {
        gateBlockers.push(...(await validateIdentifiers(id)))
      }
    }

    if (gateBlockers.length > 0) {
      // FAIL → 422, ZERO membership writes (invariant #1: fail ⇒ no card, no manifest).
      return NextResponse.json({ admitted: false, blockers: gateBlockers, pinned, deploymentId }, { status: 422 })
    }

    // --- PASS: write the spec (NOT is_draft — the RPC owns the atomic flip), then admit_product ---
    const specRow: Record<string, unknown> = {
      ...Object.fromEntries(GRADED_FIELDS.map((f) => [f, fields[f]])),
      ...Object.fromEntries(HAS_FLAG_FIELDS.map((f) => [`has_${f}`, true])),
      feasibility: {
        proof_of_demand: feasibility.proof_of_demand,
        demand_tier: feasibility.demand_tier,
        why_now: feasibility.why_now ?? null,
        status_quo: feasibility.status_quo ?? null,
        product_type: feasibility.product_type ?? null,
        distributor_benefit_mode: feasibility.distributor_benefit_mode,
      },
      last_validation_update: new Date().toISOString(),
    }
    if (present(displayName)) specRow.display_name = displayName

    const { error: specErr } = await supabase
      .from('product_validation_status')
      .update(specRow)
      .eq('product_slug', productSlug)
    if (specErr) {
      console.error('[admit] spec write failed', specErr.message)
      return NextResponse.json({ admitted: false, error: specErr.message }, { status: 500 })
    }

    // Atomic membership: flip is_draft + card (Z) + manifest (Y) in one transaction (Rider 4).
    const displayName2 = (present(displayName) ? displayName : rec.display_name) ?? productSlug
    const { error: rpcErr } = await supabase.rpc('admit_product', {
      p_slug: productSlug,
      p_vercel_project: vercelProject || null,
      p_supabase_ref: supabaseRef || null,
      p_category: 'product',
      p_display_name: displayName2,
    })
    if (rpcErr) {
      // Spec is written but membership is NOT — product stays draft, not in portfolio (safe side).
      // Re-running admit is idempotent and recovers (invariant #1 holds: no torn membership).
      console.error('[admit] admit_product RPC failed', rpcErr.message)
      return NextResponse.json(
        { admitted: false, error: `membership grant failed — re-run admit to retry (idempotent): ${rpcErr.message}` },
        { status: 500 },
      )
    }

    return NextResponse.json({ admitted: true, productSlug, pinned, deploymentId })
  } catch (error) {
    console.error('[admit] error', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}