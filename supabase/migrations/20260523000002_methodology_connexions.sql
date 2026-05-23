-- Methodology Phase Zero-B Connexions integration — additive columns on
-- the campaign row + voice channel on the response row.
--
-- Per docs/DISTRIBUTOR_DISCOVERY_METHODOLOGY.md Session 3: Connexions is
-- the structured-capture surface for methodology validation. Each
-- methodology campaign gets a per-campaign Connexions panel created via
-- /api/methodology/cards/[slug]/validate. The panel URL is stored here
-- so the admin detail view + IP sequencer can render it.
--
-- Idempotent.

ALTER TABLE methodology_campaigns
  ADD COLUMN IF NOT EXISTS connexions_panel_slug TEXT;

ALTER TABLE methodology_campaigns
  ADD COLUMN IF NOT EXISTS connexions_panel_url TEXT;

-- Methodology responses can now arrive via Connexions voice interviews.
-- Extend the channel CHECK to include 'voice'.
DO $$ BEGIN
  ALTER TABLE methodology_responses DROP CONSTRAINT IF EXISTS methodology_responses_response_channel_check;
  ALTER TABLE methodology_responses
    ADD CONSTRAINT methodology_responses_response_channel_check
    CHECK (response_channel IS NULL OR response_channel IN ('linkedin', 'email', 'voice'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
