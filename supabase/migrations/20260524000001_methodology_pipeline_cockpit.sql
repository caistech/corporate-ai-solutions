-- Pipeline cockpit generalisation — turn the methodology hypothesis card from a
-- pure Phase-Zero validation card into a full-pipeline card.
--
-- Adds the cockpit fields per the product-development pipeline:
--   pipeline_stage     — where the card sits in the flow
--   monetisation_lane  — lane assignment (1 paid-SaaS primary … 4 BYOK awareness)
--   engine_cluster     — consolidation-map engine the product belongs to
--   build_status       — none | thin-mvp | fat-mvp | full
--   mvp_url            — the link embedded in research outreach (Gate-1 payload)
--   mvp_ready          — Gate 1: kick-off into IP is blocked until TRUE + mvp_url set
--
-- Gate 2 (demand go/no-go) already lives in the existing `status` enum
-- (validated / redesign-to-fit / personal-interest-override / kill).
-- Additive + idempotent.

ALTER TABLE methodology_hypothesis_cards
  ADD COLUMN IF NOT EXISTS pipeline_stage TEXT NOT NULL DEFAULT 'ideation'
    CHECK (pipeline_stage IN ('ideation','feasibility','validation','go-no-go','build','ship'));

ALTER TABLE methodology_hypothesis_cards
  ADD COLUMN IF NOT EXISTS monetisation_lane TEXT
    CHECK (monetisation_lane IS NULL OR monetisation_lane IN ('1-paid-saas','2-studio','3-contract','4-byok'));

-- voice-coaching | property | outreach | compliance | standalone | (free text for new engines)
ALTER TABLE methodology_hypothesis_cards
  ADD COLUMN IF NOT EXISTS engine_cluster TEXT;

ALTER TABLE methodology_hypothesis_cards
  ADD COLUMN IF NOT EXISTS build_status TEXT NOT NULL DEFAULT 'none'
    CHECK (build_status IN ('none','thin-mvp','fat-mvp','full'));

ALTER TABLE methodology_hypothesis_cards
  ADD COLUMN IF NOT EXISTS mvp_url TEXT;

ALTER TABLE methodology_hypothesis_cards
  ADD COLUMN IF NOT EXISTS mvp_ready BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_methodology_cards_stage ON methodology_hypothesis_cards(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_methodology_cards_lane ON methodology_hypothesis_cards(monetisation_lane);
