-- Reverse Scout — asset-first, push-based licensing-match engine (Stages 1–2).
--
-- Internal operator tool: the founder feeds in a portfolio asset (repo / paste / doc),
-- Stage 1 abstracts it into a Capability Card, Stage 2 strips the domain and re-projects
-- the underlying problem-shape into candidate sectors + non-obvious adjacencies (the moat).
--
-- Stages 3–4 (candidate discovery, disclosure scorer, staged outreach) are intentionally
-- NOT in this migration — build + dogfood the moat first (BUILD_SPEC §1, §9). pgvector /
-- embeddings are likewise deferred: they only earn their place at Stage-3 candidate matching.
--
-- Four tables, all operator-surface-only. RLS is ENABLED with NO policies — the service-role
-- client (used by the /api/admin/reverse-scout routes) bypasses RLS; the anon/cookie role
-- reads back nothing. This mirrors the methodology_* + cost tables in this repo.
--
-- Target ref: the Cockpit instance (tfgtfhwvrswjvkyeyvsp). Verify the linked ref before push.

-- ---------------------------------------------------------------------------
-- reverse_scout_asset — one row per ingested capability (a repo, a paste, a doc)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reverse_scout_asset (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    name TEXT NOT NULL,
    source_type TEXT NOT NULL DEFAULT 'paste'
        CHECK (source_type IN ('repo', 'paste', 'doc')),
    -- A reference to the source (a repo URL, a doc name) — human-readable provenance.
    raw_ref TEXT,
    -- The actual material Stage 1 reasons over (the pasted description / extracted doc text).
    source_text TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_rs_asset_created_at ON reverse_scout_asset(created_at DESC);
ALTER TABLE reverse_scout_asset ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- reverse_scout_capability_card — Stage 1 output (0..1 per asset; latest wins)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reverse_scout_capability_card (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    asset_id UUID NOT NULL REFERENCES reverse_scout_asset(id) ON DELETE CASCADE,

    does_what TEXT NOT NULL,
    -- The reusable primitive underneath the feature set — the thing Stage 2 abstracts.
    primitive TEXT NOT NULL,
    inputs JSONB NOT NULL DEFAULT '[]'::jsonb,          -- string[]
    outputs JSONB NOT NULL DEFAULT '[]'::jsonb,         -- string[]
    integration_surface TEXT,                            -- 'api' | 'embeddable' | 'standalone' | free text
    maturity_level TEXT,                                 -- 'prototype' | 'beta' | 'production' | free text
    dependencies JSONB NOT NULL DEFAULT '[]'::jsonb,    -- string[]
    -- The model's own reasoning — first-class data (the operator is buying the *why*).
    reasoning TEXT
);

CREATE INDEX IF NOT EXISTS idx_rs_card_asset ON reverse_scout_capability_card(asset_id, created_at DESC);
ALTER TABLE reverse_scout_capability_card ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- reverse_scout_pattern — Stage 2 output (0..1 per asset; latest wins)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reverse_scout_pattern (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    asset_id UUID NOT NULL REFERENCES reverse_scout_asset(id) ON DELETE CASCADE,

    -- Move 1: the capability restated as a domain-neutral problem-shape.
    abstract_problem_shape TEXT NOT NULL,
    domain_stripped_desc TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rs_pattern_asset ON reverse_scout_pattern(asset_id, created_at DESC);
ALTER TABLE reverse_scout_pattern ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- reverse_scout_sector_map — Stage 2 re-projection (N rows per pattern)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reverse_scout_sector_map (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    pattern_id UUID NOT NULL REFERENCES reverse_scout_pattern(id) ON DELETE CASCADE,

    sector TEXT NOT NULL,
    -- How far the sector sits from the asset's home domain — the moat is in 'adjacent'/'lateral'.
    adjacency TEXT NOT NULL DEFAULT 'adjacent'
        CHECK (adjacency IN ('core', 'adjacent', 'lateral')),
    -- Concrete rationale for why the problem-shape recurs in this sector (required — no lazy answers).
    rationale TEXT NOT NULL,
    -- 0..1 model confidence the shape genuinely fits this sector.
    confidence NUMERIC(3, 2) NOT NULL DEFAULT 0.5
        CHECK (confidence >= 0 AND confidence <= 1)
);

CREATE INDEX IF NOT EXISTS idx_rs_sector_map_pattern ON reverse_scout_sector_map(pattern_id);
ALTER TABLE reverse_scout_sector_map ENABLE ROW LEVEL SECURITY;
