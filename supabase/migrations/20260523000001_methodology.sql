-- Distributor-discovery methodology — Hypothesis Cards, IP campaign refs, classified responses.
-- Anchored to docs/DISTRIBUTOR_DISCOVERY_METHODOLOGY.md (Phase Zero backfill).
--
-- Three tables:
--   methodology_hypothesis_cards : one per portfolio product (constants.ts PLATFORMS slug)
--   methodology_campaigns        : 0..2 per card (target-user + distributor-candidate),
--                                  each mirrors an IP-side methodology_campaigns row
--   methodology_responses        : per-respondent rows; classified by LLM in Session 2
--
-- All three are admin-surface-only — service-role bypasses RLS; no anon policies.

-- ---------------------------------------------------------------------------
-- methodology_hypothesis_cards
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS methodology_hypothesis_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    product_slug TEXT NOT NULL UNIQUE,  -- matches constants.ts PLATFORMS[].slug

    -- Surfaced from dialogue (Phase Zero-A)
    origin_summary TEXT,
    original_end_user TEXT,

    -- Hypothesis rows — array of {field, hypothesis_text, validation_status, last_updated}
    -- field examples: 'original_end_user', 'alternative_X', 'distributor_X', ...
    -- validation_status: 'pending' | 'in-flight' | 'confirmed' | 'contradicted' | 'refined'
    hypothesis_rows JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Synthesis state
    status TEXT NOT NULL DEFAULT 'dialogue-complete'
        CHECK (status IN (
            'dialogue-complete',         -- Hypothesis Card captured; validation not yet started
            'validation-in-flight',       -- campaigns sourcing / sending / collecting
            'validated',                  -- all hypothesis rows have validation_status final
            'redesign-to-fit',            -- decision made: redesign with identified distributor
            'personal-interest-override', -- no distributor; Model B pricing applies
            'kill'                        -- no distributor + no personal interest; archive
        )),

    decision_reason TEXT,
    decision_made_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_methodology_cards_status ON methodology_hypothesis_cards(status);
CREATE INDEX IF NOT EXISTS idx_methodology_cards_updated_at ON methodology_hypothesis_cards(updated_at DESC);

ALTER TABLE methodology_hypothesis_cards ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- methodology_campaigns
-- Mirror of IP-side methodology_campaigns row. Stored here so CAS doesn't
-- need to round-trip to IP for read-only display.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS methodology_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    card_id UUID NOT NULL REFERENCES methodology_hypothesis_cards(id) ON DELETE CASCADE,
    campaign_type TEXT NOT NULL CHECK (campaign_type IN ('target-user', 'distributor-candidate')),

    -- IP-side identifier (returned from POST /api/methodology/campaigns on IP)
    ip_campaign_id UUID,

    -- Cached config (mirrors what was sent to IP)
    icp_description TEXT NOT NULL,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    expected_response_count INT DEFAULT 30,

    status TEXT NOT NULL DEFAULT 'configured'
        CHECK (status IN ('configured', 'sourcing', 'sending', 'collecting', 'synthesized', 'paused')),

    -- One campaign per (card, campaign_type) — enforce
    UNIQUE (card_id, campaign_type)
);

CREATE INDEX IF NOT EXISTS idx_methodology_campaigns_card ON methodology_campaigns(card_id);
CREATE INDEX IF NOT EXISTS idx_methodology_campaigns_ip ON methodology_campaigns(ip_campaign_id);

ALTER TABLE methodology_campaigns ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- methodology_responses
-- Raw responses pulled from IP, then classified by LLM.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS methodology_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    campaign_id UUID NOT NULL REFERENCES methodology_campaigns(id) ON DELETE CASCADE,

    -- Source identifiers (from IP)
    ip_partner_id TEXT,
    prospect_name TEXT,
    prospect_role TEXT,
    prospect_org TEXT,

    -- Raw response
    response_received_at TIMESTAMPTZ,
    response_raw_text TEXT NOT NULL,
    response_channel TEXT CHECK (response_channel IN ('linkedin', 'email')),

    -- LLM classification (Session 2 wires this)
    classification TEXT CHECK (classification IN (
        'confirms', 'contradicts', 'refines', 'off-topic', 'wants-more-info'
    )),
    classification_reasoning TEXT,
    -- per_question_signal: { "<question_index>": "confirms" | "contradicts" | ... }
    per_question_signal JSONB,
    classified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_methodology_responses_campaign ON methodology_responses(campaign_id);
CREATE INDEX IF NOT EXISTS idx_methodology_responses_classification ON methodology_responses(classification);

ALTER TABLE methodology_responses ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_methodology_cards_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS methodology_cards_updated_at ON methodology_hypothesis_cards;
CREATE TRIGGER methodology_cards_updated_at
  BEFORE UPDATE ON methodology_hypothesis_cards
  FOR EACH ROW EXECUTE FUNCTION set_methodology_cards_updated_at();

DROP TRIGGER IF EXISTS methodology_campaigns_updated_at ON methodology_campaigns;
CREATE TRIGGER methodology_campaigns_updated_at
  BEFORE UPDATE ON methodology_campaigns
  FOR EACH ROW EXECUTE FUNCTION set_methodology_cards_updated_at();
