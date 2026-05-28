# Phase 1 Deployment Guide: Public Tour Mode + Admin Request Management

**Status:** Ready for Deployment  
**Created:** 2026-05-28  
**Target:** Vercel Staging & Production

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing locally (see PHASE_1_TESTING_GUIDE.md)
- [ ] No console errors or warnings in browser
- [ ] No TypeScript errors: `npm run build` succeeds
- [ ] Linting passes: `npm run lint`
- [ ] Responsive design verified (375px + 1440px)

### Supabase Setup
- [ ] Migrations applied to remote database
  - [ ] `validation_access_requests` table created
  - [ ] `products` table has methodology-cockpit seed
  - [ ] RLS policies enabled
  - [ ] Indexes created
- [ ] Service role key stored securely
- [ ] Auth Site URL configured correctly
- [ ] Callback/redirect URLs allowlisted

### Environment Variables (Vercel)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set (secret)
- [ ] `RESEND_API_KEY` set (optional, for email notifications)
- [ ] `ADMIN_EMAILS` set (comma-separated emails of admins)

### Code Cleanup
- [ ] No uncommitted changes: `git status` clean
- [ ] All new files staged and committed
- [ ] Commit message is descriptive: `git log --oneline -5`
- [ ] No debug `console.log()` left in code
- [ ] No hardcoded credentials or secrets

### Documentation
- [ ] PHASE_1_TESTING_GUIDE.md updated with results
- [ ] PHASE_1_DEPLOYMENT_GUIDE.md (this file) complete
- [ ] README.md updated if relevant
- [ ] Component JSDoc comments present

---

## Deployment Steps

### Step 1: Create Git Commit

```bash
cd C:\Users\denni\PycharmProjects\Corporate-AI-Solutions

# Review changes
git status
git diff src/

# Stage all changes
git add -A

# Create descriptive commit
git commit -m "Phase 1: Public tour mode + admin access requests dashboard

- Add PublicTourMode component: hero, diagram, SayFix example, CTA
- Add AccessRequestForm: validates inputs, submits to API
- Add /admin/cockpit/requests: admin dashboard for managing requests
  - List/filter/sort requests by status, role, date
  - Update status and add notes
  - Bulk mark as contacted
- Create useAuth() hook for client-side auth detection
- Add /api/validation/request-access endpoint
- Create validation_access_requests table schema
- Seed methodology-cockpit product as example
- Export PublicProductCard from corporate-components

Tested:
- Public tour renders for unauthenticated users
- Access request form validates and submits
- Admin dashboard lists and filters requests
- Responsive design (mobile + desktop)
- API endpoint validation"

# Push to GitHub
git push origin main
```

### Step 2: Verify Vercel Environment

Check that Vercel has the correct environment variables set:

```bash
# List Vercel environment variables
vercel env ls
```

Expected output should show:
```
NEXT_PUBLIC_SUPABASE_URL          (public)
NEXT_PUBLIC_SUPABASE_ANON_KEY     (public)
SUPABASE_SERVICE_ROLE_KEY         (secret)
RESEND_API_KEY                    (secret)
ADMIN_EMAILS                      (secret)
```

If any are missing, add them:

```bash
# Add environment variable (interactive)
vercel env add VARIABLE_NAME

# Or set via Vercel dashboard: vercel.com/settings/environment-variables
```

### Step 3: Deploy to Staging (Preview)

Vercel automatically creates preview deployments on every push. Check the GitHub PR or Vercel dashboard:

```bash
# Deploy to staging (if not automatic)
vercel --prod  # Deploy to production

# Or deploy preview:
vercel  # Deploy to preview URL
```

Expected:
- Build succeeds (no TypeScript errors)
- Deployment URL generated (e.g., `https://corporate-ai-solutions-staging.vercel.app`)
- Logs show no errors

### Step 4: Test on Staging

Visit the staging URL and run through test scenarios:

```bash
# Staging URL (from Vercel dashboard)
https://corporate-ai-solutions-staging.vercel.app
```

**Quick smoke test (15 minutes):**
1. Visit `/admin/methodology` (unauthenticated)
   - Expected: See public tour (not cockpit)
2. Click "Request Access"
   - Fill form with test data
   - Submit
   - Expected: Success message
3. Sign in as admin
   - Visit `/admin/cockpit/requests`
   - Expected: See the request you just submitted
   - Expected: Can update status and add notes

**Full test:** See PHASE_1_TESTING_GUIDE.md scenarios 1-5

### Step 5: Monitor Logs & Performance

**Browser console:**
- Open DevTools (F12)
- Check Console tab for errors/warnings
- Expected: No red errors

**Vercel logs:**
```bash
vercel logs  # Stream live logs
```

**Performance:**
- Open `https://corporate-ai-solutions-staging.vercel.app`
- Run Lighthouse (DevTools → Lighthouse)
- Expected:
  - Performance: > 80
  - Accessibility: > 90
  - Best Practices: > 90

### Step 6: Verify Migrations Are Applied

Query the Supabase database to confirm tables exist:

```bash
# Via Supabase dashboard
# Go to: https://supabase.com/dashboard/project/tfgtfhwvrswjvkyeyvsp/sql/new
# Run:

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('validation_access_requests', 'products');

-- Expected: 2 rows (both tables exist)

-- Check if validation_access_requests table has our test data:
SELECT count(*) FROM validation_access_requests;
```

### Step 7: Verify Email Notifications (if RESEND_API_KEY set)

If `RESEND_API_KEY` is configured:

1. Submit an access request via staging
2. Check email inbox (should receive notification)
3. Email should include:
   - From: `noreply@updates.corporateaisolutions.com`
   - Subject: "New access request: [Name]"
   - Body: Includes link to admin dashboard

