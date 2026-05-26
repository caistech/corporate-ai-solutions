-- The Pipeline Gate — architectural enforcement of the factory's gates.
-- Design: ~/.gstack/projects/SayFix/dennis-stage-0-foundation-design-...md (APPROVED).
--
-- Two parts:
--   1. pipeline_gates : the gate LEDGER. The single source of truth all three
--      consumers read — the cockpit, cais-shared-services scripts (new-product.mjs),
--      and the operator's Claude Code URL-share hook. A gate PASS lives here; an
--      execution action refuses unless the required PASS is present.
--   2. card additions : build_type (the FIRST gate — routes the gate path),
--      gate2_go (the boolean new-product.mjs / domain purchase / Tier-1 build read),
--      idea_card (the structured intake one-pager, gate-critical fields inside).
--
-- Bright line (Dennis, 2026-05-26, on THIN_MVP_RUBRIC §1): the thin MVP = the whole
-- experience, single-tenant, ZERO scale-infra. So the thin-MVP creator runs EARLY
-- (its live link is the Gate-1 outreach payload); only the SEPARATE multi-tenant /
-- billing / white-label (Tier-1, BUSINESS_MODEL §7) + domain purchase are hard-gated
-- on gate2_go. The gate attaches to "is this multi-tenant/scale infra?", not to
-- "is this new-product.mjs?".
--
-- naive-tester PASS binds to the LIVE production deployment_id (Delta 2), never just
-- the git commit — a stale build or an env-only regression (broken sender) is exactly
-- what a commit-only check misses, and exactly what failed on SayFix.
--
-- Additive + idempotent. Admin-surface-only: RLS on, service-role bypasses, no anon.

-- ---------------------------------------------------------------------------
-- pipeline_gates — the gate ledger
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pipeline_gates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    product_slug TEXT NOT NULL,  -- matches methodology_hypothesis_cards.product_slug

    -- which gate this record is for
    gate TEXT NOT NULL CHECK (gate IN (
        'office-hours',   -- design doc produced
        'ceo-review',     -- gstack-review-log PASS
        'eng-review',     -- gstack-review-log PASS
        'design-review',  -- gstack-review-log PASS
        'gate-1',         -- thin-MVP ready (mvp_url live + standards met)
        'gate-2',         -- demand go/no-go GO (distributor + end-user) — unlocks scale-infra
        'naive-tester',   -- /naive-tester Standards Check PASS, bound to a deployment
        'provisioned'     -- new-product.mjs completed (sender verified + prod deploy READY)
    )),

    status TEXT NOT NULL CHECK (status IN ('pass', 'fail')),

    -- What the PASS is bound to. Reviews bind to a commit/artifact; naive-tester
    -- binds to the LIVE production deployment (Delta 2). Both nullable — the
    -- gate-check module enforces the per-gate binding (naive-tester REQUIRES a
    -- deployment_id match; a redeploy invalidates a prior PASS).
    deployment_id TEXT,
    commit_sha TEXT,
    artifact_ref TEXT,           -- design doc path / review-log id / standards-check report

    reason TEXT,                 -- fail reason, or the logged override justification
    is_override BOOLEAN NOT NULL DEFAULT FALSE,  -- Rule-16-style friction-ful bypass
    recorded_by TEXT NOT NULL DEFAULT 'system'
);

-- Newest-first lookup per (product, gate) — every consumer reads "latest PASS for X".
CREATE INDEX IF NOT EXISTS idx_pipeline_gates_lookup
  ON pipeline_gates(product_slug, gate, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pipeline_gates_deployment
  ON pipeline_gates(product_slug, deployment_id);

ALTER TABLE pipeline_gates ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- card additions — build_type (first gate), gate2_go (scale-infra unlock), idea_card
-- ---------------------------------------------------------------------------

-- The FIRST gate: one tick-box at intake routes the card down a different gate path.
-- product               → office-hours→CEO→eng→design→Gate-1→Gate-2(demand)→build→naive-tester→ship
-- shared-service        → feasibility→eng(+@caistech-first/fork-check)→build→(naive-tester if UI)→publish
-- infra-product-candidate → shared-service path now, re-enters product path at Gate-1/2 when a distributor/demand emerges
ALTER TABLE methodology_hypothesis_cards
  ADD COLUMN IF NOT EXISTS build_type TEXT NOT NULL DEFAULT 'product'
    CHECK (build_type IN ('product', 'shared-service', 'infra-product-candidate'));

-- The scale-infra unlock. FALSE → multi-tenant / billing / white-label / domain purchase
-- are all refused (the thin-MVP creator is NOT gated by this — see bright line above).
ALTER TABLE methodology_hypothesis_cards
  ADD COLUMN IF NOT EXISTS gate2_go BOOLEAN NOT NULL DEFAULT FALSE;

-- The structured intake one-pager (PolicyPilot scoping doc is the canonical exemplar).
-- Gate-critical keys (a gate can't pass while these are blank/hand-wavy): demand_evidence
-- (a named human, not "a market"), architecture (build-vs-buy decided), lane+distributor
-- (Rule 15), decisions_needed (the go/no-go ask).
ALTER TABLE methodology_hypothesis_cards
  ADD COLUMN IF NOT EXISTS idea_card JSONB NOT NULL DEFAULT '{}'::jsonb;
