# Pipeline Tracker

Single-user CRM for managing the 90-day push for paid AI dev engagements and the search for the right own-build to take to market. See the full directive at [`claude_code_directive_pipeline_tracker.md`](./claude_code_directive_pipeline_tracker.md).

Lives at `/pipeline/*` inside the existing Corporate-AI-Solutions Next.js app.

## Stack

Shared with the marketing site:

- Next.js 14.2.x, App Router, TypeScript strict
- Tailwind CSS
- Supabase (Postgres + Auth) — tracker tables under the `pipeline` schema
- Vercel — same project as the marketing site
- Zod for input validation
- Vitest for unit tests, Playwright for the smoke test

## First-time Supabase setup

The tracker re-uses the existing Supabase project. Before the app works end-to-end, three things must be configured in the dashboard.

### 1. Expose the `pipeline` schema via PostgREST

Supabase JS targets the `public` schema by default. The tracker uses `.schema('pipeline').from(...)`, which requires the `pipeline` schema to be in the exposed list.

Dashboard → **Project Settings → API → Exposed schemas** → add `pipeline` next to `public`. Save.

### 2. Run the migrations

```bash
supabase db push
```

This applies the three migrations in order:

1. `20260514000000_pipeline_schema.sql` — creates `pipeline` schema, three tables, indexes, grants
2. `20260514000001_pipeline_rls.sql` — enables RLS and policies (own-rows-only)
3. `20260514000002_pipeline_triggers.sql` — `set_owner_id`, `set_updated_at`, audit triggers

If you'd rather use the dashboard SQL editor, paste each migration body in order.

### 3. Configure custom SMTP via Resend — **mandatory**

The default Supabase SMTP service rate-limits at ~3–4 emails/hour, which will lock you out of testing within an afternoon. Before the first magic-link test:

Dashboard → **Authentication → Email Templates → SMTP Settings**

- Enable Custom SMTP
- Host: `smtp.resend.com`
- Port: `465` (SSL) or `587` (STARTTLS)
- Username: `resend`
- Password: your Resend API key
- Sender email: `noreply@updates.corporateaisolutions.com` (the only Resend-verified Corporate AI Solutions sender domain)
- Sender name: `Pipeline Tracker` (or any human name — never `noreply`)

If you see "Error sending email" during magic-link testing, the cause is almost always SMTP misconfiguration (wrong sender domain, missing key, unverified subdomain) — not the application code.

### 4. Add redirect URLs

Dashboard → **Authentication → URL Configuration → Redirect URLs** → add:

- `http://localhost:3000/pipeline/auth/callback` (local dev)
- `https://corporate-ai-solutions.vercel.app/pipeline/auth/callback` (production)
- (Add any custom-domain equivalents when applicable)

## Running locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000/pipeline` — you'll be redirected to `/pipeline/login`.

## Testing

### Unit tests (Vitest)

Schema validation and security-boundary tests:

```bash
npm run test
```

Watch mode:

```bash
npm run test:watch
```

### RLS isolation test

Confirms two users can't see each other's rows. Requires a **test** Supabase project (do not run against production):

```bash
PIPELINE_RLS_TEST=1 \
NEXT_PUBLIC_SUPABASE_URL=... \
NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
SUPABASE_SERVICE_ROLE_KEY=... \
npx vitest run src/lib/pipeline/__tests__/rls-isolation.test.ts
```

### E2E smoke (Playwright)

Tests the full login → today → capture → log → audit-log flow. Playwright is not installed by default; install once:

```bash
npm install -D @playwright/test
npx playwright install chromium
```

Then run:

```bash
PIPELINE_TEST_BASE_URL=http://localhost:3000 \
PIPELINE_TEST_EMAIL=you@example.com \
PIPELINE_TEST_PASSWORD=xxx \
NEXT_PUBLIC_SUPABASE_URL=... \
NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
SUPABASE_SERVICE_ROLE_KEY=... \
npm run test:e2e
```

Requires a Supabase user with password auth enabled (or adapt the test to grab the magic-link token via the admin API).

## Routes

| Route | Purpose |
|---|---|
| `/pipeline` | Redirects to `/pipeline/today` |
| `/pipeline/login` | Magic-link sign-in |
| `/pipeline/auth/callback` | Supabase OTP callback |
| `/pipeline/today` | Default landing — overdue / today / week / awaiting / no-next sections |
| `/pipeline/contacts` | List view with search, status/source/tag filters, sort |
| `/pipeline/contacts/new` | 30-second capture form (4 fields visible, rest behind toggle) |
| `/pipeline/contacts/[id]` | Detail view + event history + quick status actions |
| `/pipeline/contacts/[id]/edit` | Full edit |

The middleware at `src/middleware.ts` gates everything under `/pipeline/*` except `/pipeline/login` and `/pipeline/auth/*`.

## v2 backlog

Documented in the directive (Part 5) — do not build these until v1 has been used daily for 7 days:

1. Gmail integration — auto-create events from sent/received emails
2. Calendly webhook — booked meeting → new contact + meeting event
3. LinkedIn message log — browser extension or paste-to-log
4. AI next-action suggester — Claude API given event history
5. Weekly email digest — Sunday recap of overdues, expected replies, stale awaiting-them
6. Public read-only contact pages — share `/p/<token>` with referrer
7. Multi-user / multi-tenant — org-level tenancy with roles
8. Notifications — push/email when overdue tips into red or reply waited too long
9. Pipeline stages per category — different flows for FT pursuit vs fractional vs sprint
10. **Voice intake** — Connexions / Kira primitives, voice-log a contact after a call. This is the bridge from private tracker to public voice-discovery demo.

## Audit-log verification

The directive's Definition of Done #7 requires `pipeline.audit_log.actor_id` to be non-NULL after writes. After your first contact capture, verify in the dashboard SQL editor:

```sql
SELECT id, actor_id, entity_type, action, created_at
FROM pipeline.audit_log
ORDER BY created_at DESC
LIMIT 5;
```

If `actor_id` is NULL, the `pipeline.write_audit_log()` trigger function is not receiving the JWT claims. Check that the function is `SECURITY DEFINER` and that the writes are happening via the authenticated Supabase server client (cookie-bound) rather than the service-role client.

## Decisions log

Append clarifications, scope overrides, and judgment calls to `docs/pipeline-tracker-decisions.md` (one file per decision is fine, or one rolling doc). Major changes (data model, stack additions, scope changes) require explicit approval — see directive Part 6.
