# Step 1: Apply Supabase Migrations

**Objective:** Create the two database tables needed for Phase 2  
**Time:** ~5 minutes  
**Risk:** Low (uses `CREATE TABLE IF NOT EXISTS`)

---

## Instructions

### 1. Open Supabase SQL Editor

Go to: **https://supabase.com/dashboard/project/tfgtfhwvrswjvkyeyvsp/sql/new**

(Or: Supabase Dashboard → Your project → SQL Editor → New Query)

### 2. Copy and Run Migration 1 (product_validation_status table)

**Copy the entire SQL below:**

```sql
-- Product Validation Status Table
-- Tracks validation pipeline readiness for all portfolio products
-- Created: 2026-05-28
-- Purpose: Answer "Which products can run outreach RIGHT NOW?" and "What gaps exist?"

CREATE TABLE IF NOT EXISTS product_validation_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Product identity (matches portfolio-manifest.yaml slug)
  product_slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  
  -- Validation Readiness (gates from BUSINESS_MODEL §4)
  -- Gate 1: Idea → Feasibility → Dual-stream validation → GO/NO-GO → Ship MVP
  gate1_ready BOOLEAN DEFAULT false,
  gate1_score_percent INT CHECK (gate1_score_percent BETWEEN 0 AND 100),
  
  -- Hard Gates (must-haves for validation pipeline)
  hard_gates_passed INT DEFAULT 0,           -- Number of hard gates passed
  hard_gates_total INT DEFAULT 6,             -- Total hard gates (6 per BUSINESS_MODEL)
  
  -- Weighted Score (blended across hard + soft gates)
  weighted_score_percent INT CHECK (weighted_score_percent BETWEEN 0 AND 100),
  
  -- Outreach Readiness (can this product run outreach RIGHT NOW?)
  can_run_outreach BOOLEAN DEFAULT false,      -- True if gate1_ready AND all required fields present
  outreach_blocker TEXT,                        -- If not ready, what's stopping it? (e.g., "missing promise", "no distributor hypothesis")
  
  -- Product Details (from portfolio-manifest.yaml enrichment)
  promise TEXT,                                 -- What problem does it solve? (1-2 sentences)
  distributor TEXT,                             -- Who sells/distributes it?
  end_user TEXT,                                -- Who uses it?
  friction TEXT,                                -- What pain point does it address?
  
  -- Validation Fields Status (checklist for pipeline readiness)
  has_promise BOOLEAN DEFAULT false,
  has_distributor BOOLEAN DEFAULT false,
  has_end_user BOOLEAN DEFAULT false,
  has_friction BOOLEAN DEFAULT false,
  has_methodology_commitment BOOLEAN DEFAULT false,  -- Did the founder commit to validate via the pipeline?
  
  -- Recent Activity
  last_validation_update TIMESTAMP WITH TIME ZONE,
  last_outreach_attempt TIMESTAMP WITH TIME ZONE,
  last_scoring_run TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Audit Trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID,  -- Which admin/script updated it
  
  -- Metadata
  notes TEXT,  -- Admin notes about this product's pipeline status
  is_draft BOOLEAN DEFAULT true,  -- True if in early ideation, not yet committed to pipeline
  is_paused BOOLEAN DEFAULT false  -- True if temporarily paused (funding hold, pivot, etc)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_product_validation_status_gate1_ready 
  ON product_validation_status(gate1_ready, can_run_outreach DESC);

CREATE INDEX IF NOT EXISTS idx_product_validation_status_can_run_outreach 
  ON product_validation_status(can_run_outreach DESC);

CREATE INDEX IF NOT EXISTS idx_product_validation_status_score 
  ON product_validation_status(weighted_score_percent DESC);

CREATE INDEX IF NOT EXISTS idx_product_validation_status_updated 
  ON product_validation_status(last_scoring_run DESC);

CREATE INDEX IF NOT EXISTS idx_product_validation_status_product_slug 
  ON product_validation_status(product_slug);

-- RLS Policies
ALTER TABLE product_validation_status ENABLE ROW LEVEL SECURITY;

-- Admin-only read
CREATE POLICY "Admin can read validation status"
  ON product_validation_status
  FOR SELECT
  USING (auth.role() = 'authenticated');  -- Gated by middleware to admin emails

-- Admin-only write
CREATE POLICY "Admin can update validation status"
  ON product_validation_status
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin can insert validation status"
  ON product_validation_status
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON product_validation_status TO authenticated;

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_product_validation_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_validation_status_updated_at
  BEFORE UPDATE ON product_validation_status
  FOR EACH ROW
  EXECUTE FUNCTION update_product_validation_status_updated_at();
```

**Steps:**
1. Paste into SQL Editor
2. Click **"Run"** button (or Cmd+Enter)
3. Wait for success message: ✅ **Success. No rows returned**

### 3. Copy and Run Migration 2 (validation_events table)

**Copy the entire SQL below:**

