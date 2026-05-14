-- Pipeline Tracker — Connexions intake bridge
-- Adds the source values + event type needed for the Connexions panel to write
-- prospect records into pipeline.contacts via /api/pipeline/intake.
--
-- Companion TypeScript changes in src/lib/pipeline/constants.ts must add the
-- same values to SOURCES and EVENT_TYPES so the Zod enums + UI labels match
-- the DB CHECK constraint.

-- ============================================================
-- contacts.source CHECK constraint
-- ============================================================
-- The original migration declared this inline on CREATE TABLE, so the constraint
-- name is the Postgres default `contacts_source_check`. Drop + recreate to add
-- the two new values: 'connexions_platform_trust_sprint' (Shape 1 panel) and
-- 'voice_intake' (generic catch-all for future Connexions panels — Shape 3,
-- Shape 6 — to avoid a migration per new panel).

ALTER TABLE pipeline.contacts DROP CONSTRAINT IF EXISTS contacts_source_check;

ALTER TABLE pipeline.contacts ADD CONSTRAINT contacts_source_check CHECK (source IN (
  'cold_email_out',
  'cold_email_in',
  'linkedin',
  'referral',
  'portfolio_inbound',
  'event',
  'youtube',
  'podcast',
  'other',
  'connexions_platform_trust_sprint',
  'voice_intake'
));

-- ============================================================
-- events.event_type CHECK constraint
-- ============================================================
-- Same shape: drop + recreate with the new 'connexions_intake_completed' value.

ALTER TABLE pipeline.events DROP CONSTRAINT IF EXISTS events_event_type_check;

ALTER TABLE pipeline.events ADD CONSTRAINT events_event_type_check CHECK (event_type IN (
  'sent_email',
  'received_email',
  'linkedin_msg_sent',
  'linkedin_msg_received',
  'call',
  'meeting',
  'note',
  'task_done',
  'status_change',
  'connexions_intake_completed'
));
