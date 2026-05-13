-- Pipeline Tracker — triggers
-- Three responsibilities:
--   1. set_owner_id_pipeline: backfill owner_id from auth.uid() on insert if NULL
--   2. set_updated_at_pipeline: keep updated_at fresh on row update
--   3. audit_pipeline_contacts/audit_pipeline_events: write audit_log rows on INSERT/UPDATE/DELETE
--
-- IMPORTANT: audit triggers are SECURITY DEFINER so they can write to audit_log past RLS.
-- They explicitly capture auth.uid() at trigger fire time and write it to actor_id.

-- ============================================================
-- set_owner_id_pipeline
-- ============================================================

CREATE OR REPLACE FUNCTION pipeline.set_owner_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.owner_id IS NULL THEN
    NEW.owner_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contacts_set_owner_id ON pipeline.contacts;
CREATE TRIGGER contacts_set_owner_id
  BEFORE INSERT ON pipeline.contacts
  FOR EACH ROW EXECUTE FUNCTION pipeline.set_owner_id();

DROP TRIGGER IF EXISTS events_set_owner_id ON pipeline.events;
CREATE TRIGGER events_set_owner_id
  BEFORE INSERT ON pipeline.events
  FOR EACH ROW EXECUTE FUNCTION pipeline.set_owner_id();

-- ============================================================
-- set_updated_at_pipeline
-- ============================================================

CREATE OR REPLACE FUNCTION pipeline.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contacts_set_updated_at ON pipeline.contacts;
CREATE TRIGGER contacts_set_updated_at
  BEFORE UPDATE ON pipeline.contacts
  FOR EACH ROW EXECUTE FUNCTION pipeline.set_updated_at();

-- ============================================================
-- audit trigger function (shared by contacts + events)
--
-- Captures auth.uid() into actor_id. Must run as SECURITY DEFINER because
-- audit_log has no INSERT policy — the trigger function bypasses RLS to write.
-- ============================================================

CREATE OR REPLACE FUNCTION pipeline.write_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pipeline, public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_entity_type text := TG_ARGV[0];
  v_entity_id uuid;
  v_action text;
  v_diff jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'insert';
    v_entity_id := NEW.id;
    v_diff := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_entity_id := NEW.id;
    -- Diff: only fields that actually changed
    SELECT jsonb_object_agg(key, jsonb_build_object('old', old_val, 'new', new_val))
    INTO v_diff
    FROM (
      SELECT key, old_val, new_val
      FROM jsonb_each(to_jsonb(OLD)) AS o(key, old_val)
      JOIN jsonb_each(to_jsonb(NEW)) AS n(key, new_val) USING (key)
      WHERE old_val IS DISTINCT FROM new_val
    ) sub;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_entity_id := OLD.id;
    v_diff := to_jsonb(OLD);
  END IF;

  INSERT INTO pipeline.audit_log (actor_id, entity_type, entity_id, action, diff)
  VALUES (v_actor, v_entity_type, v_entity_id, v_action, v_diff);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS contacts_audit ON pipeline.contacts;
CREATE TRIGGER contacts_audit
  AFTER INSERT OR UPDATE OR DELETE ON pipeline.contacts
  FOR EACH ROW EXECUTE FUNCTION pipeline.write_audit_log('contact');

DROP TRIGGER IF EXISTS events_audit ON pipeline.events;
CREATE TRIGGER events_audit
  AFTER INSERT OR UPDATE OR DELETE ON pipeline.events
  FOR EACH ROW EXECUTE FUNCTION pipeline.write_audit_log('event');
