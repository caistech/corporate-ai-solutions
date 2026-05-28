# Phase 2 Deployment Instructions

**Status:** Pre-deployment checklist  
**Target:** Production (internal use)  
**Timeline:** Deploy → 1 week validation → Decision on Phase 3+

---

## Part 1: Environment Variables Required

### Vercel Environment (Production)

Set these in Vercel dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL
  Value: https://tfgtfhwvrswjvkyeyvsp.supabase.co
  Scope: Production, Preview, Development

NEXT_PUBLIC_SUPABASE_ANON_KEY
  Value: (get from Supabase dashboard → Settings → API)
  Scope: Production, Preview, Development

SUPABASE_SERVICE_ROLE_KEY
  Value: (get from Supabase dashboard → Settings → API)
  Scope: Production only (secret)

ADMIN_EMAILS
  Value: your.email@corporateaisolutions.com,other.admin@example.com
  Scope: Production, Preview, Development
  (comma-separated list of admin emails who can access /admin/*)
```

### Local Development (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=https://tfgtfhwvrswjvkyeyvsp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_EMAILS=your.email@corporateaisolutions.com
```

### Shared Services (.env)

No new env vars needed for Phase 2 in `cais-shared-services`.

---

## Part 2: Deployment Order

### Step 1: Deploy Shared Services Migrations (Supabase)

These must be applied FIRST before deploying the app code.

```bash
cd cais-shared-services

# Apply migrations via Supabase SQL editor
# File 1: supabase/migrations/20260528_product_validation_status.sql
# File 2: supabase/migrations/20260528_validation_events.sql

# OR via CLI (if migration sync is fixed):
# supabase db push
```

**Verify:**
```sql
-- In Supabase SQL editor
SELECT COUNT(*) FROM product_validation_status;  -- Should succeed
SELECT COUNT(*) FROM validation_events;         -- Should succeed
```

### Step 2: Deploy Corporate-AI-Solutions to Staging

```bash
cd Corporate-AI-Solutions

# Ensure migrations are applied first (see Step 1)

git add -A
git commit -m "Phase 2: Portfolio validation pipeline (deploy to staging)"
git push origin main  # Or your staging branch

# Vercel auto-deploys
# Check: https://vercel.com/dashboard
```

**Verify on staging:**
- [ ] Build succeeds (no TypeScript errors)
- [ ] `/admin/pipeline` loads with auth
- [ ] Dashboard shows all products (with 0% readiness initially)
- [ ] Sorting/filtering works
- [ ] Detail page loads

### Step 3: Test on Staging for 24 Hours

Run the 5-product validation test (see Part 3) on staging.

If successful → promote to production.

### Step 4: Deploy to Production

```bash
# If staging is clean, promote to production
vercel promote <staging-deployment-url>

# Or push to main/production branch
git push origin main
```

**Verify on production:**
- Same checks as staging
- Monitor logs for errors (Vercel Analytics)

---

## Part 3: Rollback Plan

### If Issues Found During Staging

```bash
# Revert code to previous version
git revert <commit-hash>
git push origin main

# Vercel auto-redeploys to previous code
# Tables remain in Supabase (can revert separately if needed)
```

### If Critical Bug in Production

```bash
# Option 1: Revert to previous code version (fast)
git revert <commit-hash>
git push origin main
# Vercel redeploys immediately

# Option 2: Drop tables (if schema is the problem)
# In Supabase SQL editor:
DROP TABLE validation_events CASCADE;
DROP TABLE product_validation_status CASCADE;
# Re-apply migrations when issue is fixed
```

### Expected Downtime

- Code revert: < 2 minutes
- Schema revert: < 5 minutes
- Total: ~5 minutes max

---

## Part 4: Pre-Flight Checklist

### Database Layer
- [ ] Migrations file exists: `supabase/migrations/20260528_product_validation_status.sql`
- [ ] Migrations file exists: `supabase/migrations/20260528_validation_events.sql`
- [ ] Both files can be pasted into Supabase SQL editor
- [ ] Tables created successfully in Supabase
- [ ] RLS policies enabled
- [ ] Indexes created

### Application Code
- [ ] TypeScript compiles: `npm run build`
- [ ] No linting errors: `npm run lint`
- [ ] Scanner reads manifest: `src/lib/portfolio-scanner.ts` works
- [ ] API endpoints exist:
  - `/api/admin/pipeline/scan`
  - `/api/admin/pipeline/[productId]`
  - `/api/admin/pipeline/[productId]/fix-gaps`
  - `/api/admin/pipeline/[productId]/execute`
- [ ] Components render without errors:
  - `/admin/pipeline`
  - `/admin/pipeline/[productId]`

### Authentication
- [ ] Middleware protects `/admin/*` routes
- [ ] Admin email in `ADMIN_EMAILS` list
- [ ] Auth works: can log in and access dashboard
- [ ] Non-admin blocked from `/admin/*`

### Environment
- [ ] Vercel env vars set (5 required)
- [ ] Local `.env.local` has all vars
- [ ] No hardcoded secrets in code
- [ ] No console warnings about missing env vars

### Monitoring
- [ ] Vercel Analytics configured
- [ ] Logs accessible
- [ ] Sentry or error tracking ready (if using)

---

## Part 5: Initial Data Load

Phase 2 reads from `portfolio-manifest.yaml` but doesn't auto-populate the database.

First time you visit `/admin/pipeline`:
- Scanner reads manifest
- Looks for existing `product_validation_status` records
- Shows 0% readiness for all (expected, DB is empty)

**To populate initial data (Phase 4+):**
- Manual form entry
- LLM prefill
- Batch import from CSV

**For Phase 2 validation:**
- Leave empty and populate manually during 5-product test

---

## Part 6: Performance Baseline

Expected performance (measure during first week):

| Endpoint | Avg Time | p99 | Cache |
|----------|----------|-----|-------|
| `/admin/pipeline` | 800ms | 2s | 5m |
| `/api/admin/pipeline/scan` | 500ms | 1.5s | 5m |
| `/admin/pipeline/[id]` | 300ms | 800ms | 1m |
| `/api/admin/pipeline/[id]` | 200ms | 600ms | 1m |
| `/api/.../fix-gaps` | 400ms | 1s | (no cache) |
| `/api/.../execute` | 300ms | 800ms | (no cache) |

If actual times exceed these, investigate:
- Supabase query performance
- Manifest file size
- Client-side rendering
- Network latency

---

## Part 7: Monitoring During First Week

### Daily Checks
- [ ] Vercel build succeeds
- [ ] Dashboard loads in < 2s
- [ ] No 500 errors in logs
- [ ] No auth failures (unless invalid user)
- [ ] Responsive on mobile + desktop

### Error Alerts
- [ ] DB connection errors
- [ ] Missing env vars
- [ ] Invalid manifest YAML
- [ ] Auth middleware failures
- [ ] Scanner timeout (>5s)

### Metrics to Track
- API response times (by endpoint)
- Error rates by error type
- Auth success rate
- Cache hit ratio
- Database query count

### Weekly Report
After 5 products tested, document:
- Time from idea to outreach-ready
- Gaps fixed automatically
- Manual gaps that needed work
- UI/UX issues
- Performance issues
- Any bugs

---

## Part 8: Post-Deployment Verification

### Run immediately after deploy:

```bash
# 1. Check build
curl https://yourapp.com/api/admin/pipeline/scan -H "Authorization: Bearer <token>"
# Expected: 200 OK with product list

# 2. Check auth
curl https://yourapp.com/admin/pipeline (no auth)
# Expected: 401 or redirect to login

curl https://yourapp.com/admin/pipeline -H "Cookie: <auth-cookie>"
# Expected: 200 with dashboard HTML

# 3. Check database
# In Supabase SQL editor:
SELECT COUNT(*) FROM product_validation_status;
SELECT COUNT(*) FROM validation_events;
# Expected: 0 rows (empty, ready to populate)

# 4. Check manifest readable
# Visit /admin/pipeline in browser
# Expected: All 29 products listed
```

---

## Part 9: Success Criteria for Deployment

Phase 2 deployment is successful if:

- ✅ Builds and deploys without errors
- ✅ All endpoints accessible with auth
- ✅ Dashboard loads < 2s
- ✅ Scanner reads all 29 products from manifest
- ✅ Fix-gaps endpoint returns mock values
- ✅ Execute endpoint validates readiness
- ✅ Audit trail logged to validation_events
- ✅ Auth middleware blocks unauthorized access
- ✅ No console errors in browser
- ✅ Responsive on mobile + desktop
- ✅ Ready for 5-product manual test

If ANY of these fail → rollback and investigate

---

## Questions During Deployment

**Q: What if migrations fail?**  
A: Check Supabase SQL editor for errors. Most common: table already exists (run `DROP TABLE ... CASCADE` first if re-applying).

**Q: What if scanner can't read manifest?**  
A: Check file path. `src/lib/portfolio-scanner.ts` uses relative path. Run `npm run dev` locally and check console for parse errors.

**Q: What if auth isn't working?**  
A: Check middleware.ts ADMIN_EMAILS list. Must include your email exactly (case-sensitive). Clear cookies and try again.

**Q: What if dashboard is slow?**  
A: Check Supabase query performance. Scanner may be slow on first run (reading full manifest + DB). Caching will kick in after 5 min.

**Q: Can I test without production Supabase?**  
A: Yes, use local Supabase: `supabase start` in cais-shared-services. Creates local PG instance. Update `.env.local` with local credentials.

---

## Rollback Decision Tree

```
Deploy fails?
  → Check build logs (Vercel dashboard)
  → Revert commit
  → Push: git revert <hash> && git push

Dashboard 500 errors?
  → Check middleware auth
  → Check ADMIN_EMAILS
  → Check env vars (Vercel dashboard)
  → Check Supabase connectivity

Dashboard loads but no products?
  → Check manifest file exists at correct path
  → Check scanner can parse YAML
  → Check Supabase tables created

Products show but 0% readiness?
  → EXPECTED for Phase 2
  → Proceed to validation test

Performance slow?
  → Check database query times
  → Verify cache headers
  → Monitor network waterfall
  → Increase Vercel instance if needed

Any blocker found?
  → Investigate root cause
  → Fix locally
  → Test on staging
  → Deploy to production
  → Or revert if unfixable
```

---

**Proceed to Part 3: Validation Test Plan (separate document)**

