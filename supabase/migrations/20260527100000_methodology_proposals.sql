-- Build #3 — proposal snapshots. The harness-proposed Gate-0/Gate-2 decision
-- (POST /api/methodology/cards/[slug]/propose) is an LLM scoring pass. Before this
-- table the proposal was EPHEMERAL: lost on reload, no audit trail of "what the
-- machine proposed vs what the operator decided", and every view re-billed the LLM.
--
-- This persists each propose run as a snapshot so the card detail loads the last one,
-- the audit trail survives, and re-scoring is on-demand — THIN_MVP_RUBRIC §6 locked
-- engine policy #7: persist + mark stale (a newer evidence count marks the snapshot
-- stale → visible "re-score"), never silently recompute.
--
-- Append-only history (one row per propose run; the cockpit shows the latest).
-- Admin-surface-only: RLS on, service-role bypasses, no anon. Additive + idempotent.

CREATE TABLE IF NOT EXISTS methodology_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    card_id UUID NOT NULL REFERENCES methodology_hypothesis_cards(id) ON DELETE CASCADE,
    product_slug TEXT NOT NULL,  -- denormalized for direct lookup by slug

    -- The "shown" proposal (evidence pass when present, else hypothesis) — extracted
    -- scalars for quick display + audit queries without unpacking the JSON.
    shown_mode TEXT NOT NULL CHECK (shown_mode IN ('hypothesis', 'evidence')),
    band TEXT NOT NULL CHECK (band IN ('GO', 'REDESIGN', 'NO-GO')),
    composite NUMERIC(4,1) NOT NULL,
    onsell_gate_passed BOOLEAN NOT NULL,
    recommended_status TEXT,  -- the cockpit decision the proposal pre-fills (null if unmapped)

    -- Staleness driver: the interview count the score was computed against. The loader
    -- compares this to the card's CURRENT response count; a mismatch marks the snapshot
    -- stale ("re-score") rather than silently recomputing.
    interview_total INT NOT NULL DEFAULT 0,

    -- Full ProposeResponse payload (hypothesis + evidence + interview_counts + any
    -- evidence_error) for fidelity — the cockpit re-renders the exact proposal it persisted.
    payload JSONB NOT NULL,

    -- Audit only — defaults to 'system' (the route is service-role; the operator is
    -- already ADMIN_EMAILS-gated by middleware before reaching it). Matches pipeline_gates.
    proposed_by TEXT NOT NULL DEFAULT 'system'
);

-- Newest-first lookup per card / per slug — every consumer reads "latest proposal for X".
CREATE INDEX IF NOT EXISTS idx_methodology_proposals_card
  ON methodology_proposals(card_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_methodology_proposals_slug
  ON methodology_proposals(product_slug, created_at DESC);

ALTER TABLE methodology_proposals ENABLE ROW LEVEL SECURITY;
