-- Scoring-engine data layer (HARNESS_BUILD_WORKLIST.md #1 — the methodology-harness keystone).
-- Three changes so the cockpit can compute a transparent, per-check Gate-1 readiness score
-- instead of trusting the operator's `mvp_ready` tickbox:
--   1. readiness_criteria.applies_when — the feature tag that puts a CONDITIONAL-* check in
--      scope (source: cais-shared-services/gate-readiness/applicability.json). NULL = always applies.
--   2. methodology_hypothesis_cards.features — which conditional features THIS product has; the
--      scorer marks a CONDITIONAL-* check N/A (not a fail) when its applies_when tag is absent here.
--   3. readiness_results — per-check verdicts (history-preserving, same shape as pipeline_gates).
--      /naive-tester, /voice-auditor and auto-probes write here; the scorer reads the latest
--      verdict per (product_slug, check_code), bound to the live deployment (Delta 2).
-- Same RLS posture as the other methodology tables: RLS on, no anon policies, service-role access.
-- Additive + idempotent.

-- 1. applies_when on the criteria catalogue -----------------------------------
ALTER TABLE readiness_criteria ADD COLUMN IF NOT EXISTS applies_when TEXT;
COMMENT ON COLUMN readiness_criteria.applies_when IS
  'Feature tag (voice|auth|supabase|third-party-content|address-or-abn-fields|email) that puts a CONDITIONAL-* check in scope. NULL = always applies. Source: gate-readiness/applicability.json.';

-- Populate from applicability.json (the 19 CONDITIONAL-* checks). Idempotent; re-running the
-- generated seed (which now carries applies_when) keeps this in sync.
UPDATE readiness_criteria AS rc SET applies_when = v.feature
FROM (VALUES
  ('10','voice'), ('11','voice'), ('13','voice'), ('14','voice'), ('15','voice'),
  ('16','voice'), ('17','voice'), ('18','voice'), ('19','voice'), ('20','voice'),
  ('22','auth'), ('23','auth'), ('24','auth'), ('25','auth'), ('29','auth'),
  ('33','third-party-content'), ('34','address-or-abn-fields'), ('35','email'), ('38','supabase')
) AS v(code, feature)
WHERE rc.code = v.code;

-- 2. features on the card -----------------------------------------------------
ALTER TABLE methodology_hypothesis_cards ADD COLUMN IF NOT EXISTS features TEXT[] NOT NULL DEFAULT '{}';
COMMENT ON COLUMN methodology_hypothesis_cards.features IS
  'Conditional features this product has (voice|auth|supabase|third-party-content|address-or-abn-fields|email). The scorer marks a CONDITIONAL-* check N/A when its applies_when tag is absent here.';

-- 3. readiness_results — per-check verdicts (history-preserving) ---------------
CREATE TABLE IF NOT EXISTS readiness_results (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_slug  TEXT NOT NULL,
    check_code    TEXT NOT NULL REFERENCES readiness_criteria(code),
    status        TEXT NOT NULL CHECK (status IN ('pass', 'fail', 'na')),
    source        TEXT NOT NULL CHECK (source IN ('auto', 'naive-tester', 'voice-auditor', 'judge')),
    evidence      TEXT,                          -- one line: how we know (probe result / report line)
    deployment_id TEXT,                           -- live deployment this verdict is bound to (Delta 2)
    scored_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recorded_by   TEXT NOT NULL DEFAULT 'system'
);

-- the scorer reads the latest verdict per (product_slug, check_code), newest first.
CREATE INDEX IF NOT EXISTS idx_readiness_results_lookup
  ON readiness_results (product_slug, check_code, scored_at DESC);

ALTER TABLE readiness_results ENABLE ROW LEVEL SECURITY;
