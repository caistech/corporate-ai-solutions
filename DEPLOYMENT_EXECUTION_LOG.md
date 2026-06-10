# Phase 2 Deployment Execution Log

**Started:** 2026-05-28  
**Status:** In Progress  
**Target:** Production deployment complete + 5-product validation + 7-day monitoring

---

## Step 1: Apply Supabase Migrations

**Status:** READY TO EXECUTE

**Files to apply (in order):**

1. `C:\Users\denni\PycharmProjects\cais-shared-services\supabase\migrations\20260528_product_validation_status.sql` (110 lines)
   - Creates `product_validation_status` table
   - Adds 5 indexes
   - Enables RLS policies
   - Creates auto-update trigger

2. `C:\Users\denni\PycharmProjects\cais-shared-services\supabase\migrations\20260528_validation_events.sql` (131 lines)
   - Creates `validation_events` audit table
   - Adds 5 indexes
   - Enables RLS policies
   - Creates logging helper function

**How to apply:**
- Option A (Recommended): Supabase SQL Editor
  1. Go to: https://supabase.com/dashboard/project/tfgtfhwvrswjvkyeyvsp/sql/new
  2. Copy-paste entire content of first migration file
  3. Click "Run"
  4. Verify success (no errors)
  5. Repeat for second migration file

- Option B: Supabase CLI
  ```bash
  cd cais-shared-services
  supabase db push
  ```

**Verification after apply:**
```sql
-- Run in SQL editor to verify tables exist
SELECT COUNT(*) FROM product_validation_status;  -- Should return 0
SELECT COUNT(*) FROM validation_events;         -- Should return 0
SELECT tablename FROM pg_tables WHERE schemaname='public';  -- Should show both tables
```

---

## Step 2: Set Vercel Environment Variables

**Status:** READY TO EXECUTE

**Required variables (5 total):**

| Variable | Value | Scope | Secret |
|----------|-------|-------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | https://tfgtfhwvrswjvkyeyvsp.supabase.co | Production, Preview, Development | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (from Supabase) | Production, Preview, Development | No |
| `SUPABASE_SERVICE_ROLE_KEY` | (from Supabase) | Production only | **Yes** |
| `ADMIN_EMAILS` | your.email@corporateaisolutions.com,other.admin@example.com | Production, Preview, Development | No |

**How to set:**
1. Go to: https://vercel.com/dashboard
2. Select "Corporate-AI-Solutions" project
3. Settings → Environment Variables
4. Add each variable with appropriate scope
5. Click "Save"

