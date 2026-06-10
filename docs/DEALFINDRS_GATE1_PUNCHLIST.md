# deal-findrs → Gate-1 Punch-List + Pipeline-Flow Fixes

> **Prepared:** 2026-06-10. Evidence base: cockpit `tfgtfhwvrswjvkyeyvsp` readiness data (06-07) +
> the 09:22 UTC `validation-run` (27266481768) logs + live URL probes.
> **Bottom line:** deal-findrs is experientially Gate-1-ready. It's blocked by **3 mechanical
> provisioning items** on the product, and the pipeline didn't refresh it today because of **1
> one-line producer bug** (+ 2 reliability hardening items) in the orchestrator.

---

## PART A — deal-findrs product fixes (repo `dennissolver/deal-findrs`, Supabase `obakurzlpzisflnnjzzo`)

### A1. Provision the standard QA user-agent  → fixes `VT_D2` fail, `VT_D3` fail
- **Check:** `VT_D2` "Scaffold Test User Created — `dennis@factory2key.com.au` provisioned" ·
  `VT_D3` "Scaffold Test User Non-Admin — correctly blocked from `/admin`" (both WEIGHTED/Med/NAIVE).
- **Why failing:** the non-admin user-agent account doesn't exist on deal-findrs, so the tester can't
  confirm it exists (D2) *or* that it's correctly blocked from `/admin` (D3).
- **Do:** create an **email-confirmed** `dennis@factory2key.com.au` account on deal-findrs's Supabase;
  ensure it is **NOT** in `ADMIN_EMAILS` (the invariant in PRODUCT_STANDARDS §9.5). Password →
  `QA_USER_PASSWORD` (env, never committed).
- **Verify:** log in as it → reaches `/today` (user UI); navigating to `/admin` → 401/redirect.

### A2. Make the admin portal auto-verifiable  → fixes `VT_A1–A4` na
- **Checks:** `VT_A1` Admin Portal Access · `VT_A2` Settings Profile · `VT_A3` Settings Password
  (eye toggle) · `VT_A4` Settings Notifications (all WEIGHTED/Med/NAIVE).
- **Why na:** the admin-tester logged *"admin login failed (no password login form found (magic-link
  only?)) — recorded 4 na"*. Magic-link-only login means the browser agent can't type a password to
  get in, so A1–A4 sit permanently `na` (which depresses the score identically to fail).
- **Do (pick one):**
  - **(preferred)** Provision the admin-agent `dennis+qaadmin@factory2key.com.au` in `ADMIN_EMAILS`
    and wire the shared **session-minter `--magic-link` mode** (`cais-shared-services/scripts/qa-session.mjs`)
    so the admin-tester mints a real session via `admin.generate_link`→`verify` (needs `QA_OWNER_EMAIL`
    + `SUPABASE_SERVICE_ROLE_KEY`; no email round-trip). This is the canonical magic-link-only path
    (PRODUCT_STANDARDS §9 automated-tester-auth codicil).
  - **(alt)** Add a password-login QA path to the admin auth flow.
- **Verify:** re-run the admin-tester → `VT_A1–A4` resolve to pass (or honest fail), no longer `na`.
- **Note:** this is portfolio-wide — magic-link-only admin login blocks A1–A4 on *every* such product,
  not just deal-findrs. Fixing the minter wiring once is the leveraged fix.

### A3. Configure the verified email sender  → fixes `#35` fail
- **Check:** `#35` "Email sender = `updates.corporateaisolutions.com`" (CONDITIONAL-WEIGHTED/Med, grep).
- **Why failing:** deal-findrs isn't sending from the only Resend-verified subdomain
  (`noreply@updates.corporateaisolutions.com`); the bare apex / a Supabase address fails the grep.
- **Do:** set the Resend custom-SMTP `smtp_admin_email` + the app's transactional sender to
  `noreply@updates.corporateaisolutions.com` (PRODUCT_STANDARDS §9 EMAIL codicil). While there, confirm
  the other two email knobs: custom SMTP enabled + `rate_limit_email_sent` raised off `2` (→30).
