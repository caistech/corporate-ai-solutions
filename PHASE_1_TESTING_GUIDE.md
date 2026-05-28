# Phase 1 Testing Guide: Public Tour Mode + Admin Request Management

**Status:** Ready for Testing  
**Created:** 2026-05-28  
**Phase:** 1 of 2 (Phase 2 = Portfolio Pipeline Dashboard)

---

## Setup Checklist

Before running tests, complete these one-time setup steps:

### 1. Environment Variables

Ensure `.env.local` in Corporate-AI-Solutions has:

```bash
# Supabase (from dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://tfgtfhwvrswjvkyeyvsp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Resend API (optional, email notifications)
RESEND_API_KEY=re_xxx

# Admin contact for access request notifications
ADMIN_EMAIL=your.email@example.com
```

### 2. Supabase Migrations

The migrations need to be applied to the remote Supabase database:

```bash
# Option A: Via SQL Editor (fastest for testing)
# Visit: https://supabase.com/dashboard/project/tfgtfhwvrswjvkyeyvsp/sql/new
# Copy+paste the SQL from these files:
#   cais-shared-services/supabase/migrations/20260526_validation_access_requests.sql
#   cais-shared-services/supabase/migrations/20260526_seed_methodology_cockpit_product.sql
#   cais-shared-services/supabase/migrations/20260526_validation_voice_sessions.sql
# Click "Run" for each

# Option B: Via Supabase CLI (if migration sync is resolved)
# cd cais-shared-services
# supabase db push
```

### 3. NPM Dependencies

Ensure corporate-components is installed with PublicProductCard export:

```bash
cd Corporate-AI-Solutions
npm install @caistech/corporate-components@latest
```

---

## Test Scenarios

### Scenario 1: Public Tour (Unauthenticated User)

**Goal:** Verify unauthenticated users see the public tour, not the cockpit.

**Steps:**

1. **Start dev server:**
   ```bash
   cd Corporate-AI-Solutions
   npm run dev
   ```

2. **Open in browser:**
   ```
   http://localhost:3000/admin/methodology
   ```

3. **Expected result:**
   - ✅ **Loading spinner** appears briefly (useAuth hook checking auth state)
   - ✅ **Public Tour Mode** renders (NOT cockpit)
   - ✅ Hero section visible with title: "AI-powered pipeline for validating SaaS ideas in 4 weeks"
   - ✅ CTA button: "Request Access" visible
   - ✅ 3-step diagram: Define → Validate → Gate & Launch
   - ✅ SayFix example card shows with gate scores (6/6 hard gates, 87% weighted)
   - ✅ Gate score colors: Green for ✓ PASS

4. **Verify responsive:**
   - On mobile (375px): Sections stack vertically, button full-width
   - On laptop (1440px): Sections side-by-side, button appropriately sized

---

### Scenario 2: Access Request Form Submission

**Goal:** Verify form validation and API submission.

**Prerequisites:**
- Running from Scenario 1 (public tour loaded)

**Steps:**

1. **Click "Request Access" button**
   - Expected: Modal overlay appears with AccessRequestForm

2. **Test validation:**
   - Leave name empty, click submit
     - Expected: ❌ Red error message: "Missing required fields"
   - Fill name "Test User", invalid email "not-an-email", submit
     - Expected: ❌ Red error message: "Invalid email format"
   - Select role "Other", leave company empty, submit
     - Expected: ❌ Red error message: "Missing required fields"

3. **Submit valid form:**
   - Fill all fields:
     - Name: "Alice Founder"
     - Email: "alice@startup-test.com"
     - Company: "Startup Inc"
     - Role: "founder"
   - Click submit
     - Expected: 🔄 Button shows "Submitting..." spinner
     - Expected: API calls `/api/validation/request-access` (POST)
     - Expected: ✅ Green success message: "We'll contact you within 24 hours"
     - Expected: Form closes after 3 seconds

4. **Verify Supabase:**
   - Navigate to: https://supabase.com/dashboard/project/tfgtfhwvrswjvkyeyvsp/editor
   - Query the `validation_access_requests` table
   - Expected: New row with:
     - name: "Alice Founder"
     - email: "alice@startup-test.com"
     - company: "Startup Inc"
     - role: "founder"
     - status: "pending"
     - created_at: ~now