**Getting Supabase keys:**
1. Go to: https://supabase.com/dashboard/project/tfgtfhwvrswjvkyeyvsp/settings/api
2. Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copy `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

**Setting ADMIN_EMAILS:**
- Enter your email(s) exactly as they appear in Supabase Auth
- Comma-separated for multiple admins
- Example: `you@example.com,admin@example.com`

**Verification:**
- [ ] All 5 vars visible in Vercel dashboard
- [ ] `SUPABASE_SERVICE_ROLE_KEY` shows as "Secret"
- [ ] No hardcoded values left in code

---

## Step 3: Push Code to Main Branch

**Status:** READY TO EXECUTE

**Current files ready:**
- `src/app/admin/pipeline/page.tsx` (dashboard)
- `src/app/admin/pipeline/[productId]/page.tsx` (detail view)
- `src/app/admin/pipeline/[productId]/execute/route.ts` (execute endpoint)
- `src/app/api/admin/pipeline/scan/route.ts` (scan endpoint)
- `src/app/api/admin/pipeline/[productId]/route.ts` (detail API)
- `src/app/api/admin/pipeline/[productId]/fix-gaps/route.ts` (fix-gaps endpoint)
- `src/lib/portfolio-scanner.ts` (scanner logic)
- `src/components/admin/*.tsx` (all UI components)
- `middleware.ts` (auth gate)

**How to push:**
```bash
cd C:\Users\denni\PycharmProjects\Corporate-AI-Solutions

# Check status
git status

# Stage all changes
git add -A

# Commit with message
git commit -m "Phase 2: Portfolio validation pipeline (ready for staging deployment)"

# Push to main
git push origin main

# Verify push succeeded
git log --oneline -5
```

**Vercel auto-deploys on push:**
- Go to: https://vercel.com/dashboard
- Select "Corporate-AI-Solutions"
- Watch for new deployment in Deployments list
- Build should succeed in <5 min

**Verification:**
- [ ] Commit appears in GitHub
- [ ] Vercel shows "Building..." then "Ready"
- [ ] No build errors in Vercel logs
- [ ] Staging URL available (vercel provides one)

---

## Step 4: Validate on Staging (1-2 Products)

**Status:** AFTER STEP 3 COMPLETE

**Timeline:** 1-2 hours

**Test with:**
- Product 1: Singify (has existing data, good test)
- Product 2: Deal-Findrs (minimal data, tests defaults)

**Test sequence:**
1. Navigate to `/admin/pipeline` in staging URL
   - Expected: See all 29 products listed
   - Screenshot: Initial dashboard state

2. Click on Singify detail page
   - Expected: Readiness score visible (likely 0%, ok for now)
   - Screenshot: Detail page initial state

3. Test fix-gaps endpoint
   ```bash
   curl -X POST https://staging-url/api/admin/pipeline/singify/fix-gaps \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```
   - Expected: 200 OK with fixed fields
   - Screenshot: API response

4. Refresh detail page
   - Expected: Fields now populated
   - Screenshot: After fix-gaps state

5. Test execute endpoint (dry-run)
   ```bash
   curl -X POST https://staging-url/api/admin/pipeline/singify/execute \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"dry_run": true}'
   ```
   - Expected: 200 OK with dry-run payload
   - Screenshot: Execute response

6. Check Supabase for audit events
   ```sql
   SELECT * FROM validation_events 
   WHERE product_slug = 'singify' 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```
   - Expected: 5+ events logged (fix-gaps, execute, etc.)

7. Repeat steps 2-6 with Deal-Findrs

**Success criteria:**
- ✅ Dashboard loads <2s
- ✅ Detail pages load <1s
- ✅ fix-gaps returns 200 OK
- ✅ execute returns 200 OK
- ✅ Events logged to DB
- ✅ No 500 errors
- ✅ No console errors

**If ANY fail:**
- Check Vercel logs (Deployments → Error log)
- Check Supabase connectivity
- Check env vars in Vercel
- Rollback and investigate

---

## Step 5: Promote to Production

**Status:** AFTER STAGING PASSES

**Timeline:** <5 min

**How to promote:**
```bash
# Option A: Via Vercel CLI (fastest)
vercel promote <staging-deployment-url>

# Option B: Via Vercel Dashboard
# Settings → Git → Select staging deployment → Promote to Production
```

**Verification after promote:**
- [ ] Production build succeeds
- [ ] Production URL works (https://corporate-ai-solutions.vercel.app)
- [ ] `/admin/pipeline` accessible with auth
- [ ] All 29 products visible
- [ ] No console errors

**At this point:**
- Phase 2 is LIVE in production
- Ready to begin 5-product validation test
- Start PHASE_2_VALIDATION_TEST_PLAN.md (Days 1-5)
- Begin PHASE_2_PRODUCTION_MONITORING.md (Days 1-7)

---

## Deployment Status Tracker

| Step | Status | Date | Notes |
|------|--------|------|-------|
| 1. Apply migrations | ⏳ Pending | — | Ready to execute |
| 2. Set env vars | ⏳ Pending | — | 5 vars needed |
| 3. Push code | ⏳ Pending | — | Ready to commit |
| 4. Validate staging | ⏳ Pending | — | After Step 3 |
| 5. Promote to prod | ⏳ Pending | — | After Step 4 |
| **Deployment complete** | ⏳ Pending | — | — |
| 5-product validation | ⏳ Pending | — | Days 1-5 post-deploy |
| 7-day monitoring | ⏳ Pending | — | Days 1-7 post-deploy |
| Phase 3 decision | ⏳ Pending | — | End of Day 7 |

---

## Rollback Procedures (If Needed)

### Quick Rollback (Code)
```bash
git revert <commit-hash>
git push origin main
# Vercel auto-redeploys to previous version
# Downtime: ~2 min
```

### Full Rollback (Code + DB)
```bash
# Revert code first (above)

# Then in Supabase SQL editor, drop tables:
DROP TABLE validation_events CASCADE;
DROP TABLE product_validation_status CASCADE;

# Tables gone, ready to re-apply migrations when issue is fixed
```

### Decision Tree
- Build fails → Revert code only (tables stay)
- Dashboard 500 error → Check env vars first, then revert
- Performance issue → Revert and investigate separately
- Data corruption → Revert both code + DB

---

## Success Criteria for Deployment

### All 5 steps complete if:
- ✅ Migrations applied successfully
- ✅ All 5 env vars set in Vercel
- ✅ Code pushed to main branch
- ✅ Staging validation passed (1-2 products, all endpoints work)
- ✅ Production promoted from staging
- ✅ Production `/admin/pipeline` loads without auth errors
- ✅ Ready to begin 5-product validation

### Phase 2 production-ready if:
- ✅ All above complete
- ✅ 5-product validation test runs successfully (Days 1-5)
- ✅ 7-day production monitoring shows stability (Days 1-7)
- ✅ All success criteria in PHASE_2_PRODUCTION_MONITORING.md met
- ✅ Zero critical errors in Week 1

---

## Post-Deployment Support

### If Issues Found

**Dashboard won't load:**
- Check middleware auth (middleware.ts)
- Check ADMIN_EMAILS in Vercel env
- Check browser cookies cleared

**API endpoints 500:**
- Check Supabase connectivity
- Check env vars all present
- Check migration files applied

**Performance slow:**
- Check database query times
- Monitor Vercel serverless execution
- Check cache headers (5m for scan)

**Fix and redeploy:**
```bash
# Fix code locally
npm run build
npm run dev  # test

# Then push
git add -A
git commit -m "Phase 2: Fix [issue]"
git push origin main

# Vercel auto-redeploys
```

---

## Next: After Deployment Complete

1. **Immediately after promotion to production:**
   - Brief verification (dashboard loads, auth works)
   - Announce Phase 2 is live
   - Begin 5-product validation test

2. **Days 1-5: Run 5-product validation test**
   - Follow PHASE_2_VALIDATION_TEST_PLAN.md exactly
   - Document time-to-ready, gaps fixed, errors
   - Take screenshots of each state

3. **Days 1-7: Monitor production daily**
   - Follow PHASE_2_PRODUCTION_MONITORING.md daily checklist
   - Track performance and errors
   - Log any issues

4. **Day 7: Final decision**
   - Review all success criteria
   - Make Phase 3 go/no-go decision
   - Plan next phase if approved

---

**Ready to begin deployment?**

Answer "yes" to proceed with Step 1 (Apply Supabase migrations).

