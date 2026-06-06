-- 20260606000000_convai_voice_coach.sql
-- Vendored from @caistech/elevenlabs-convai/migration.sql for the voice onboarding coach.
-- See docs/VOICE_COACH_PLAN.md. Cockpit instance tfgtfhwvrswjvkyeyvsp ONLY.
--
-- Two deliberate deltas from the upstream template (adversarial review 2026-06-06):
--   1. MINOR-7: the upstream `update_updated_at_column()` is OMITTED here — it already
--      exists byte-identically in 001_initial_schema.sql:249 on this shared instance, and
--      re-CREATE-OR-REPLACEing a portfolio-shared global from a product migration is the
--      hazard the review flagged. We REUSE the existing one (identical body).
--   2. BLOCKER-3: convai_conversations gains `product_slug` so the coach's save_field /
--      card-state tools + the post-call backstop can resolve which product_validation_status
--      row a conversation is binding (the upstream conversation row has no slug). Bound once
--      at startConversation, immutable after.
--
-- Identity model used by the coach (see plan §4): AUTHED path only — user_id = operator
-- auth.uid(), NOT the anon path (which is TTL-purged at 24h and would delete the persistent
-- memory the coach requires). The anon tables/purge below are carried for template fidelity
-- but the coach never rides them.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- NOTE: update_updated_at_column() intentionally NOT (re)defined here — reused from
-- 001_initial_schema.sql (identical body). See header delta #1.


-- ============================================================================
-- 1. AGENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS convai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  agent_name TEXT NOT NULL,
  elevenlabs_agent_id TEXT UNIQUE NOT NULL,
  system_prompt TEXT,
  first_message TEXT,
  voice_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'paused', 'deleted')),
  total_conversations INT DEFAULT 0,
  total_minutes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_conversation_at TIMESTAMPTZ
);

DROP TRIGGER IF EXISTS trg_convai_agents_updated ON convai_agents;
CREATE TRIGGER trg_convai_agents_updated BEFORE UPDATE ON convai_agents
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- 2. ANON SESSIONS TABLE (ephemeral; the coach does NOT use this path)
-- ============================================================================
CREATE TABLE IF NOT EXISTS convai_anon_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES convai_agents(id) ON DELETE CASCADE,
  elevenlabs_agent_id TEXT,
  token_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_convai_anon_sessions_expires ON convai_anon_sessions (expires_at);


