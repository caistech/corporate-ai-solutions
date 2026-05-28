# Execute Step 1 Now: Apply Supabase Migrations

**Status:** Ready to execute  
**Time:** 5 minutes  
**Complexity:** Low  
**Risk:** Low (idempotent, reversible)

---

## Your Exact Next Actions

### Action 1: Open Supabase SQL Editor (30 seconds)

Click this link in your browser:

**https://supabase.com/dashboard/project/tfgtfhwvrswjvkyeyvsp/sql/new**

You should see:
- Supabase dashboard at top
- Empty SQL editor in the middle
- "Run" button on the right

---

### Action 2: Paste and Run Migration 1 (2 minutes)

**Copy this entire block** (110 lines):

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

**Then:**
1. Paste into the SQL editor
2. Click the **"Run"** button (or press Cmd+Enter)
3. **Wait** for the response

**You should see:** ✅ `Success. No rows returned`

If you see this, proceed to Migration 2. If not, check troubleshooting in STEP1_APPLY_MIGRATIONS.md

---

### Action 3: Paste and Run Migration 2 (2 minutes)

Clear the editor and **copy this entire block** (131 lines):

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

**Then:**
1. Clear the editor (select all, delete)
2. Paste this SQL
3. Click **"Run"** button
4. **Wait** for response

**You should see:** ✅ `Success. No rows returned`

---

### Action 4: Verify Both Migrations Succeeded (1 minute)

Copy and run this simple query to confirm both tables exist:

```sql
SELECT tablename FROM pg_tables 
WHERE schemaname='public' 
  AND tablename IN ('product_validation_status', 'validation_events')
ORDER BY tablename;
```

**Expected result:**
```
              tablename
--------------------------------------
product_validation_status
validation_events
```

**If both tables appear:** ✅ **Migrations succeeded!**

For more detailed verification, see: MIGRATION_VERIFICATION_CHECKLIST.md

---

## Summary of What Just Happened

✅ Created `product_validation_status` table
   - Stores validation readiness for 29 portfolio products
   - Has 5 indexes for fast queries
   - Has 3 RLS policies (authentication gated)

✅ Created `validation_events` table
   - Immutable audit trail of all changes
   - Has 5 indexes for querying by product/date/actor
   - Has 2 RLS policies (system writes, admins read)

✅ Created helper function `log_validation_event()`
   - Used by app to log changes to audit trail
   - Automatically captures actor, timestamp, reason

---

## ⏭️ Next Step

Once you confirm both migrations succeeded:

**Step 2: Set Vercel Environment Variables (2 minutes)**

Go to: https://vercel.com/dashboard

Add `ADMIN_EMAILS` environment variable with your email address.

Details in: PHASE_2_DEPLOYMENT_INSTRUCTIONS.md Step 2

---

## ✅ You're Done With Step 1

Migrations are applied. Database is ready.

Proceed immediately to Step 2.

