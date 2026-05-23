-- BYOK Factory — form-gate inquiries + anonymous install telemetry.
-- Part A1 + A2 of docs/BYOK_CONVERSION_PLAYBOOK.md.
--
-- Two tables in one migration because they're a paired surface — the form
-- gate captures the human (byok_inquiries); the telemetry endpoint captures
-- the install (byok_installs). Both feed the same dashboard view of "who's
-- showing up vs. who's actually deploying."
--
-- Service-role-only writes per the global CLAUDE.md RLS rule. No anon-role
-- policy needed — the public form posts via /api/byok-inquiry (service-role
-- client) and the public telemetry POST hits /api/byok-telemetry/install
-- (same).

-- ---------------------------------------------------------------------------
-- byok_inquiries — form-gate captures from /marketplace/<slug>/byok
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS byok_inquiries (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at   TIMESTAMPTZ DEFAULT NOW(),

    -- Product the visitor wants to BYOK
    product_slug TEXT NOT NULL,

    -- Four-field form (Decision 2 in project_byok_conversion_template_decisions)
    name         TEXT NOT NULL,
    email        TEXT NOT NULL,
    phone        TEXT,
    intent       TEXT,

    -- Ops
    status       TEXT DEFAULT 'new', -- 'new' | 'contacted' | 'deployed' | 'cold'
    referrer     TEXT,
    user_agent   TEXT
);

CREATE INDEX IF NOT EXISTS idx_byok_inquiries_email ON byok_inquiries(email);
CREATE INDEX IF NOT EXISTS idx_byok_inquiries_product_slug ON byok_inquiries(product_slug);
CREATE INDEX IF NOT EXISTS idx_byok_inquiries_status ON byok_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_byok_inquiries_created_at ON byok_inquiries(created_at DESC);

ALTER TABLE byok_inquiries ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- byok_installs — anonymous install telemetry (Rule 10 carve-out)
-- ---------------------------------------------------------------------------
-- install_id is a UUID generated on the user's first /setup completion,
-- never derived from any user identifier. No PII columns on this table.
-- Re-sends from the same install update last_seen + version (idempotent
-- via UPSERT in the API route).
CREATE TABLE IF NOT EXISTS byok_installs (
    install_id   UUID PRIMARY KEY,
    tool         TEXT NOT NULL,
    version      TEXT NOT NULL,
    first_seen   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_byok_installs_tool ON byok_installs(tool);
CREATE INDEX IF NOT EXISTS idx_byok_installs_first_seen ON byok_installs(first_seen DESC);

ALTER TABLE byok_installs ENABLE ROW LEVEL SECURITY;
