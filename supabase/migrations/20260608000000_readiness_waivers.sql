-- Per-check readiness waivers — the operator's adjudication overlay on the Gate-1 scorer.
--
-- GOLDEN RULE (Dennis): nothing fails silently. A finding ends fixed / must-fix / needs-you /
-- WAIVED. A waiver is a deliberate, logged operator choice that lifts a finding's effect on the
-- score WITHOUT pretending it passed: the check is excluded from the HARD gate + the weighted
-- denominator (and clears a TOO-MUCH flag), and is surfaced on the card as "waived" with its
-- reason + who waived it. It is the inverse of a silent na/unknown.
--
-- One active waiver per (product_slug, check_code). Lifting sets active=false (keeps the last
-- reason for audit) rather than deleting. Admin-surface-only: RLS on, no anon policies, accessed
-- via the service role after the route's requireOperator gate (same posture as readiness_criteria).
-- Additive + idempotent.

CREATE TABLE IF NOT EXISTS readiness_waivers (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_slug TEXT NOT NULL,
    check_code   TEXT NOT NULL,            -- matches readiness_criteria.code (soft ref, like promise_attributes)
    reason       TEXT NOT NULL,            -- the logged justification (never empty)
    waived_by    TEXT,                     -- operator email who waived
    active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (product_slug, check_code)
);

CREATE INDEX IF NOT EXISTS idx_readiness_waivers_slug ON readiness_waivers(product_slug);
CREATE INDEX IF NOT EXISTS idx_readiness_waivers_active ON readiness_waivers(product_slug, active);

ALTER TABLE readiness_waivers ENABLE ROW LEVEL SECURITY;

-- reuse the methodology updated_at trigger function (present since the cards migration)
DROP TRIGGER IF EXISTS readiness_waivers_updated_at ON readiness_waivers;
CREATE TRIGGER readiness_waivers_updated_at
  BEFORE UPDATE ON readiness_waivers
  FOR EACH ROW EXECUTE FUNCTION set_methodology_cards_updated_at();

COMMENT ON TABLE readiness_waivers IS
  'Operator adjudication overlay on the Gate-1 scorer (score.ts). An active waiver lifts a check''s effect on the gate/score without faking a pass — surfaced as "waived" with reason. Golden rule: deliberate + logged, never a silent na. One active row per (product_slug, check_code); lifting sets active=false.';
