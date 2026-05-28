# Choose Your Migration Method

**Two options. Both work. Pick one.**

---

## Option A: Via CLI (Faster, Recommended)

**Time:** 3 minutes  
**Complexity:** Low  
**Setup:** ~2 minutes (one-time)

### Do This:

```bash
# Step 1: Install CLI (one time only)
npm install -g supabase

# Step 2: Authenticate (one time only)
supabase login

# Step 3: Go to the shared services repo
cd C:\Users\denni\PycharmProjects\cais-shared-services

# Step 4: Link your project (one time only)
supabase link --project-ref tfgtfhwvrswjvkyeyvsp

# Step 5: Push migrations
supabase db push
```

**What you see:**
```
Applying migration 20260528_product_validation_status...
✓ Applied

Applying migration 20260528_validation_events...
✓ Applied
```

**Then verify:**
```bash
supabase migration list
```

### Why Choose This:
✅ Faster (3 min)  
✅ Version-controlled  
✅ Idempotent (safe to run multiple times)  
✅ Works in CI/CD  
✅ Industry standard  

---

## Option B: Via SQL Editor (No Installation)

**Time:** 5 minutes  
**Complexity:** Very low  
**Setup:** None required

### Do This:

1. Open browser: https://supabase.com/dashboard/project/tfgtfhwvrswjvkyeyvsp/sql/new
2. Copy-paste SQL from `EXECUTE_STEP1_NOW.md`
3. Click "Run"
4. Paste second SQL, click "Run"
5. Done

**What you see:**
```
✅ Success. No rows returned
```

### Why Choose This:
✅ No installation needed  
✅ No authentication setup  
✅ Visual feedback in browser  
✅ Works immediately  

---

## Side-by-Side Comparison

| Aspect | CLI | SQL Editor |
|--------|-----|-----------|
| Time | 3 min | 5 min |
| Setup needed | 2 min (one-time) | None |
| Installation | npm install | None |
| Speed on re-run | <30 sec | 5 min |
| Works in CI/CD | ✅ Yes | ❌ No |
| Version-controlled | ✅ Yes | ❌ No |
| Idempotent | ✅ Yes | ✅ Yes |
| Visual feedback | Text output | Web UI |
| Failure recovery | Clear/retry | Clear/retry |

---

## My Recommendation

**Use CLI if you want to:**
- Work faster
- Follow industry best practices
- Set up for CI/CD later
- Keep migrations version-controlled

**Use SQL Editor if you:**
- Want zero setup time
- Prefer visual interface
- Just want it done quickly
- Don't have npm installed

---

## Decision Tree

```
Do you have npm installed?
├─ YES
│  └─ Choose: CLI (Recommended) → PUSH_MIGRATIONS_CLI.md
│
└─ NO
   └─ Do you want to install npm?
      ├─ YES → Choose: CLI → PUSH_MIGRATIONS_CLI.md
      └─ NO  → Choose: SQL Editor → EXECUTE_STEP1_NOW.md
```

---

## Quick Links

**CLI Path:** `PUSH_MIGRATIONS_CLI.md`  
- Step-by-step for installing CLI
- Copy-paste commands
- Quick verification

**SQL Editor Path:** `EXECUTE_STEP1_NOW.md`  
- Open Supabase dashboard
- Copy-paste SQL
- No installation needed

---

## What Happens After Migrations

Same result either way:

✅ Two tables created  
✅ Indexes added  
✅ RLS policies enabled  
✅ Ready for Phase 2 code  

Then proceed to:

**Step 2: Set Vercel Environment Variables** (2 min)

---

## Pick One and Go

Which method?

**A) CLI** → Go to `PUSH_MIGRATIONS_CLI.md`

**B) SQL Editor** → Go to `EXECUTE_STEP1_NOW.md`

Both will have your migrations applied in <5 minutes.

