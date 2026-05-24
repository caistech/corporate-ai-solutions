-- Cockpit naive-tester fixes — soft-archive + an early 'ideation' card status.
--
-- 1. archived_at: soft-archive a card so it drops out of the default board
--    (with a "show archived" toggle). NULL = active; a timestamp = archived.
-- 2. Extend the status CHECK to allow 'ideation' so a brand-new idea reads as
--    an early/ideation status instead of falsely claiming 'dialogue-complete'
--    (no discovery has happened yet for a fresh idea).
--
-- Additive + idempotent. RLS already enabled on the table (service-role only).

-- 1) Soft-archive column ------------------------------------------------------
ALTER TABLE methodology_hypothesis_cards
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_methodology_cards_archived_at
  ON methodology_hypothesis_cards(archived_at);

-- 2) Allow an early 'ideation' status -----------------------------------------
-- Drop + recreate the status CHECK constraint to include 'ideation'. Guarded so
-- re-running is safe. The constraint name matches Postgres's default for a
-- column-level CHECK on the `status` column.
DO $$
BEGIN
  ALTER TABLE methodology_hypothesis_cards
    DROP CONSTRAINT IF EXISTS methodology_hypothesis_cards_status_check;

  ALTER TABLE methodology_hypothesis_cards
    ADD CONSTRAINT methodology_hypothesis_cards_status_check
    CHECK (status IN (
      'ideation',                   -- fresh idea; no dialogue/discovery yet
      'dialogue-complete',          -- Hypothesis Card captured; validation not yet started
      'validation-in-flight',       -- campaigns sourcing / sending / collecting
      'validated',                  -- all hypothesis rows have validation_status final
      'redesign-to-fit',            -- decision: redesign with identified distributor
      'personal-interest-override', -- no distributor; Model B pricing applies
      'kill'                        -- no distributor + no personal interest; archive
    ));
END $$;
