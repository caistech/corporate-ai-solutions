-- Pipeline intake WIP gate — MONETISATION_RULES Rule 16 / BUSINESS_MODEL §4 (Gate 0).
--
-- No new MANUAL operator intake is admitted to the methodology pipeline while the
-- board has any untriaged card (not in-research-or-beyond and not terminally
-- decided). This migration adds the columns the gate + its two carve-outs need:
--
--   intake_source          — who created the card:
--                              'operator'       cockpit manual intake (gated)
--                              'ideation-agent' always-on agent deposit (inbox, never gated)
--   inbox                  — TRUE for ideation-agent deposits not yet promoted by the
--                            operator. Inbox cards do NOT count as untriaged.
--   intake_override_reason — the operator's written reason when forcing intake past a
--                            blocked gate (Rule 16 reasoned, logged override).
--   intake_override_at     — when the override was used.
--
-- Additive + idempotent (re-applying is safe). Existing rows default to
-- intake_source='operator', inbox=FALSE — so the seeded backlog counts against the
-- gate (which is the point: it must be triaged before new intake reopens).

ALTER TABLE methodology_hypothesis_cards
  ADD COLUMN IF NOT EXISTS intake_source TEXT NOT NULL DEFAULT 'operator'
    CHECK (intake_source IN ('operator','ideation-agent'));

ALTER TABLE methodology_hypothesis_cards
  ADD COLUMN IF NOT EXISTS inbox BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE methodology_hypothesis_cards
  ADD COLUMN IF NOT EXISTS intake_override_reason TEXT;

ALTER TABLE methodology_hypothesis_cards
  ADD COLUMN IF NOT EXISTS intake_override_at TIMESTAMPTZ;

-- Partial index: the inbox view ("ideas not yet promoted") and the gate query
-- (which excludes inbox) both filter on this.
CREATE INDEX IF NOT EXISTS idx_methodology_cards_inbox
  ON methodology_hypothesis_cards(inbox) WHERE inbox = TRUE;