If no email arrives:
- Check RESEND_API_KEY is set correctly
- Check Resend dashboard for delivery logs
- Check spam folder

---

## Rollback Plan

If issues arise, rollback is simple (git + Vercel auto-rollback):

```bash
# Identify the last good commit
git log --oneline -10

# Revert the Phase 1 commit
git revert <commit-hash>
git push origin main

# Vercel will automatically redeploy with the previous commit
```

---

## Post-Deployment Monitoring (24 hours)

### Metrics to Track

1. **Access Requests**
   - [ ] Number of requests per day
   - [ ] Request sources (referrer)
   - [ ] Conversion rate (requests → approved → users)

2. **Performance**
   - [ ] Page load times (avg < 2s)
   - [ ] API endpoint response times (avg < 200ms)
   - [ ] Error rates (target: < 0.1%)

3. **Errors**
   - [ ] Check Vercel logs for 500 errors
   - [ ] Check Supabase logs for RLS violations
   - [ ] Check browser console errors (track via Sentry if integrated)

### Daily Checklist (First 24 Hours)

- [ ] Public tour page loads without errors
- [ ] Access request form works end-to-end
- [ ] Admin dashboard accessible and functional
- [ ] No database connection errors
- [ ] No email delivery failures (if enabled)
- [ ] Responsive design verified on real devices (mobile + desktop)
- [ ] No unintended redirects or 404s

---

## Promotion to Production

Once staging is stable and tested:

### Step 1: Final Production Checklist
- [ ] All staging tests passing
- [ ] 24-hour monitoring completed with no issues
- [ ] Team sign-off received
- [ ] Backup of production database taken (Supabase)
- [ ] Rollback plan documented and tested

### Step 2: Deploy to Production

```bash
# Ensure staging is stable, then deploy to production
vercel --prod
```

### Step 3: Production Verification

Run same smoke test on production URL:
- [ ] Public tour loads
- [ ] Access request form works
- [ ] Admin dashboard accessible
- [ ] Email notifications send (if enabled)

### Step 4: Announce

- [ ] Update status page / announcement
- [ ] Notify team of deployment
- [ ] Share public tour link with stakeholders
- [ ] Monitor feedback channels for issues

---

## File Summary

### New Files
- `src/hooks/useAuth.ts` — Auth state hook
- `src/app/admin/cockpit/requests/page.tsx` — Admin requests dashboard
- `src/components/admin/AccessRequestsTable.tsx` — Request table with inline editing
- `src/components/admin/AccessRequestFilters.tsx` — Filter/sort controls
- `PHASE_1_TESTING_GUIDE.md` — Comprehensive testing guide
- `PHASE_1_DEPLOYMENT_GUIDE.md` — This deployment guide

### Updated Files
- `src/app/admin/methodology/page.tsx` — Dual-mode routing (already in place)
- `packages/corporate-components/src/index.ts` — Export PublicProductCard

### Database Migrations
- `supabase/migrations/20260526_validation_access_requests.sql` — Access requests table
- `supabase/migrations/20260526_seed_methodology_cockpit_product.sql` — Example product
- `supabase/migrations/20260526_validation_voice_sessions.sql` — Voice sessions table (pre-existing)

---

## Success Criteria

**Phase 1 is complete when:**
- ✅ All local tests passing
- ✅ Staging deployment successful
- ✅ 24-hour production monitoring with no issues
- ✅ Public tour accessible and working
- ✅ Admin request dashboard functional
- ✅ Zero 5xx errors in logs
- ✅ Email notifications working (if enabled)
- ✅ Responsive design verified on real devices

**Phase 1 Ready for → Phase 2: Portfolio Pipeline Dashboard**

---

## Troubleshooting

### Issue: "Supabase table not found" error

**Cause:** Migrations not applied to remote database

**Solution:**
1. Visit Supabase dashboard
2. Go to SQL Editor: https://supabase.com/dashboard/project/tfgtfhwvrswjvkyeyvsp/sql/new
3. Copy+paste each migration file and run
4. Verify tables exist (see Step 6 above)

### Issue: "Unauthorized" error on /admin/cockpit/requests

**Cause:** User email not in ADMIN_EMAILS list

**Solution:**
1. Check middleware.ts ADMIN_EMAILS (line 10)
2. Add your email to the list
3. Redeploy
4. Sign out and sign back in

### Issue: Access request form shows "API error"

**Cause:** API endpoint issue or Supabase connection problem

**Solution:**
1. Check browser console for detailed error
2. Check Vercel logs: `vercel logs`
3. Verify Supabase service role key is set
4. Verify table exists in Supabase
5. Check RLS policies (should allow public INSERT)

### Issue: Email not arriving

**Cause:** RESEND_API_KEY missing or Resend account not verified

**Solution:**
1. Verify RESEND_API_KEY is set: `vercel env ls`
2. Check Resend dashboard for API key validity
3. Verify sender email is authorized (should be noreply@updates.corporateaisolutions.com)
4. Check spam folder
5. If still failing, disable email notifications (API will still work, just won't email)

### Issue: Slow page load

**Cause:** Large bundle size or slow network

**Solution:**
1. Check bundle size: `npm run build`
2. Check Lighthouse performance score
3. Verify Supabase connection is fast (check query times)
4. Consider caching or optimization if needed

---

## Contact & Support

**Deployment issues?**
- Check logs: `vercel logs`
- Review env vars: `vercel env ls`
- Test locally first: `npm run dev`

**Database issues?**
- Supabase dashboard: https://supabase.com/dashboard
- Check RLS policies
- Verify migrations are applied

**Email issues?**
- Resend dashboard: https://resend.com/emails
- Check API key and verified senders

---

**Next Phase:** Phase 2 — Build portfolio pipeline command center dashboard

