# Phase 2 Deployment Checklist

**Status:** Ready to Deploy  
**Target:** Production (Internal Use Only)  
**Timeline:** Deploy today, stabilize for 1 week before Phase 3

---

## Pre-Deployment (Local Testing)

### ✅ Code Build
```bash
cd Corporate-AI-Solutions
npm run build
npm run lint
```
Expected: ✓ No errors, no TypeScript issues

### ✅ Dependencies
Ensure you have YAML parser installed (used by portfolio-scanner.ts):
```bash
npm list yaml
```
If not installed:
```bash
npm install yaml
```

### ✅ Local Dev Test
```bash
npm run dev
# Visit http://localhost:3000/admin/pipeline
```
Expected:
- Page loads
- Shows "Scanning portfolio..." briefly
- Lists all 29 products
- Summary stats appear (0% readiness for all, since DB is empty)
- Sorting/filtering works

### ✅ Database Setup
Run the two migrations via Supabase SQL editor:
1. Copy `supabase/migrations/20260528_product_validation_status.sql`
   - Visit: https://supabase.com/dashboard/project/tfgtfhwvrswjvkyeyvsp/sql/new
   - Paste + Run
   - Verify table created: `SELECT COUNT(*) FROM product_validation_status;`

2. Copy `supabase/migrations/20260528_validation_events.sql`
   - Paste + Run
   - Verify table created: `SELECT COUNT(*) FROM validation_events;`

### ✅ Auth Testing
1. Sign in via `/pipeline/login` with admin email
2. Verify email is in `ADMIN_EMAILS` (middleware.ts line 10)
3. Visit `/admin/pipeline`
   - Expected: Dashboard loads, you see products
4. Sign out, visit `/admin/pipeline`
   - Expected: Redirected to `/pipeline/login` (middleware protection)

---

## Deployment (Vercel)

### Step 1: Commit & Push
```bash
cd Corporate-AI-Solutions
git add -A
git commit -m "Phase 2: Portfolio validation pipeline command center

- Add product_validation_status table schema
- Add validation_events audit trail
- Add portfolio scanner script
- Build /admin/pipeline dashboard
- Build /admin/pipeline/[productId] detail view
- Admin-only access via middleware

Scans all 29 products from manifest, shows readiness scores,
lists gaps and action items. Factory control center is ready."

git push origin main
```

### Step 2: Verify Vercel Deploy
- Vercel automatically deploys on push
- Check: https://vercel.com/dashboard → your-project
- Expected: ✓ Deployment succeeds (no errors)

### Step 3: Run Migrations on Production Supabase
Same as local:
1. Apply `20260528_product_validation_status.sql`
2. Apply `20260528_validation_events.sql`

### Step 4: Test on Production
```bash
# Your production URL (example)
https://corporate-ai-solutions.vercel.app/admin/pipeline
```
Expected:
- Loads quickly (~1s)
- Shows all 29 products
- Sorting/filtering works
- Auth required (middleware works)

---

## Post-Deployment (1 Week)

### Daily (Every Day)
- [ ] Check Vercel logs for errors
- [ ] Test dashboard loads quickly
- [ ] Verify auth is working (can't access without admin email)

### Manual Pipeline Run (Days 1-7)
Pick 5 products and run through the factory manually:

**Product 1: `singify`**
1. Visit `/admin/pipeline/singify`
2. Check readiness score (should be 0% initially)
3. Check gaps listed (promise, distributor, end-user, friction, commitment)
4. Check action items in priority order
5. Note: In Phase 4, you'll fill these fields

**Product 2: `mmcbuild`**
1. Same as Product 1
2. Note client details (R3 sanitization rules apply)

**Product 3: `deal-findrs`**
**Product 4: `connexions`**
**Product 5: `kira`**
- Repeat the above process

### Observations (After 5 Products)
Document findings:
- Are gaps correctly identified?
- Are action items in the right priority order?
- Does readiness score make sense?
- Are there any edge cases?
- Any bugs in sorting/filtering?

### Weekly Audit
- [ ] Dashboard responsive on mobile + desktop
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Auth gates working correctly

---

## If Issues Found

### Issue: Dashboard won't load
```
Check:
1. Migrations applied correctly (SELECT COUNT(*) FROM product_validation_status;)
2. Auth middleware working (can you access authenticated pages?)
3. Portfolio scanner can read manifest (npm run dev → check console)
4. No YAML parsing errors
```

### Issue: Products show 0% readiness
```
Check:
1. Tables created but empty → EXPECTED for Phase 2
2. Next phase (Phase 4) will populate these via form/LLM
3. This is correct behavior
```

### Issue: Sorting/filtering broken
```
Check:
1. Browser console for JS errors
2. Table receives correct props
3. Sort logic in PipelineTable.tsx
```

### Issue: Auth not working
```
Check:
1. Middleware.ts ADMIN_EMAILS list (line 10)
2. Your email is in the list
3. You're signed in (check auth.users table in Supabase)
4. Cookies are being set (DevTools → Application → Cookies)
```

---

## Success Criteria: Phase 2 Stable

After 1 week, Phase 2 is ready for Phase 3 if:

- ✅ Dashboard loads in < 2s
- ✅ All 29 products appear in the list
- ✅ Sorting works (readiness, name, updated)
- ✅ Filtering works (all, ready, in-progress, draft, paused)
- ✅ Detail pages load for each product
- ✅ Gaps are correctly identified
- ✅ Action items are prioritized
- ✅ Auth is working (admin-only access)
- ✅ No console errors
- ✅ Responsive on mobile + desktop
- ✅ Zero critical bugs
- ✅ Performance acceptable

---

## Next Phase (Phase 3)

Only after Phase 2 is stable:

### Phase 3: Public Tour + Lead Capture
- Move public tour from `/admin/methodology` to `/methodology` (public route)
- Add demo dashboard view (read-only, no auth needed)
- Add case studies + testimonials
- Enable "Request Access" form

This is when the factory becomes visible to the outside world.

---

## Important Reminders

1. **Phase 2 is for internal use only** — Don't share the URL publicly yet
2. **Phase 2 has no field editing** — Everything is read-only, that's expected (Phase 4)
3. **Phase 2 has no LLM prefill** — Fields are empty, that's expected (Phase 5)
4. **Phase 2 has no outreach** — The "Run Outreach" button is disabled, that's expected (Phase 6)
5. **Run 5 products through manually** — Verify the factory logic works before building more features

---

## Rollback Plan

If something breaks:

```bash
# Revert the commit
git revert <commit-hash>
git push origin main

# Vercel auto-redeploys to previous version
# Delete the new Supabase tables if they caused issues:
# DROP TABLE validation_events CASCADE;
# DROP TABLE product_validation_status CASCADE;
```

---

## Questions?

Refer to:
- **Architecture:** `PHASE_2_COMPLETION.md`
- **Code docs:** Inline comments in all components
- **Scanner logic:** `src/lib/portfolio-scanner.ts`

---

**Deploy now. Stabilize for 1 week. Then Phase 3.**

