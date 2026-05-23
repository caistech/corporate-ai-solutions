# BYOK Conversion Playbook

**Status:** v1.1 — drafted 2026-05-23; Part A surfaces shipped same day on CAS (form gate + telemetry endpoint).
**Scope:** how to convert one `releaseMode: 'in-migration'` portfolio product into a shipping `releaseMode: 'byok-free'` release.
**Audience:** the next session's BYOK conversion sweep, plus any future per-product conversion run.
**Out of scope:** which products should be converted. That's a separate decision — see `project_next_session_byok_conversions.md` Step 1.5 (GO/NO-GO/POSTPONED gate) and the approved-list memory it generates.

**Important framing note (locked 2026-05-23 by Dennis):** CQR + Preflight predate the rearranged BYOK strategy. They are NOT the canonical reference implementations — they are legacy products that fall into the candidate pool like everything else and will be reshaped through the same Part B as every other conversion. References to them below are *historical artifact pointers*, not "match this shape." The canonical shape is what Part A + Part B specify in this document.

---

## How to use this document

1. Read the **Inputs already locked** section once — confirms the four UX shapes that feed this playbook are decided, so you don't re-debate them per product.
2. Run **Part A** (portfolio-level prerequisites) **once**, not per product. These are shared surfaces on CAS + the shared-services hub. They block every conversion until built.
3. For each GO-approved product, walk **Part B** end-to-end. The order is load-bearing: env classification must precede storage table design, which must precede the setup wizard, etc.
4. Use **Part C** (reference exhibits) as the lookup table when a step says "match the CQR pattern" or "match the Preflight pattern."

The playbook is the mechanical checklist. Judgement calls (does this product qualify? does the brand voice survive BYOK? does this clash with a paid offering?) live upstream in the per-candidate review gate, not here.

---

## Inputs already locked (do not re-debate)

These four decisions are inputs to the playbook — locked 2026-05-23 in `project_byok_conversion_template_decisions.md`. Restated here so the playbook stands alone:

1. **In-app key/secret wizard = thin shim over CLI manifest.** Both the web `/setup` wizard and the CLI `setup-product-credentials.mjs` read the same `setup-manifest.json` at the product repo root. One source of truth, two UX surfaces.
2. **Form gate fields = name, email, phone, intent.** Intent placeholder copy is canonical: *"Interested to know how you're going to use this — and love for you to share your experience and your use case when it's up."* Captured on `/marketplace/<slug>/byok` on the CAS site.
3. **"Want to BYOK?" CTA = per-product marketplace page on the CAS site.** Not buried in the product repo's own UI. Both paths visible upfront: BYOK free path (form-gated) + paid hosted path (if offered).
4. **Clone path = Vercel Deploy Button against a private GitHub template.** Source repo stays private; Vercel's GitHub App holds access and creates a fresh fork in the user's GitHub org. Closes the casual-bypass concern (visitors can't browse and direct-clone CAS source).

If any of these four shapes feels wrong while walking the playbook, **stop and resurface** rather than diverging. The shapes are locked at this severity because per-product drift is the failure mode this whole exercise prevents.

---

## Part A — Portfolio-level prerequisites (build once)

These surfaces live on the CAS marketing site (`Corporate-AI-Solutions/`) and the shared-services hub (`cais-shared-services/`). Build them once before the conversion sweep starts; reuse for every product.

### A1. CAS form-gate route — `/marketplace/<slug>/byok` ✅ SHIPPED 2026-05-23

**Status:** live. Files:

- `src/app/marketplace/[slug]/byok/page.tsx` — dynamic page; 404s for any slug whose `PLATFORMS` entry is not `releaseMode: 'byok-free'` with a populated `deployUrl`. Renders the canonical disclaimer block (every key is yours / opinionated stack / no support included) before the form.
- `src/components/byok/ByokInquiryForm.tsx` — client component; four fields per Decision 2, canonical intent placeholder copy enforced.
- `src/app/api/byok-inquiry/route.ts` — POST handler with zod validation; persists to `byok_inquiries`; emails Dennis via `notifySubmission`; returns `deployUrl` in the response for the success state to hand off to.
- `supabase/migrations/20260523000000_byok_inquiries_and_installs.sql` — both tables (this + telemetry) in one migration.

**Per-product wire-up:** each converted product's marketplace page swaps its primary CTA from "Deploy Your Own → deployUrl" to "Want to BYOK? → `/marketplace/<slug>/byok`". CQR's static page (`src/app/marketplace/cqr/page.tsx`) is wired this way as of 2026-05-23. Preflight's marketplace entry uses a hosted URL directly (`url: 'https://preflight-phi.vercel.app'`) — when Preflight goes through Part B retrofit, give it a `/marketplace/preflight/page.tsx` and the same CTA shape.

### A2. CAS telemetry endpoint — `/api/byok-telemetry/install` ✅ SHIPPED 2026-05-23

**Status:** live. Files:

- `src/app/api/byok-telemetry/install/route.ts` — POST + OPTIONS handlers; zod-validated `{ tool, version, install_id, timestamp? }`; UPSERT on `install_id` so re-runs of `/setup` from the same install update `last_seen` without double-counting. CORS open (`*`) because clones land on any user-owned Vercel URL. Errors return 200 with `success: false` — telemetry must never break a user's deploy.
- Table created in the same migration as `byok_inquiries` above (`20260523000000_byok_inquiries_and_installs.sql`).

**Why this is a portfolio-level surface, not per-product:** Rule 10's single carve-out covers anonymous install counters. Every BYOK product POSTs to the same endpoint; the route exists once on CAS rather than being re-implemented in 17 product repos. The endpoint is the carve-out, not the per-product code.

**Per-product wire-up:** during Part B, the product's `/setup` completion step POSTs once to `https://corporate-ai-solutions.vercel.app/api/byok-telemetry/install`. CQR's README already documents this; the actual call exists in CQR's `/api/setup/complete` (will be confirmed during CQR's retrofit).