```sql
-- Validation Events Audit Trail
-- Tracks every change to product validation status for audit + replay capability
-- Created: 2026-05-28
-- Purpose: "Who changed what, when, and why?" — full history

CREATE TABLE IF NOT EXISTS validation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event identity
  product_slug TEXT NOT NULL,
  event_type TEXT NOT NULL,  -- 'field_updated' | 'status_changed' | 'score_calculated' | 'outreach_run' | 'commitment_added'
  
  -- What changed
  field_name TEXT,           -- Which field was updated? (e.g., 'promise', 'gate1_ready', 'weighted_score_percent')
  old_value TEXT,            -- Previous value (serialized as JSON for complex types)
  new_value TEXT,            -- New value
  
  -- Who made the change
  actor_type TEXT NOT NULL,  -- 'admin' | 'script' | 'system'
  actor_id UUID,             -- Which admin/script? (nullable for system events)
  actor_name TEXT,           -- Human-readable actor name
  
  -- Why it changed
  reason TEXT,               -- What prompted this? ("User submitted form", "Daily scoring run", "Manual gate override", etc.)
  
  -- Context
  context_data JSONB,        -- Extra context (e.g., which validation_events triggered a gate flip)
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address TEXT,           -- If from web UI, IP of requester
  user_agent TEXT            -- Browser user agent (if from UI)
);

-- Indexes for querying
CREATE INDEX IF NOT EXISTS idx_validation_events_product_slug 
  ON validation_events(product_slug, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_validation_events_event_type 
  ON validation_events(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_validation_events_actor 
  ON validation_events(actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_validation_events_created 
  ON validation_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_validation_events_field 
  ON validation_events(product_slug, field_name, created_at DESC);

-- RLS Policies
ALTER TABLE validation_events ENABLE ROW LEVEL SECURITY;

-- Admin-only read
CREATE POLICY "Admin can read validation events"
  ON validation_events
  FOR SELECT
  USING (auth.role() = 'authenticated');  -- Gated by middleware to admin emails

-- Only scripts/system can insert (not direct admin inserts)
CREATE POLICY "System can insert validation events"
  ON validation_events
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON validation_events TO authenticated;
GRANT INSERT ON validation_events TO service_role;

-- Helper function to log events (called from product_validation_status update triggers)
CREATE OR REPLACE FUNCTION log_validation_event(
  p_product_slug TEXT,
  p_event_type TEXT,
  p_field_name TEXT DEFAULT NULL,
  p_old_value TEXT DEFAULT NULL,
  p_new_value TEXT DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_context_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
  v_actor_id UUID;
  v_actor_name TEXT;
  v_actor_type TEXT;
BEGIN
  -- Determine who/what is making the change
  v_actor_id := auth.uid();
  
  IF v_actor_id IS NULL THEN
    -- System/script call
    v_actor_type := 'system';
    v_actor_name := 'system';
  ELSE
    v_actor_type := 'admin';
    v_actor_name := (SELECT email FROM auth.users WHERE id = v_actor_id LIMIT 1);
  END IF;
  
  -- Insert event
  INSERT INTO validation_events (
    product_slug,
    event_type,
    field_name,
    old_value,
    new_value,
    actor_type,
    actor_id,
    actor_name,
    reason,
    context_data
  )
  VALUES (
    p_product_slug,
    p_event_type,
    p_field_name,
    p_old_value,
    p_new_value,
    v_actor_type,
    v_actor_id,
    v_actor_name,
    p_reason,
    p_context_data
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow authenticated users to call the logging function (security_definer runs as definer)
GRANT EXECUTE ON FUNCTION log_validation_event TO authenticated, service_role;
```

**Steps:**
1. Paste into SQL Editor (clear previous query first)
2. Click **"Run"** button
3. Wait for success message: ✅ **Success. No rows returned**

---

## Verification (Optional but Recommended)

After both migrations run successfully, verify tables exist:

```sql
-- Check product_validation_status table
SELECT COUNT(*) as count FROM product_validation_status;

-- Check validation_events table
SELECT COUNT(*) as count FROM validation_events;

-- List all tables
SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;
```

**Expected results:**
- Both queries return `0` (tables are empty, which is correct)
- `pg_tables` shows both tables in the list

---

## Troubleshooting

### ❌ Error: "Relation already exists"
**Cause:** Table already exists from a previous run  
**Fix:** This is fine! The `IF NOT EXISTS` clause prevents re-creation. Proceed to next migration.

### ❌ Error: "Syntax error at..."
**Cause:** SQL syntax issue  
**Fix:** Check that you copied the entire SQL block. Line breaks matter in PostgreSQL. Re-paste carefully.

### ❌ Error: "Permission denied"
**Cause:** You don't have admin access to this Supabase project  
**Fix:** Verify you're logged into the correct Supabase account and have edit permissions.

### ✅ Success: "Success. No rows returned"
This is correct! The migrations don't return data, just create tables.

---

## What These Tables Do

### `product_validation_status`
Tracks validation readiness for each of 29 portfolio products. Stores:
- Readiness score (0-100%)
- Gate pass/fail status
- Field completion checklist
- Gaps identified
- Admin notes

### `validation_events`
Immutable audit trail of every change. Logs:
- Who changed what
- When it changed
- Why it changed
- Old vs new values

---

## Next Step

Once both migrations succeed, proceed to:

**Step 2: Set Vercel Environment Variables**

See `PHASE_2_DEPLOYMENT_INSTRUCTIONS.md` Step 2 for next steps.

---

**Estimated time:** 5 minutes  
**Risk level:** Low (idempotent, uses IF NOT EXISTS)  
**Rollback:** Drop tables if needed: `DROP TABLE validation_events CASCADE; DROP TABLE product_validation_status CASCADE;`