5. **Check email (if RESEND_API_KEY set):**
   - Check email inbox for notification from noreply@updates.corporateaisolutions.com
   - Expected: Email subject includes "New access request: Alice Founder"
   - Expected: Email body includes link to `/admin/cockpit/requests`

---

### Scenario 3: Admin Requests Dashboard

**Goal:** Verify authenticated admin can view and manage requests.

**Prerequisites:**
- Have a valid Supabase user account (sign up via `/pipeline/login` first)
- User email must be in ADMIN_EMAILS (see middleware.ts, line 10)
- At least one access request created (from Scenario 2)

**Steps:**

1. **Sign in:**
   - Navigate to: `http://localhost:3000/pipeline/login`
   - Enter email and password (create account if needed)
   - Sign in successfully
   - Expected: ✅ Redirect to `/pipeline/today` (or dashboard)

2. **Navigate to requests:**
   - Go to: `http://localhost:3000/admin/cockpit/requests`
   - Expected: ✅ Page loads (no 401 error)
   - Expected: ExplanatoryHeader: "Manage public requests for methodology cockpit access..."

3. **View requests table:**
   - Expected: Summary stats show:
     - ⏳ Pending: 1 (or more if multiple tests)
     - 📞 Contacted: 0 (or count of contacted)
     - ✅ Approved: 0 (or count of approved)
   - Expected: Table shows columns:
     - Name | Company | Role | Status | Submitted | Actions
   - Expected: Row for "Alice Founder"
     - Status badge: Yellow "pending" (clickable)
     - Submitted: "X minutes ago"

4. **Expand request:**
   - Click on "Alice Founder" row (or chevron)
   - Expected: Row expands to show:
     - Email: alice@startup-test.com (clickable mailto link)
     - Company: Startup Inc
     - Submitted: Full date/time
     - Contacted: (empty if not yet contacted)
     - Notes: "No notes yet" (gray italic)

5. **Add notes:**
   - Click "Add Notes" button
   - Expected: Textarea appears with placeholder "Add notes about this request..."
   - Type: "Great founder background, strong demand signal"
   - Click "Save"
   - Expected: ✅ Notes saved in DB
   - Expected: Notes visible when expanded (no longer gray)

6. **Cycle status:**
   - Click on yellow "pending" badge
   - Expected: Status cycles to next: "contacted"
   - Expected: ✅ Blue "contacted" badge
   - Expected: "Contacted" timestamp appears
   - Expected: Contacted count increments to 1

7. **Bulk mark as contacted:**
   - (Reset: Change status back to "pending" if needed)
   - Expected: Button appears: "Mark X as Contacted"
   - Click button
   - Expected: ✅ All pending requests marked as "contacted"
   - Expected: Contacted timestamps set
   - Expected: Button disappears (no pending requests)

8. **Filter requests:**
   - Click filter dropdown: "All Statuses"
   - Select "contacted"
   - Expected: ✅ Table shows only contacted requests
   - Select "pending"
   - Expected: ✅ Table shows only pending requests (should be empty now)
   - Select "all"
   - Expected: ✅ All requests visible again

9. **Sort requests:**
   - Click sort dropdown: "Newest First"
   - Expected: Requests sorted by created_at (descending, newest first)
   - Select "Name (A-Z)"
   - Expected: Requests sorted alphabetically by name
   - Expected: Sort order button disappears (always A-Z for names)
   - Select "Last Contacted"
   - Expected: Requests sorted by contacted_at (newest first)

---

### Scenario 4: Authentication Edge Cases

**Goal:** Verify auth detection and routing works correctly.

**Steps:**

1. **Unauthenticated → tour:**
   - Sign out (if logged in)
   - Visit: `http://localhost:3000/admin/methodology`
   - Expected: ✅ Redirected to `/pipeline/login` (middleware redirects)
   - Expected: ❌ Public tour does NOT appear (auth check happens server-side)