-- ============================================================================
-- 3. CONVERSATIONS TABLE  (+ product_slug binding — delta #2)
-- ============================================================================
CREATE TABLE IF NOT EXISTS convai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  agent_id UUID NOT NULL REFERENCES convai_agents(id) ON DELETE CASCADE,
  anon_session_id UUID REFERENCES convai_anon_sessions(id) ON DELETE CASCADE,
  elevenlabs_conversation_id TEXT UNIQUE,

  -- Coach binding: which product_validation_status row this walk is filling.
  -- Set once at startConversation from the verified session token; immutable after.
  product_slug TEXT,

  title TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INT,
  processed_at TIMESTAMPTZ,
  transcript_text TEXT,
  transcript_json JSONB,
  topics TEXT[] DEFAULT '{}',
  last_topic TEXT,
  last_message_at TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_convai_conversations_updated ON convai_conversations;
CREATE TRIGGER trg_convai_conversations_updated BEFORE UPDATE ON convai_conversations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_convai_conversations_slug ON convai_conversations (product_slug);


-- ============================================================================
-- 4. MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS convai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES convai_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  agent_id UUID NOT NULL REFERENCES convai_agents(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  audio_url TEXT,
  duration_ms INTEGER,
  message_index INTEGER NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_convai_messages_conv_idx
  ON convai_messages (conversation_id, message_index);


-- ============================================================================
-- 5. MEMORY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS convai_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  agent_id UUID NOT NULL REFERENCES convai_agents(id) ON DELETE CASCADE,
  anon_session_id UUID REFERENCES convai_anon_sessions(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL CHECK (memory_type IN (
    'preference', 'context', 'goal', 'decision',
    'followup', 'correction', 'insight'
  )),
  content TEXT NOT NULL,
  source_conversation_id UUID REFERENCES convai_conversations(id) ON DELETE SET NULL,
  importance INT DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
  tags TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  superseded_by UUID REFERENCES convai_memory(id),
  recall_count INT DEFAULT 0,
  last_recalled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_convai_memory_updated ON convai_memory;
CREATE TRIGGER trg_convai_memory_updated BEFORE UPDATE ON convai_memory
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_convai_memory_content_trgm
  ON convai_memory USING gin (content gin_trgm_ops);


-- ============================================================================
-- 6. HOT-PATH INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_convai_conversations_lookup
  ON convai_conversations (agent_id, user_id, status, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_convai_messages_conv_time
  ON convai_messages (conversation_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_convai_memory_recall
  ON convai_memory (agent_id, user_id, active, importance DESC);


-- ============================================================================
-- 7. MESSAGE INSERT TRIGGER (auto-update conversation stats)
-- ============================================================================
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE convai_conversations
  SET
    message_count = COALESCE(message_count, 0) + 1,
    last_message_at = NEW.timestamp,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_on_message ON convai_messages;
CREATE TRIGGER trigger_update_conversation_on_message
AFTER INSERT ON convai_messages
FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();


-- ============================================================================
-- 8. CONVERSATION CONTEXT RPC
-- ============================================================================
CREATE OR REPLACE FUNCTION get_conversation_context(
  p_agent_id UUID,
  p_user_id UUID,
  p_message_limit INTEGER DEFAULT 20
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  last_conv RECORD;
  time_gap INTERVAL;
  memories_json JSON;
BEGIN
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', mem.id,
      'type', mem.memory_type,
      'content', mem.content,
      'importance', mem.importance
    ) ORDER BY mem.importance DESC
  ), '[]'::json)
  INTO memories_json
  FROM (
    SELECT * FROM convai_memory
    WHERE agent_id = p_agent_id
      AND user_id = p_user_id
      AND active = true
    ORDER BY importance DESC, created_at DESC
    LIMIT 10
  ) mem;

  SELECT
    c.id,
    c.last_message_at,
    c.last_topic,
    c.summary,
    c.message_count,
    c.title
  INTO last_conv
  FROM convai_conversations c
  WHERE c.agent_id = p_agent_id
    AND c.user_id = p_user_id
  ORDER BY c.last_message_at DESC NULLS LAST
  LIMIT 1;

  IF last_conv.id IS NULL THEN
    RETURN json_build_object(
      'has_history', false,
      'recent_messages', '[]'::json,
      'memories', memories_json
    );
  END IF;

  time_gap := NOW() - last_conv.last_message_at;

  SELECT json_build_object(
    'has_history', true,
    'conversation_id', last_conv.id,
    'last_message_at', last_conv.last_message_at,
    'time_gap_seconds', EXTRACT(EPOCH FROM time_gap)::INTEGER,
    'time_gap_category',
      CASE
        WHEN last_conv.last_message_at IS NULL THEN 'new'
        WHEN time_gap < INTERVAL '1 hour' THEN 'recent'
        WHEN time_gap < INTERVAL '1 day' THEN 'today'
        WHEN time_gap < INTERVAL '7 days' THEN 'this_week'
        ELSE 'older'
      END,
    'last_topic', last_conv.last_topic,
    'summary', last_conv.summary,
    'message_count', last_conv.message_count,
    'title', last_conv.title,
    'recent_messages', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', m.id,
          'role', m.role,
          'content', m.content,
          'timestamp', m.timestamp
        ) ORDER BY m.timestamp DESC
      ), '[]'::json)
      FROM (
        SELECT * FROM convai_messages
        WHERE conversation_id = last_conv.id
        ORDER BY timestamp DESC
        LIMIT p_message_limit
      ) m
    ),
    'memories', memories_json
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 9. ANON PURGE FUNCTION (carried for template fidelity; coach uses authed path)
-- ============================================================================
CREATE OR REPLACE FUNCTION purge_expired_anon_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted INTEGER;
BEGIN
  WITH gone AS (
    DELETE FROM convai_anon_sessions WHERE expires_at < NOW() RETURNING 1
  )
  SELECT count(*) INTO deleted FROM gone;
  RETURN deleted;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 10. ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE convai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE convai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE convai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE convai_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE convai_anon_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own agents" ON convai_agents;
CREATE POLICY "Users see own agents" ON convai_agents
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users see own conversations" ON convai_conversations;
CREATE POLICY "Users see own conversations" ON convai_conversations
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users see own messages" ON convai_messages;
CREATE POLICY "Users see own messages" ON convai_messages
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users see own memories" ON convai_memory;
CREATE POLICY "Users see own memories" ON convai_memory
  FOR SELECT USING (user_id = auth.uid());

-- convai_anon_sessions: no client policy → service-role-only.


-- ============================================================================
-- 11. UPGRADES (idempotent — for any pre-existing convai_* shape on this DB)
-- ============================================================================
ALTER TABLE convai_conversations ADD COLUMN IF NOT EXISTS anon_session_id UUID REFERENCES convai_anon_sessions(id) ON DELETE CASCADE;
ALTER TABLE convai_conversations ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
ALTER TABLE convai_conversations ADD COLUMN IF NOT EXISTS product_slug TEXT;   -- delta #2, idempotent
ALTER TABLE convai_memory       ADD COLUMN IF NOT EXISTS anon_session_id UUID REFERENCES convai_anon_sessions(id) ON DELETE CASCADE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'convai_messages' AND column_name = 'message_index'
      AND is_nullable = 'YES'
  ) THEN
    UPDATE convai_messages m
    SET message_index = sub.rn
    FROM (
      SELECT id, row_number() OVER (
        PARTITION BY conversation_id ORDER BY timestamp, created_at, id
      ) AS rn
      FROM convai_messages
    ) sub
    WHERE m.id = sub.id;

    ALTER TABLE convai_messages ALTER COLUMN message_index SET NOT NULL;
  END IF;
END $$;