### A3. Private-template + Vercel Deploy mechanics (per-product, but the *pattern* is portfolio-level)

The per-product execution is in Part B Step 9. The pattern itself — what makes the source private but the deploy public — is documented here so per-product runs follow the same shape:

- The product's GitHub repo at `https://github.com/dennissolver/<slug>` is **private** AND marked as a **template repository** (Settings → General → "Template repository" checkbox).
- The Vercel Deploy button URL points at the template (`https://vercel.com/new/clone?repository-url=...`).
- Vercel's GitHub App must be installed on the `dennissolver` org with access to the template repo. Without this, the deploy button errors with "repo not found" for the user.
- After deploy, Vercel creates a fresh **public** repo (default) in the user's org as a fork of the template. The user's fork is theirs; the CAS source stays private.
- Users land on `/setup` on first visit to their fresh deploy and walk the in-app wizard. The CLI `setup-product-credentials.mjs` is the alternative path for internal operators only — not surfaced to public users.

### A4. constants.ts type validation

`Platform.deploymentModes` currently allows four string-union values (see `src/types/index.ts`). Each new BYOK product may need a new audience string. The pattern: add the new value to the type union in the same PR that adds the product's `PLATFORMS` entry. Do NOT widen the union speculatively; add only what the converted product needs.

`Platform.releaseMode` is already complete (`'byok-free'` covers every conversion target). Don't add new modes.

---

## Part B — Per-product conversion checklist

Walk these ten steps in order for each GO-approved product. Skipping ahead is the drift this playbook prevents.

### B1. Pre-conversion structural gate

Before touching code, confirm the product is structurally BYOK-able:

| Check | Pass criterion | Fail action |
|---|---|---|
| **No CAS-only data dependency** | Product runs without access to any CAS-owned dataset, observability stack, or proprietary corpus. | NO-GO. The product is not BYOK-able regardless of how attractive the audience is. |
| **No CAS-only contract / API** | No upstream service accessible only via a CAS-side contract (e.g. a SaaS where Dennis is the named account holder and the SaaS doesn't expose user-level API keys). | NO-GO. Same conclusion. |
| **Every metered call has a user-credential path** | Every external API call already references a `process.env.X` for a key the user can provide. | If a single call is missing a key path, that's an env-classification (B2) fix — keep going, but flag it. |
| **Self-contained Supabase footprint** | The product's tables can be created in a fresh empty Supabase project from migrations alone. No cross-product joins. | Refactor first, convert second. Don't ship a BYOK with a hidden cross-product join. |
| **Voice persona traveller** | If the product surfaces a voice agent (VOICE AI STANDARD RULE), the persona is parameterised, not hardcoded to a CAS-specific identity. | Refactor the agent system prompt to read from `system_config` or `setup-manifest.json` post-action. CQR is the reference (`/api/setup/create-agent` reads `persona.json`). |

If any row fails and isn't a quick fix, the product is **not a conversion candidate** — return it to `in-migration` and resurface to Dennis for the GO/NO-GO review.

### B2. Env var classification pass (Rule 10 — RELEASE-BLOCKING)

Walk every `process.env.X` reference in the repo. Classify each into one of three buckets per Rule 10:

- **(a) User-provided credential** — surfaced in `setup-manifest.json`, captured by the wizard, written to `.env.local` or per-user storage (see B3). No CAS fallback.
- **(b) CAS-owned but scales-with-installs** — the single carve-out. Acceptable iff disclosed in README and opt-out-able. Only the `/api/byok-telemetry/install` POST (Part A2) currently fits this bucket. Anything else needs justification.
- **(c) CAS-owned and scales-with-end-user-usage** — **BLOCKING**. Refactor to (a) before release. No exceptions.

How to do the pass:

```bash
# From the product repo root:
grep -rn "process\.env\." --include="*.ts" --include="*.tsx" --include="*.js" --include="*.mjs" src/ app/ lib/ scripts/ \
  | awk -F: '{print $3}' | grep -oE 'process\.env\.[A-Z_][A-Z0-9_]*' | sort -u
```

For each env var the pass surfaces, decide (a)/(b)/(c) and record the answer. Output the classification table in the conversion PR description — it's the auditable evidence that Rule 10's release-blocking heuristic was actually run.

**The phone-home audit script** (`cais-shared-services/scripts/audit-phone-home.mjs`) covers the related question of whether hardcoded URLs point at CAS endpoints. Run it after every conversion — see B7.

### B3. Per-user credential storage table

For credentials that vary per workspace or per user within a deployed install (e.g. Slack bot tokens, Discord bot tokens, OAuth refresh tokens) — NOT for deployment-level env vars like `ANTHROPIC_API_KEY` — add a per-user storage layer.

**CQR's pattern:** doesn't use a single `operator_credentials` table. Instead, per-workspace tokens live on `slack_workspaces` / `discord_workspaces` rows captured via `/setup/slack` and `/setup/discord` after deploy. The system-wide identity (operator name, voice agent ID, deployment mode, install_id, telemetry opt-out) lives on `system_config` — a singleton row keyed `id = 1` with a `CHECK (id = 1)` guard.

**Preflight's pattern:** primarily env-var-driven (one operator, one drafting firm per deploy), so per-user credential storage is lighter. Per-project Google Drive OAuth tokens live on `project_credentials`-shaped rows (see `0019_profiles.sql` lineage); operator identity uses Supabase Auth + `profiles` per the global SETTINGS PAGE rule.

**Choose the shape that matches the product:**

| Product shape | Storage pattern |
|---|---|
| One operator runs the deploy; all keys are env vars at deploy time | `system_config` singleton (CQR pattern) — holds runtime-written values (agent IDs, install_id, telemetry flag, operator identity) that can't live in env vars because the app generates them after first deploy. |
| Multi-user / multi-workspace within a single deploy | Per-entity table (CQR's `slack_workspaces`). Encrypt tokens at rest. RLS service-role-only write; authenticated read scoped to membership. |
| Multi-project within a single firm's deploy | Per-project credentials table (Preflight's pattern). Same RLS shape. |

**Always:** RLS enabled on every credential-bearing table; service-role-only writes; reads scoped to the user's membership.

**Reference SQL** (CQR's `0004_system_config.sql`):

```sql
CREATE TABLE IF NOT EXISTS public.system_config (
  id                 int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  setup_complete     boolean NOT NULL DEFAULT false,
  schema_version     int NOT NULL DEFAULT 1,
  install_id         uuid NOT NULL DEFAULT gen_random_uuid(),
  agent_id           text,
  operator_name      text,
  operator_url       text,
  operator_signature text,
  bot_display_name   text NOT NULL DEFAULT 'Community Reply Bot',
  deployment_mode    text NOT NULL DEFAULT 'customer-self-serve'
                     CHECK (deployment_mode IN ('customer-self-serve', 'vendor-self-deploy')),
  telemetry_opt_out  boolean NOT NULL DEFAULT false,
  extra              jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.system_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
-- Read for authenticated; write service-role-only.
```

### B4. Feature degradation pattern

Rule 10: *"missing credential = the relevant feature is disabled with a clear message, never silently proxied through a CAS-owned key."*

Concrete shape:

- **Required credentials missing → the feature is unavailable, the UI says why, link to the relevant `/setup` step.** Not "feature works degraded." Not "feature works with our key." Disabled, with a message that names the exact env var and how to set it.
- **Optional credentials missing → the feature is hidden from the UI entirely** (don't show a disabled button for something the operator chose not to set up).
- **LLM provider has user choice between Anthropic / OpenRouter** — implement the either-or in code by checking both env vars and picking whichever is set. Never default to a CAS-owned key.

Reference: CQR's `/api/setup/create-agent/route.ts` returns a clear 400 with `"ELEVENLABS_API_KEY is not set in the deployed environment. Add it in your Vercel project settings and redeploy."` when the operator hits the wizard step without the key set. That message names the key, names the location (Vercel project settings), and names the action (redeploy). Match this shape.

### B5. `setup-manifest.json` at repo root + in-app `/setup` wizard

This is Decision 1 in action — one manifest, two UX surfaces (web wizard + CLI script).

**B5a. Write `setup-manifest.json` at the product repo root.**

Reference: CQR's `setup-manifest.json` (exhibit C1). Schema:

```json
{
  "product_name": "<Display Name>",
  "credentials": [
    {
      "key": "ENV_VAR_NAME",
      "vendor": "Display Vendor Name",
      "description": "What this is for + where to find it.",
      "signup_url": "https://provider.com/signup",
      "format": { "prefix": "sk-", "min_length": 20, "regex": "^...$" },
      "validate": "<validator-name-in-setup-product-credentials.mjs>",
      "required": true,
      "alternative_to": "OTHER_KEY"
    }
  ],
  "post_actions": [
    {
      "type": "create_elevenlabs_agent",
      "agent_env": "ELEVENLABS_AGENT_ID",
      "config": { "name": "...", "system_prompt": "...", "first_message": "...", "voice_id": "...", "language": "en" }
    }
  ]
}
```

Rules for `setup-manifest.json`:

- Every (a)-classified env var from B2 gets a credentials entry. No exceptions.
- `validate` values must match a hook in `cais-shared-services/scripts/setup-product-credentials.mjs` (anthropic, openai, openrouter, resend, hunter, apollo, brave, elevenlabs, supabase_url, slack_user_token, discord_bot_token as of 2026-05-23). If the product needs a vendor not in that list, add the validator to the script — do NOT define a new validator inside the product repo (Rule 6, anti-fork).
- `signup_url` deep-links to the API-keys page of the vendor, not the vendor's marketing homepage. Operators waste time hunting for the key page otherwise.
- Voice agents land via `post_actions` so the wizard creates them programmatically (per VOICE AI STANDARD RULE — never "go to the dashboard and click create").

**B5b. Write the in-app `/setup` route.**

Reference: CQR's `app/setup/` directory. Structure:

```
app/setup/
  page.tsx              # Auth gate → reads system_config → renders SetupChecklist
  checklist.tsx         # Client component — multi-step interactive wizard
  layout.tsx
  (provider sub-routes, e.g. slack/, discord/ for per-workspace token capture)
```

The route's job is to mirror the CLI wizard's flow, not to re-derive it. Each step calls a small API route under `app/api/setup/*` that performs the same operation the CLI script's matching step would — e.g. `POST /api/setup/identity` writes operator identity to `system_config`; `POST /api/setup/create-agent` mirrors the `create_elevenlabs_agent` post-action.

Mandatory `/setup` behaviour:

- Auth-gated. Redirect to `/login?next=/setup` for unauthenticated users.
- Singleton state read from `system_config` on every render — wizard resumes where the operator left off across sessions.
- `setup_complete = true` redirects to the product's main dashboard. Wizard is a one-time first-run flow.
- Telemetry opt-out checkbox visible during identity capture (Rule 10 carve-out disclosure).
- Operator identity required: name, URL, signature (replaces any hardcoded CAS references in voice prompts / reply signatures).

### B6. README "Required credentials" section

Rule 10 mandates this section in every BYOK product README. Match CQR's shape verbatim:

```markdown
## Required credentials

All credentials are BYOK — you provide your own keys, you pay your own
vendor bills, the operator running the install (you) is the admin on every
external service. <Product> never touches a CAS-owned key at runtime.

| Key | Vendor | Free tier? | Notes |
|---|---|---|---|
| `KEY_NAME` | Vendor | Yes/Pay-per-use/n/a | One-liner + [Get a key](deep-link). |
| ... |

**Per-workspace tokens (if applicable) are captured per-install, not as env vars.**
After deploy, visit `/setup/<provider>` to attach.

### Install telemetry (Rule 10 carve-out — disclosed, opt-out)

On first successful `/setup` completion, <Product> sends a one-time POST to
`https://corporate-ai-solutions.vercel.app/api/byok-telemetry/install` with
the payload `{ tool, version, install_id, timestamp }`. **No PII** —
`install_id` is a UUID generated at first-run, never derived from your
email or Supabase ref.

Opt out at deploy time with `BYOK_TELEMETRY=off`, or at runtime by ticking
the opt-out checkbox during `/setup`, or by setting
`system_config.telemetry_opt_out = true`.
```

Plus a Vercel Deploy button at the top of the README pointing at the same `deployUrl` that lives in `constants.ts` (B8).

### B7. Phone-home audit (product side)

The shared-services hub has `audit-phone-home.mjs` for `@caistech/*` packages. Adapt it to scan a product repo before release. The product-side adaptation should:

- Walk the product repo (not `packages/`); same scan extensions and skip dirs.
- Reuse the allowlist of 3rd-party hosts. Add any vendor the product depends on that isn't already there (and push the addition back to the shared script — Rule 6 anti-fork).
- Reuse the CAS-owned URL pattern list. Hardcoded URLs matching any pattern fail the audit.
- Reuse the suspicious env var name patterns. A `process.env.PLATFORM_TRUST_API_URL` reference in a BYOK product is automatically suspect.
- Exit non-zero on any non-PURE-CODE finding. CI gate the conversion PR on a green audit.

**Until a product-side wrapper exists**, run the hub-side script against the product repo manually by symlinking the product into a `packages/` directory — clunky but unblocks. The proper wrapper is a one-session task; create it the second time it's needed (Rule: if it bites twice, automate it).

### B8. `constants.ts` flip checklist

In `Corporate-AI-Solutions/src/lib/constants.ts`, the converted product's `PLATFORMS` entry flips from the `in-migration` shape to the `byok-free` shape. Required fields:

```ts
{
  id: '<slug>',
  name: '<Display Name>',
  slug: '<slug>',
  tagline: '<...>',
  problem: '<...>',
  description: '<...>',
  url: '/marketplace/<slug>',                            // marketplace page, NOT a hosted URL
  status: 'live',                                        // not 'building'
  category: 'business-tools' | 'voice-coaching' | ...,
  hasVoiceAI: true | false,                              // true triggers voice agent surface
  featured: true,                                        // BYOK releases ride the marketplace front
  type: 'parent',
  releaseMode: 'byok-free',                              // ← THE FLIP
  githubUrl: 'https://github.com/dennissolver/<slug>',   // public-facing reference; repo is private template
  deployUrl: 'https://vercel.com/new/clone?repository-url=<url-encoded-github-url>'
           + '&env=KEY1,KEY2,...'
           + '&envDescription=Required+credentials+%E2%80%94+all+BYOK%2C+see+README+for+links'
           + '&envLink=<url-encoded-github-url>%23required-credentials',
  deploymentModes: [...],                                // pick from the union; widen the union in types/index.ts if needed
  requiredStack: ['GitHub', 'Vercel', 'Supabase'],       // opinionated stack — surfaces on the card
  requiredCredentials: [                                 // high-level list for the marketplace card; NOT every env var
    'ANTHROPIC_API_KEY (or OPENROUTER_API_KEY)',
    'OPENAI_API_KEY (embeddings)',
    'SUPABASE (URL + anon + service-role)',
    'RESEND_API_KEY + RESEND_FROM_EMAIL',
    ...
  ],
}
```

**Checklist:**

- [ ] `releaseMode` flipped to `'byok-free'`.
- [ ] `status` is `'live'` (not `'building'`).
- [ ] `url` points at the CAS marketplace page (`/marketplace/<slug>`), not a hosted product URL.
- [ ] `githubUrl` set to the public-facing reference URL even though the repo is private (after Part A1 lands, the form gate intercepts before users reach the GitHub URL).
- [ ] `deployUrl` URL-encoded correctly. Test it: paste into a browser, confirm Vercel's clone flow opens with the expected env-var prompts.
- [ ] `deploymentModes` values exist in the `Platform.deploymentModes` union in `src/types/index.ts`. Widen the union in the same PR if needed.
- [ ] `requiredCredentials` reads as marketplace-card copy, not a literal env-var dump. Group related keys; mention alternates inline.
- [ ] Marketplace product page exists at `src/app/marketplace/<slug>/page.tsx` matching the CQR shape (hero with three explanatory paragraphs, primary CTAs, both deployment modes documented side-by-side, methodology footer link).
- [ ] Per Part A1, the page's primary CTA points at `/marketplace/<slug>/byok` (form gate), not the raw `deployUrl`.

### B9. Private template repo + Vercel Deploy button

**On GitHub (dennissolver/<slug>):**

1. Repo is **private**. Confirm: Settings → General → "Change visibility" reads "Public" (i.e. currently private).
2. Mark as a **template repository**: Settings → General → check "Template repository".
3. Confirm the Vercel GitHub App has access: GitHub Settings → Applications → Vercel → Repository access includes the slug.
4. Push a clean `main` branch — no dev cruft, no `.env.local`, no `node_modules`, no operator-specific seed data. The user's first clone is what they see.
5. Confirm `.env.example` exists at the repo root, listing every (a)-classified env var with a placeholder value. The Vercel deploy flow reads this to pre-populate prompts.
6. README is current (B6) including the Deploy button at the top.

**On Vercel:**

1. The Deploy button URL in `constants.ts` and the README must be identical. Generate once, paste twice.
2. Test the button end-to-end with a fresh GitHub account that doesn't have the Vercel app installed. Time the flow. Target: under 5 minutes from button click to a deployed URL on the user's account.
3. The first visit lands on `/setup` (B5b enforces this via a redirect from `/`). Walk it to confirm the wizard actually fires.

### B10.5. Team admin layer (per global TEAM ADMIN RULE)

Every BYOK product has public exposure by definition — that's the whole point of the BYOK Factory distribution model. The global TEAM ADMIN rule therefore applies: the converted product MUST ship a team-admin layer, even if the v1 customer set is single-user.

**What ships per conversion:**

- `organisations` + `organisation_members` tables in the product's Supabase migrations (canonical schema per the global rule).
- `auth.users` signup trigger that auto-creates a personal organisation for new users (so the rest of the schema works uniformly).
- `/admin` (or `/admin/team`) route in the product, visible only to `owner` + `admin` roles. Five required sections: Members / Usage / Billing / Tenancy / Organisation (hide Billing on free-only products; hide Tenancy on BYOK-only products).
- Invite flow with HMAC-signed single-use tokens, Resend-delivered email per EMAIL INFRASTRUCTURE rule.
- For metered features: per-user attribution recorded on every metered call (`user_id` alongside `organisation_id` on meter rows). Foundation for per-seat quotas if the product ever wants them.

**Don't speculatively build the `@caistech/team-admin` package on the first BYOK conversion** — the shared-services-first rule says the package gets extracted on the *second* product that needs the same shape. First conversion implements inline; second conversion triggers the extraction.

**For BYOK-only products with no hosted tier**, Billing + Tenancy sections of `/admin` are hidden but the rest ships. The user runs the product on their own infra; admin is for them to manage their org's members against the deploy.

### B11. Portfolio manifest update

In `cais-shared-services/portfolio-manifest.yaml`, the converted product's entry gets:

- A `# BYOK-totality per project CLAUDE.md` comment (Preflight pattern).
- Any minimal-inheritance overrides the product needs (only what's required — don't bloat the entry).
- `voice_agent_status` field reflects reality post-conversion (`present` if the voice surface ships, `absent` if deferred).
- `team_admin_status` field reflects reality (`present` if `/admin` route + organisations schema shipped; `absent` only if explicitly deferred with a tripwire).
- `hosted_tier_status` field (`none` | `available` | `coming`) flags whether the product also ships a paid hosted tier. Drives whether Part F applies.
- When the `byok_ready: true` field is introduced portfolio-wide, set it. Until then, the `releaseMode: 'byok-free'` in `constants.ts` is the authoritative signal.

The portfolio-env-sync auditor (`@caistech/portfolio-env-sync` v0.8+) will read the manifest entry; the conversion PR doesn't need to wait on the sync run, but a follow-up sync run after the PR lands surfaces any env-var drift between the manifest, the product, and Vercel project settings.

---

## Part C — Legacy artifact pointers (CQR + Preflight)

**Framing:** CQR + Preflight predate the rearranged BYOK strategy. They are *not* canonical reference shapes — they are themselves on the candidate list and will be reshaped through Part B during the conversion sweep. This section is a pointer map to *where their existing surfaces live* so the retrofit session doesn't have to re-discover them. Treat divergences from the playbook's canonical shape as **retrofit work**, not "the way it's done."

### C1. CQR (`community-question-responder`) — artifact pointer map

| Concern | Existing file | Retrofit notes |
|---|---|---|
| Manifest | `setup-manifest.json` at repo root | Schema already matches canonical — keep. |
| In-app wizard | `app/setup/page.tsx` + `app/setup/checklist.tsx` | Functional but predates B5b spec — re-review on retrofit. |
| Setup APIs | `app/api/setup/{identity,create-agent,complete}/route.ts` | Confirm `/complete` actually POSTs to the new `/api/byok-telemetry/install` endpoint. If not, add. |
| System state singleton | `supabase/migrations/0004_system_config.sql` | Matches B3 singleton pattern — keep. |
| Per-workspace tokens | `slack_workspaces`, `discord_workspaces` (Slack: `0005_slack_bot_token.sql`) | Matches B3 per-entity pattern — keep. |
| Voice persona | `lib/voice/persona.json` (read by `/api/setup/create-agent`) | Confirm persona is operator-configurable, not hardcoded CAS identity. |
| README | `README.md` | Largely aligned — re-check telemetry disclosure section + that the Deploy button points at the form gate, not the raw deploy URL. |
| Repo visibility | Currently public | **Retrofit to private template** per Part A3 / Decision 4. Closes the casual-bypass concern. |

### C2. Preflight (`preflight`) — artifact pointer map

| Concern | Existing file | Retrofit notes |
|---|---|---|
| Manifest | `byok.config.json` at repo root | **Rename to `setup-manifest.json`** to match canonical. Update any `byok-setup/scripts/setup-byok.mjs` reference. |
| In-app wizard | None at `/setup` yet — Preflight uses CLI + `.env.local` only | **Build per B5b** during retrofit. |
| Auth + profiles | `supabase/migrations/0019_profiles.sql` + `0020_profile_rpcs.sql` | Matches global SETTINGS PAGE rule — keep. |
| Per-project facts | `project_facts` (`0008_fact_candidates.sql` lineage) | Matches B3 per-project pattern — keep. |
| Drafter token signing | HMAC via `DRAFTER_TOKEN_SECRET` (auto-generated by manifest) | Keep. |
| README | `README.md` | **Retrofit** — add "Required credentials" table per B6, telemetry disclosure section, Vercel Deploy button at the top. |
| Marketplace page on CAS | None — `PLATFORMS.preflight.url` points at the hosted Vercel URL directly | **Build `src/app/marketplace/preflight/page.tsx`** matching the CQR shape (hero + dual deployment modes + form-gate CTA). |
| Repo visibility | Currently public | **Retrofit to private template** per Part A3 / Decision 4. |

### C3. Shared-services hub references (canonical — these ARE the references)

These are the up-to-date canonical surfaces, unlike C1/C2:

| Concern | File / location |
|---|---|
| CLI wizard | `cais-shared-services/scripts/setup-product-credentials.mjs` |
| Manifest schema example | `cais-shared-services/scripts/setup-manifest.example.json` |
| Vendor validators | `VALIDATORS` object in `setup-product-credentials.mjs` |
| Post-action handlers | `POST_ACTIONS` object in `setup-product-credentials.mjs` (currently: `create_elevenlabs_agent`) |
| Phone-home audit | `cais-shared-services/scripts/audit-phone-home.mjs` |
| Portfolio manifest | `cais-shared-services/portfolio-manifest.yaml` |
| Onboarding orchestrator | `cais-shared-services/scripts/onboard-new-project.sh` |

### C3. Shared-services hub references

| Concern | File / location |
|---|---|
| CLI wizard | `cais-shared-services/scripts/setup-product-credentials.mjs` |
| Manifest schema example | `cais-shared-services/scripts/setup-manifest.example.json` |
| Vendor validators | `VALIDATORS` object in `setup-product-credentials.mjs` |
| Post-action handlers | `POST_ACTIONS` object in `setup-product-credentials.mjs` (currently: `create_elevenlabs_agent`) |
| Phone-home audit | `cais-shared-services/scripts/audit-phone-home.mjs` |
| Portfolio manifest | `cais-shared-services/portfolio-manifest.yaml` |
| Onboarding orchestrator | `cais-shared-services/scripts/onboard-new-project.sh` |

---

## Part D — Conversion PR template

When opening the PR for a per-product conversion, include this block in the description:

```markdown
## BYOK conversion — <product slug>

**Playbook reference:** `docs/BYOK_CONVERSION_PLAYBOOK.md` Part B.

### Part B step-through

- [ ] B1 — Structural gate passed (no CAS-only deps, voice persona parameterised).
- [ ] B2 — Env classification table (paste here): every `process.env.X` classified a/b/c. Zero (c) findings.
- [ ] B3 — Per-user credential storage: `<system_config singleton | per-workspace table | per-project table>`.
- [ ] B4 — Feature degradation messages reviewed; missing keys disable the feature with a clear message.
- [ ] B5 — `setup-manifest.json` at repo root. In-app `/setup` wizard live.
- [ ] B6 — README "Required credentials" section + Vercel Deploy button + telemetry disclosure.
- [ ] B7 — Phone-home audit: PURE-CODE for the product repo.
- [ ] B8 — `PLATFORMS` entry flipped to `releaseMode: 'byok-free'`. `Platform.deploymentModes` union widened if needed. Marketplace page updated.
- [ ] B9 — Repo private + marked template. Vercel Deploy URL tested end-to-end with a fresh account.
- [ ] B10 — `portfolio-manifest.yaml` updated.

### Companion Part A surfaces

- [ ] CAS marketplace page CTA points at `/marketplace/<slug>/byok` (form gate), not the raw `deployUrl`.
- [ ] Product's `/setup` completion POSTs to `https://corporate-ai-solutions.vercel.app/api/byok-telemetry/install`.

### Manual smoke

- [ ] Clicked the Deploy button as a fresh user; deploy succeeded.
- [ ] `/setup` wizard runs end-to-end; every required key captured; voice agent (if any) created programmatically.
- [ ] At least one core product action works on the freshly-deployed instance.
```

---

## Part E — Hosted-tier companion checklist

Applies only when a product also ships a paid hosted tier alongside its BYOK release (per the *"BYOK or full-service, nothing in between"* directive locked 2026-05-23 by Dennis). Enforces MONETISATION_RULES.md Rules 12 (no uncovered cost exposure), 13 (single-tenant customer choice), and 14 (hard-cut usage cap).

If the product is BYOK-only, skip Part E entirely. If the product also ships hosted, work this checklist alongside the late stages of Part B (after B5 + B10.5; before final sign-off).

### E1. Tenancy choice surface in the hosted checkout flow

- Two tenancy options visible side by side at checkout per Rule 13.
- `hosting_subscriptions` table (or equivalent) carries `tenancy_mode` (`shared` | `dedicated`) and `tenancy_rationale` (free text, captured when `dedicated` is chosen).
- REGULATED-tier products: shared is not offered. The flow defaults to dedicated and the option toggle is hidden.
- Pricing reflects the `infra_fixed` delta per the pricing formula (~$0 shared / ~$45–65/mo baseline dedicated).

### E2. Usage meter shape (uniform across products per Rule 14)

- Per-product `PRODUCT_METERS` constant declares each meter — name, unit, drive-source (LLM tokens / voice minutes / docs / leads / etc.), per-tier cap.
- `usage_meters` table keyed `(organisation_id, meter_name, period_start)`. Period defaults to monthly aligned to the billing cycle; weekly + daily are reserved for future tiers.
- Atomic check-and-increment SQL pattern (per Rule 14 — race-safe `UPDATE ... WHERE current_value + cost <= cap RETURNING ...`). Cap-check happens inside the same transaction as the metered call. No "check, then call, then increment" — that's how races slip cost.
- Default 5% headroom above plan cap to absorb in-flight requests at the moment the cap is hit. The plan price covers up to 105%; beyond that requires top-up.

### E3. Cap enforcement UX (80% warn → 100% hard cut)

- Per-meter 80% threshold triggers a non-blocking banner + email to the org's admin/owner roles. Banner copy is canonical: *"You're at 80% of this month's [unit]. [Top up credits] · [Upgrade plan]."*
- 100% threshold disables the metered feature with an "out of credit" state. Login, settings, viewing past data, exporting — all still work. Only the metered feature is blocked.
- Top-up + upgrade both clear the block in real time (no waiting until next cycle); they require the Stripe webhook to fire on payment success before the meter unlocks.

### E4. Real-time cost tracking (shared service in waiting)

Per Rule 14's last bullet, this is the layer that becomes `@caistech/usage-meters` (placeholder name) on the second product that needs it. For the first hosted product to ship, build inline. Match the shape so extraction is mechanical:

- `usage_meters` table shape per E2 above — uniform, not product-specific.
- `record_metered_use(organisation_id, meter_name, units)` helper function per product (will become a shared `@caistech` export). Returns `{ ok: true }` on success, `{ ok: false, reason: 'cap-hit', meter: ..., balance: ..., cap: ... }` when the cap is hit.
- 80% / 100% notification dispatch happens via Supabase trigger on `usage_meters` update — out of the request path, idempotent on `(organisation_id, meter_name, threshold, period_start)`.
- Admin dashboard reads `usage_meters` directly; no per-product aggregation logic. Format depends only on `PRODUCT_METERS` declaration.

### E5. Stripe wiring for prepaid model (per Rule 12)

- Subscription products are billed in advance. The Stripe webhook for `invoice.paid` flips the org's subscription `active`; failed payment flips it to `past_due` and gates access after a grace window (3 days default).
- Credit top-ups are one-time payments; the `payment_intent.succeeded` webhook credits the org's balance immediately.
- No metered billing (Stripe's usage-based products). The model is plan-with-cap + prepaid top-ups. Metered billing would re-introduce the post-pay exposure Rule 12 forbids.

### E6. Pricing formula application

Run the pricing formula (`docs/PRICING_FORMULA.md` once published) for the product. Output:

- Per-tier monthly price (rounded up to the nearest clean tier: $49 / $99 / $149 / $199 / $299 / custom-quote).
- Per-meter cap at each tier.
- Top-up unit prices (e.g. $10 = N additional LLM tokens / M voice minutes).
- Single-tenant additive cost line item.

Pricing applies in advance per Rule 12 — never as a post-billing adjustment.

### E7. Hosted-tier PR checklist additions

In addition to the Part D checklist, the hosted-tier PR includes:

- [ ] E1 — Tenancy choice surface live in hosted checkout. Rationale captured for `dedicated`.
- [ ] E2 — `usage_meters` table + `PRODUCT_METERS` constant present. Atomic check-and-increment verified by race test (5 concurrent calls when only 3 fit — exactly 3 succeed).
- [ ] E3 — 80% warning + 100% hard cut triggered + verified in staging. Top-up clears the block in real time.
- [ ] E4 — Inline meter implementation matches the canonical shape (table schema, helper signature, notification trigger) so future extraction to `@caistech/usage-meters` is mechanical.
- [ ] E5 — Stripe webhooks wired (`invoice.paid`, `payment_intent.succeeded`, `invoice.payment_failed`). Prepaid-balance and grace-window logic tested.
- [ ] E6 — Pricing formula run; output tier prices, per-meter caps, top-up units documented in the PR description.

---

## Part F — When this playbook needs to change

Append-only with dated change notes. Trigger conditions:

- A new conversion surfaces a step this playbook doesn't cover. Add the step; cross-link from `project_byok_conversion_template_decisions.md` if it changes one of the four locked shapes.
- A new `@caistech/*` package becomes part of the canonical BYOK stack (e.g. when `db-schema` ships shared migrations). Add a B-step for adopting it.
- Rule 10 or Rule 9 in `MONETISATION_RULES.md` revises. Reconcile this playbook against the revision.
- The portfolio-env-sync auditor adds a `byok_ready` field or a release-gate check. Update B10.

Removing a step requires a written rationale, same severity as the auth-pattern rule. The playbook is the mechanical contract — the cost of drift is per-product re-derivation, which is precisely the failure mode the playbook prevents.
