-- Pipeline Tracker — initial schema
-- See docs/claude_code_directive_pipeline_tracker.md for the full directive.
-- Tables are namespaced under the `pipeline` schema so they never collide with marketing-site tables.

CREATE SCHEMA IF NOT EXISTS pipeline;

-- ============================================================
-- contacts
-- ============================================================

CREATE TABLE IF NOT EXISTS pipeline.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name text NOT NULL,
  email text,
  linkedin_url text,
  company text,
  role text,

  source text NOT NULL CHECK (source IN (
    'cold_email_out', 'cold_email_in', 'linkedin', 'referral',
    'portfolio_inbound', 'event', 'youtube', 'podcast', 'other'
  )),

  what_they_want text,
  what_i_want text,

  status text NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'active', 'waiting_on_them', 'waiting_on_me',
    'paused', 'won', 'lost', 'archived'
  )),
  priority int NOT NULL DEFAULT 2 CHECK (priority IN (1, 2, 3)),

  next_action text,
  next_action_due date,

  notes text,
  tags text[] NOT NULL DEFAULT '{}'::text[],

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_contacts_owner ON pipeline.contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_contacts_status ON pipeline.contacts(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_contacts_due ON pipeline.contacts(next_action_due);
CREATE INDEX IF NOT EXISTS idx_pipeline_contacts_tags ON pipeline.contacts USING GIN(tags);

-- ============================================================
-- events (append-only history)
-- ============================================================

CREATE TABLE IF NOT EXISTS pipeline.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES pipeline.contacts(id) ON DELETE CASCADE,

  event_type text NOT NULL CHECK (event_type IN (
    'sent_email', 'received_email',
    'linkedin_msg_sent', 'linkedin_msg_received',
    'call', 'meeting', 'note', 'task_done', 'status_change'
  )),
  summary text NOT NULL,
  body text,

  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_events_contact ON pipeline.events(contact_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_events_owner ON pipeline.events(owner_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_events_occurred ON pipeline.events(occurred_at DESC);

-- ============================================================
-- audit_log (Platform Trust pattern)
-- ============================================================

CREATE TABLE IF NOT EXISTS pipeline.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  entity_type text NOT NULL CHECK (entity_type IN ('contact', 'event')),
  entity_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
  diff jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_audit_actor ON pipeline.audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_audit_entity ON pipeline.audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_audit_created ON pipeline.audit_log(created_at DESC);

-- ============================================================
-- Expose the pipeline schema via PostgREST
-- ============================================================
-- The Supabase JS client uses .schema('pipeline').from('...') to target these tables.
-- This requires the pipeline schema to be included in the project's exposed schemas.
-- Run in the Supabase dashboard SQL editor if needed, or via:
--   ALTER ROLE authenticator SET pgrst.db_schemas TO 'public,pipeline';
-- Then NOTIFY pgrst, 'reload config';
--
-- Or set via Supabase dashboard → Project Settings → API → Exposed schemas → add 'pipeline'.

GRANT USAGE ON SCHEMA pipeline TO authenticated, anon, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA pipeline TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA pipeline GRANT ALL ON TABLES TO authenticated, service_role;
