# TESTING — automated-tester auth for Corporate AI Solutions

How `/naive-tester`, `/qa`, and `/benchmark` authenticate against this app **as a real
account, never via a backdoor** (portfolio canon: `cais-shared-services/PRODUCT_STANDARDS.md`
§9). **No route or flag may skip authentication** — a test auth-bypass is a critical
vulnerability, same severity as an unguarded endpoint.

## The auth model here (why this repo is the canonical "hard case")

- **Login is magic-link only** — `src/app/pipeline/login/page.tsx` calls
  `supabase.auth.signInWithOtp` (no password field). The portfolio password-grant minter
  cannot serve this repo.
- **`/admin/*` and `/pipeline/*` are gated** in `src/middleware.ts`: unauthenticated → redirect
  to `/pipeline/login`; `/admin/*` additionally requires the user's email to be on the
  **`ADMIN_EMAILS`** allow-list (defaults to the operator emails).
- **Preview deploys sit behind Vercel deployment protection** — the app login is unreachable
  there (a `vercel.com/login` 401 wall) without a bypass token.

## The QA account (one-time provisioning)

1. Create a **dedicated, email-confirmed QA `owner` account** (not the operator's personal
   account):
   ```js
   // service-role, one-off
   await supabase.auth.admin.createUser({ email: 'qa@updates.corporateaisolutions.com', email_confirm: true })
   ```
2. Add that email to **`ADMIN_EMAILS`** (so it can reach `/admin/*`).
3. Make `SUPABASE_SERVICE_ROLE_KEY` available to the minter (from `.env.local` or env).
4. For **local** testing, add `http://localhost:3000/pipeline/auth/callback` to the Supabase
   **redirect allow-list** (otherwise a magic link falls back to the prod Site URL and is
   PKCE-bound to the prod origin).
5. For **preview** testing, set a Vercel **Protection-Bypass-for-Automation** token on the
   project and pass it (`?x-vercel-set-bypass-cookie=…` / `x-vercel-protection-bypass` header).

Store the QA email + any secret in the password manager. **Never commit them; never paste them
into a test report.**

## Mode A — drive the real auth path (default; also *tests* it)

Request the magic link from the real `/pipeline/login` form, then read it from a **dedicated,
API-readable QA mailbox** (never the operator's personal inbox), and navigate it in the **same**
browser context (so the PKCE verifier matches). Use this when you want to exercise email
delivery end-to-end.

## Mode B — get past auth fast (the canonical minter)

Mint the real QA session directly via the shared minter's `--magic-link` mode — no email
round-trip, no PKCE/redirect-allow-list dependency. It uses the service-role
`admin.generate_link` → `verify` and emits the exact `@supabase/ssr` cookie a successful login
would write:

```bash
QA_TEST_EMAIL='qa@updates.corporateaisolutions.com' \
SUPABASE_SERVICE_ROLE_KEY='<service-role>' \
node ../cais-shared-services/scripts/qa-session.mjs --magic-link \
  --root . --origin http://localhost:3000
```

Set the printed `sb-<ref>-auth-token` cookie(s) on the origin in the `/browse` daemon, then
navigate to a protected route (`/admin/methodology`). Consume this shared minter — **do not fork
it** per repo.

## Scoping caution — `/admin/*` fires real outreach

The methodology cockpit's research kick-off (`/api/methodology/cards/[slug]/validate`) sends
**real InvestorPilot outreach + incurs API cost**. An automated walk MUST stay on the cockpit
front-door (board, intake forms, the Gate-0 banner/override, settings) and **must NOT trigger
research kick-off** or make terminal decisions on real product cards. Archive any throwaway card
a test creates.