- **Verify:** grep passes; a real signup email actually sends from the verified subdomain.

### A4. Trigger a fresh rollup/score  → fixes `weighted_score_percent: 0` / `gate1_score_percent: null`
- **Symptom:** despite ~40 passing rows, the card shows `weighted_score_percent: 0` and
  `gate1_score_percent: null` — the **score snapshot is stale** (per the on-demand + mark-stale policy,
  THIN_MVP_RUBRIC §6 knob 7).
- **Do:** after A1–A3 + a clean producer run (Part B), trigger the cockpit rescore
  (`/api/admin/pipeline/deal-findrs/rescore`) so the card reflects the real results.
- **Verify:** `gate1_ready` recomputes; `weighted_score_percent` reflects the passing checks.

---

## PART B — pipeline-flow / orchestrator fixes (repo `dennissolver/cais-shared-services`)

### B1. ⭐ ROOT CAUSE — producers don't prepend the URL scheme  → why today's run recorded NOTHING
- **Confirmed bug:** all four browser producers take the URL verbatim:
  - `scripts/agents/naive-tester.mjs:19` → `const origin = arg('url').replace(/\/$/, '')`
  - `scripts/agents/voice-auditor.mjs:23` · `promise-judge.mjs:20` · `admin-tester.mjs:21` — identical.
  - The cockpit stores `mvp_url: "deal-findrs.vercel.app"` **with no `https://`**, and
    `lib.mjs goto()` calls `page.goto("deal-findrs.vercel.app")` → invalid URL → both attempts throw →
    `naive-tester: could not load any page — recording nothing` (exit 1).
- **Proof it's the scheme, not a wall:** `curl -L https://deal-findrs.vercel.app` and `/admin` both
  return **HTTP 200, no Vercel SSO wall**. The site loads fine *with* a scheme.
- **Do (one place):** normalize in `lib.mjs goto()` — prepend `https://` when the URL has no scheme:
  ```js
  export async function goto(page, url, timeout = 45000) {
    const target = /^https?:\/\//i.test(url) ? url : `https://${url}`
    try { await page.goto(target, { waitUntil: 'networkidle', timeout }); return true }
    catch { try { await page.goto(target, { waitUntil: 'domcontentloaded', timeout }); return true } catch { return false } }
  }
  ```
  (Belt-and-suspenders: also store `mvp_url` with scheme in the cockpit.) This single fix unblocks
  naive-tester, voice-auditor, and promise-judge for **every** product, not just deal-findrs.
- **Verify:** re-run `validation-run` for deal-findrs → fresh `readiness_results` rows with today's
  `scored_at`, not 06-07.

### B2. Fail loud on "recorded 0 rows"  → a silent no-op currently reads as success
- **Symptom:** the producers are `continue-on-error`, so a run that recorded **nothing** still showed
  the workflow as ✅ green. That's the dangerous failure mode — it masks B1.
- **Do:** add a final orchestrator step that fails (or posts a visible alarm) when the run wrote **0
  rows** for the target slug, or when ≥N producers returned exit 1. Don't let "recorded nothing" be green.
- **Verify:** a deliberately-broken URL makes the workflow go red, not green.

### B3. Auto-rescore after a clean producer run  (pairs with A4)
- **Do:** on a producer run that wrote rows, call the cockpit rescore so the card never sits on a stale
  `weighted_score_percent: 0`. (Or surface a prominent "re-score" stale badge.)

---

## Priority order
1. **B1** (one line — without it nothing else gets measured).
2. **A1 + A2** (the QA accounts + magic-link minter — unblocks 6 weighted checks).
3. **A3** (#35 email sender).
4. **B2** (so this can't silently regress).
5. **A4 / B3** (rescore so the card tells the truth).

After 1–3, re-run `validation-run` for deal-findrs and it should clear Gate 1 on real, fresh evidence.
