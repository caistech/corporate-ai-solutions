# Migration Verification Checklist

**Purpose:** Confirm both Supabase migrations applied successfully  
**Time:** ~2 minutes  
**Critical:** Yes - app won't work without these tables

---

## Pre-Migration

Before you start applying migrations:

- [ ] You have access to Supabase dashboard (logged in)
- [ ] You're on the correct project: `tfgtfhwvrswjvkyeyvsp`
- [ ] You can see the SQL Editor (Dashboard → SQL Editor)
- [ ] You have the migration SQL files ready (see STEP1_APPLY_MIGRATIONS.md)

---

## During Migration 1 (product_validation_status)

**Expected behavior:**
- [ ] Paste entire Migration 1 SQL into editor
- [ ] Click "Run" (or Cmd+Enter)
- [ ] Screen shows: ✅ **Success. No rows returned**
- [ ] Takes <5 seconds to execute
- [ ] No red error messages appear

**If you see an error:**
- [ ] Read the error message carefully
- [ ] Check it's not just "Relation already exists" (OK, table exists)
- [ ] If syntax error, re-paste more carefully
- [ ] Contact if stuck - don't proceed to Migration 2

---

## During Migration 2 (validation_events)

**Expected behavior:**
- [ ] Clear the previous SQL from editor
- [ ] Paste entire Migration 2 SQL into editor
- [ ] Click "Run" (or Cmd+Enter)
- [ ] Screen shows: ✅ **Success. No rows returned**
- [ ] Takes <5 seconds to execute
- [ ] No red error messages appear

**If you see an error:**
- [ ] Same troubleshooting as Migration 1
- [ ] Both migrations must succeed to proceed

---

## Post-Migration Verification

After BOTH migrations say "Success", run these verification queries:

### Query 1: Check product_validation_status table exists and is empty

```sql
SELECT COUNT(*) as row_count FROM product_validation_status;
```

**Expected result:**
```
 row_count
-----------
         0
```

✅ **Success if:** Shows `0` (table exists, is empty)  
❌ **Fail if:** Shows "relation does not exist" error

---

### Query 2: Check validation_events table exists and is empty

```sql
SELECT COUNT(*) as row_count FROM validation_events;
```

**Expected result:**
```
 row_count
-----------
         0
```

✅ **Success if:** Shows `0` (table exists, is empty)  
❌ **Fail if:** Shows "relation does not exist" error

---

### Query 3: Check all tables exist

```sql
SELECT tablename FROM pg_tables 
WHERE schemaname='public' 
ORDER BY tablename;
```

**Expected result:** (should include these two)
```
                    tablename
-----------------------------------------------------
product_validation_status
validation_events
... (other existing tables)
```

✅ **Success if:** Both tables appear in the list  
❌ **Fail if:** Either table is missing

---

### Query 4: Check indexes were created

```sql
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('product_validation_status', 'validation_events')
ORDER BY tablename, indexname;
```

**Expected result:** (should show 5 indexes on product_validation_status, 5 on validation_events)
```
                          indexname
-------------------------------------------------------
idx_product_validation_status_gate1_ready
idx_product_validation_status_can_run_outreach
idx_product_validation_status_score
idx_product_validation_status_updated
idx_product_validation_status_product_slug
idx_validation_events_product_slug
idx_validation_events_event_type
idx_validation_events_actor
idx_validation_events_created
idx_validation_events_field
... (possibly more from other tables)
```

✅ **Success if:** All 10 indexes listed  
❌ **Fail if:** Any index is missing

---

### Query 5: Check RLS is enabled

```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('product_validation_status', 'validation_events');
```

**Expected result:**
```
 schemaname |              tablename               | rowsecurity
------------+--------------------------------------+-------------
 public     | product_validation_status            | t
 public     | validation_events                    | t
```

✅ **Success if:** Both show `t` (RLS enabled)  
❌ **Fail if:** Either shows `f`

---

### Query 6: Check RLS policies exist

```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('product_validation_status', 'validation_events')
ORDER BY tablename, policyname;
```

**Expected result:** (should show 3 policies on product_validation_status, 2 on validation_events)
```
 schemaname |              tablename               |            policyname
------------+--------------------------------------+-----------------------------------
 public     | product_validation_status            | Admin can insert validation status
 public     | product_validation_status            | Admin can read validation status
 public     | product_validation_status            | Admin can update validation status
 public     | validation_events                    | Admin can read validation events
 public     | validation_events                    | System can insert validation events
```

✅ **Success if:** All 5 policies listed  
❌ **Fail if:** Any policy is missing

---

## Final Checklist

After running all 6 verification queries, confirm:

- [ ] Query 1: product_validation_status exists, row count = 0
- [ ] Query 2: validation_events exists, row count = 0
- [ ] Query 3: Both tables appear in pg_tables list
- [ ] Query 4: All 10 indexes exist
- [ ] Query 5: Both tables have rowsecurity = t
- [ ] Query 6: All 5 RLS policies exist

---

## ✅ Migration Complete If:

All 6 checks pass ✅

**Next step:** Proceed to Step 2 (Set Vercel environment variables)

---

## ❌ Migration Failed If:

Any check fails ❌

**Options:**
1. **Retry:** Run the failed migration again (idempotent, safe to retry)
2. **Reset:** Drop tables and re-run migrations
3. **Get help:** Contact with the error message and which check failed

---

## Quick Summary

| Check | What it tests | Expected |
|-------|---------------|----------|
| 1 | product_validation_status table | Exists, 0 rows |
| 2 | validation_events table | Exists, 0 rows |
| 3 | Both tables in system catalog | Both present |
| 4 | Indexes created | 10 indexes total |
| 5 | Row-level security enabled | RLS = true |
| 6 | RLS policies installed | 5 policies total |

---

**Total verification time:** 2-3 minutes  
**Run all 6 queries to confirm migrations are complete**