2. **Authenticated + non-admin → denied:**
   - Create second test account with email NOT in ADMIN_EMAILS
   - Sign in with that account
   - Visit: `http://localhost:3000/admin/cockpit/requests`
   - Expected: ❌ 403 Forbidden (middleware denies access)
   - Expected: Redirected to `/` (home)

3. **Authenticated + admin → allowed:**
   - Sign in with admin email
   - Visit: `http://localhost:3000/admin/cockpit/requests`
   - Expected: ✅ Page loads and shows requests

4. **Hard refresh test:**
   - Log in as admin
   - Press F5 (hard refresh)
   - Expected: ✅ useAuth hook re-checks auth state
   - Expected: ✅ Page still renders (not a 401)
   - Expected: ✅ No flashing between tour and cockpit

---

### Scenario 5: API Endpoint Tests

**Goal:** Verify API endpoint handles requests/responses correctly.

**Prerequisites:**
- Dev server running (`npm run dev`)

**Steps:**

1. **Valid request:**
   ```bash
   curl -X POST http://localhost:3000/api/validation/request-access \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Admin",
       "email": "test.admin@example.com",
       "company": "Test Corp",
       "role": "founder"
     }'
   ```
   Expected response (201 Created):
   ```json
   {
     "success": true,
     "message": "We'll contact you within 24 hours",
     "requestId": "550e8400-e29b-41d4-a716-446655440000"
   }
   ```

2. **Missing fields:**
   ```bash
   curl -X POST http://localhost:3000/api/validation/request-access \
     -H "Content-Type: application/json" \
     -d '{"name": "Test", "email": "test@example.com"}'
   ```
   Expected response (400 Bad Request):
   ```json
   {
     "error": "Missing required fields: company, role"
   }
   ```

3. **Invalid email:**
   ```bash
   curl -X POST http://localhost:3000/api/validation/request-access \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test",
       "email": "not-an-email",
       "company": "Test Corp",
       "role": "founder"
     }'
   ```
   Expected response (400 Bad Request):
   ```json
   {
     "error": "Invalid email format"
   }
   ```

4. **Invalid role:**
   ```bash
   curl -X POST http://localhost:3000/api/validation/request-access \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test",
       "email": "test@example.com",
       "company": "Test Corp",
       "role": "invalid-role"
     }'
   ```
   Expected response (400 Bad Request):
   ```json
   {
     "error": "Invalid role"
   }
   ```

5. **GET requests (authenticated):**
   ```bash
   # Get all requests
   curl -X GET http://localhost:3000/api/validation/request-access \
     -H "Authorization: Bearer YOUR_AUTH_TOKEN"
   ```
   Expected: 200 OK with array of requests

   **Without auth:**
   ```bash
   curl -X GET http://localhost:3000/api/validation/request-access
   ```
   Expected response (401 Unauthorized):
   ```json
   {
     "error": "Authentication required"
   }
   ```

---

## Responsive Design Checks

### Mobile (375px width)
- [ ] Hero section: Full-width, stacks vertically
- [ ] CTA button: Full-width, tap-friendly (44px+ height)
- [ ] 3-step diagram: Stacks vertically or reformats for mobile
- [ ] SayFix card: Readable text, no truncation
- [ ] Gate score bars: Scale proportionally
- [ ] Modal form: Full-width with proper padding
- [ ] Admin table: Horizontal scroll container if needed, or collapse to card view
- [ ] Filters: Stack vertically or compress into dropdown
- [ ] Touch targets: Min 44×44px for all buttons

### Laptop (1440px width)
- [ ] Hero: Centered, max-width container (1280px)
- [ ] CTA buttons: Appropriately sized (not full-width)
- [ ] 3-step diagram: Horizontal layout with proper spacing
- [ ] SayFix card: Part of layout, not cramped
- [ ] Admin table: Full horizontal layout, no truncation
- [ ] Filters: Inline, not stacking
- [ ] Typography: Readable line lengths, no text wrapping issues
- [ ] Spacing: Consistent gutters and margins

---

## Performance Checks

- [ ] Page load time: < 3s on 3G (Lighthouse)
- [ ] First Contentful Paint: < 1.5s
- [ ] Largest Contentful Paint: < 2.5s
- [ ] Cumulative Layout Shift: < 0.1
- [ ] No console errors or warnings
- [ ] Images: Lazy-loaded, optimized
- [ ] Bundle size: No unexpected growth

