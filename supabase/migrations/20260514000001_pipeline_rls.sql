-- Pipeline Tracker — Row-Level Security policies
-- Each user only sees their own contacts/events. Audit log is read-own; insert is trigger-only.

ALTER TABLE pipeline.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline.audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- contacts: full CRUD scoped to owner
-- ============================================================

DROP POLICY IF EXISTS "Own contacts: select" ON pipeline.contacts;
CREATE POLICY "Own contacts: select"
  ON pipeline.contacts FOR SELECT
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Own contacts: insert" ON pipeline.contacts;
CREATE POLICY "Own contacts: insert"
  ON pipeline.contacts FOR INSERT
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Own contacts: update" ON pipeline.contacts;
CREATE POLICY "Own contacts: update"
  ON pipeline.contacts FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Own contacts: delete" ON pipeline.contacts;
CREATE POLICY "Own contacts: delete"
  ON pipeline.contacts FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================================
-- events: full CRUD scoped to owner
-- ============================================================

DROP POLICY IF EXISTS "Own events: select" ON pipeline.events;
CREATE POLICY "Own events: select"
  ON pipeline.events FOR SELECT
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Own events: insert" ON pipeline.events;
CREATE POLICY "Own events: insert"
  ON pipeline.events FOR INSERT
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Own events: update" ON pipeline.events;
CREATE POLICY "Own events: update"
  ON pipeline.events FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Own events: delete" ON pipeline.events;
CREATE POLICY "Own events: delete"
  ON pipeline.events FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================================
-- audit_log: read-only via select; inserts only via trigger (no policy = blocked)
-- ============================================================

DROP POLICY IF EXISTS "Own audit log: select" ON pipeline.audit_log;
CREATE POLICY "Own audit log: select"
  ON pipeline.audit_log FOR SELECT
  USING (actor_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies => no direct writes possible.
-- Writes happen via SECURITY DEFINER trigger function in the triggers migration.