---

## Known Issues & Workarounds

### Migration Sync Issue
- **Issue:** `supabase db push` fails due to migration history mismatch
- **Workaround:** Apply migrations via Supabase SQL editor (paste + run)
- **Status:** To be resolved in CI/CD setup

### useAuth Hook Auth Check
- **Note:** Middleware (server-side) gates `/admin/*` routes
- **Public tour route:** Not gated by middleware, so public tour would render
- **Behavior:** Page shows loading spinner while useAuth checks, then renders tour or cockpit
- **This is correct:** Unauthenticated users should see public tour, not 401

---

## Post-Test Actions

### If All Tests Pass:
1. Mark "1A: Test public tour locally" as **completed**
2. Proceed to **step 1D: Deploy to staging**

### If Tests Fail:
1. Document the failure (step, error, expected vs actual)
2. Check the relevant component/API file
3. Read the file, identify root cause
4. Fix the issue
5. Re-test the scenario
6. Commit the fix: `git add . && git commit -m "Fix: [scenario] [issue]"`

---

## Test Result Summary Template

```markdown
# Phase 1 Testing Results — [Date]

## Scenario Results
- [ ] Scenario 1: Public Tour — PASS / FAIL
- [ ] Scenario 2: Access Request Form — PASS / FAIL
- [ ] Scenario 3: Admin Requests Dashboard — PASS / FAIL
- [ ] Scenario 4: Auth Edge Cases — PASS / FAIL
- [ ] Scenario 5: API Endpoint Tests — PASS / FAIL

## Responsive Design
- [ ] Mobile (375px) — PASS / FAIL
- [ ] Laptop (1440px) — PASS / FAIL

## Performance
- [ ] Lighthouse Score: [score]
- [ ] Load time: [time]s
- [ ] No console errors: YES / NO

## Issues Found
1. [Issue 1]
   - Scenario: [step]
   - Expected: [what should happen]
   - Actual: [what happened]
   - Fix: [applied / pending]

## Ready for Deploy?
- [ ] All tests passing
- [ ] No console errors
- [ ] Responsive design OK
- [ ] Performance acceptable
- [ ] 👉 Ready for step 1D (staging deploy)
```

---

## Files Modified in Phase 1

```
Corporate-AI-Solutions/
├── src/
│   ├── hooks/
│   │   └── useAuth.ts                    [NEW] Auth detection hook
│   ├── app/
│   │   ├── admin/
│   │   │   ├── methodology/
│   │   │   │   └── page.tsx              [UPDATED] Dual-mode routing
│   │   │   └── cockpit/
│   │   │       └── requests/
│   │   │           └── page.tsx          [NEW] Admin requests dashboard
│   │   └── api/
│   │       └── validation/
│   │           └── request-access/
│   │               └── route.ts          [EXISTING] Access request API
│   └── components/
│       └── admin/
│           ├── PublicTourMode.tsx        [EXISTING] Public tour UI
│           ├── AccessRequestForm.tsx     [EXISTING] Request form
│           ├── AccessRequestsTable.tsx   [NEW] Admin table component
│           ├── AccessRequestFilters.tsx  [NEW] Filter/sort controls
│           └── MethodologyCockpit.tsx    [EXISTING] Stub authenticated view

cais-shared-services/
├── packages/
│   └── corporate-components/
│       └── src/
│           ├── index.ts                  [UPDATED] Export PublicProductCard
│           └── PublicProductCard.tsx     [EXISTING] Card component
└── supabase/
    └── migrations/
        ├── 20260526_validation_access_requests.sql         [EXISTING]
        ├── 20260526_seed_methodology_cockpit_product.sql   [EXISTING]
        └── 20260526_validation_voice_sessions.sql          [EXISTING]
```

---

**Next Steps After Phase 1:**
1. ✅ Passing all local tests → Deploy to staging (1D)
2. ✅ Staging tests pass → Deploy to production
3. ✅ Monitor request volume and feedback
4. ➡️ Begin Phase 2: Portfolio Pipeline Dashboard

