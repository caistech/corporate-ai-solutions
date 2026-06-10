# Pipeline → Standalone Integrated Product — Separation & Integration Plan

> **Status:** DRAFT for review (2026-06-10). Decision document, not yet executed.
> **Author:** prepared for Dennis's review tomorrow.
>
> **Review decisions locked 2026-06-10 (eng-review):**
> - **Scope = EXTRACT-FIRST.** Phase 1 (extract Pipeline to its own product, keep the existing
>   IP/Connexions/SayFix webhooks intact) is committed now. The internalisation phases (2–4) are
>   **deferred and decided per-seam**, each gated on the standalone running clean. Strangler-fig,
>   not big-bang — avoids re-plumbing live outbound infra into a just-extracted app.
> - **Pipeline dogfoods itself (new requirement).** Once the phases are through, Pipeline is
>   enrolled as a product *in its own cockpit* and runs the identical 5-stage pipeline every other
>   product runs — intake → **coach phase** → readiness/validation producers against its own live
>   deployment → Gate-1/Gate-2 → lane assignment. The loop must validate itself on itself, no
>   special-casing. See §13.
> **One-line thesis (refined by the eng-review):** Lift the Pipeline/methodology cockpit out of
> `corporate-ai-solutions` into its own standalone product (new repo/Supabase/Vercel/ElevenLabs).
> **Now:** keep IP/Connexions as the discovery + interview owners and make Pipeline's *calls* to them
> reliable (the webhook fragility is fixed by a robust integration, not by reimplementing the
> capability — DRY). **Later:** internalise discovery + interview in-process (via the `@caistech/*`
> substrate) **only when Pipeline-as-SaaS clears its own Gate-2** — a sellable factory must be
> self-contained, but the duplication cost waits for validated demand. Own the SayFix-style
> post-production ticketing throughout (that surface is genuinely Pipeline's, not a duplication).

---

## 0. Why do this (the strategic case)

This is the realised North-Star loop (`BUSINESS_MODEL.md` §1): see → ideate → opine → research →
go/no-go → execute. Today that loop is **physically scattered across four codebases** that talk
over webhooks:

- **CAS** holds the cockpit + methodology + the user pipeline CRM (the "boardroom").
- **InvestorPilot** does the actual discovery + outreach (Unipile / Hunter / Brave / Apollo).
- **Connexions** runs the voice interviews and returns structured feedback.
- **SayFix** handles post-production tickets → auto-fix → PR.

Three problems with the scattered shape:

1. **Runtime fragility from cross-product webhooks.** The deal-findrs run today is the proof: the
   orchestration fired correctly but the producer leg couldn't reach the live deployment and
   recorded nothing, while the workflow still reported "success." Every webhook hop is a place the
   loop silently breaks. (Full diagnosis in §8.)
2. **The Pipeline is buried as a sub-feature of a marketing site.** It has its own dual-auth, its
   own cockpit, its own DB schema, its own CI — it is a *product*, not a page on the CAS brochure.
   Co-habiting with the marketing site couples its deploys, its auth, and its `constants.ts` to an
   unrelated concern.
3. **The capability is already factored — we're just not assembling it in one place.** Discovery,
   voice-interview, and ticketing all exist as `@caistech/*` packages. Pipeline can *consume* them
   in-process instead of calling three deployed products. That is the `@caistech`-first rule applied
   to the loop itself.

**What this serves:** a single, ownable, self-contained "product factory" engine — the boardroom
that never leaves — instead of a brittle mesh. It also opens an optional future lane (§7, Decision D4):
the Pipeline itself becomes a lane-1 distributor SaaS sold to other studios/accelerators.

---

## 1. Current state — what lives where (grounded inventory)

### 1a. Inside `corporate-ai-solutions` today (the thing we're extracting)

| Layer | Count | Examples |
|---|---|---|
| **Pipeline product routes** | 13 pages | `/pipeline/*` (user CRM: today, contacts), `/admin/pipeline/*` (operator cockpit), `/admin/methodology/*` (cards, readiness) |
| **API routes** | ~24 | `/api/methodology/*` (cards, validate, score, pools, sync), `/api/admin/pipeline/[productId]/*` (validation, agent-ready, rescore, design-build, waive, …), `/api/cron/market-validation`, webhooks |
| **Components** | ~25 | `src/components/admin/*` (cockpit, pipeline table, validation runners), `src/components/methodology/*` (ideation inbox, readiness panel, decision controls), `src/components/pipeline/*` (contacts CRM) |
| **Lib modules** | ~30 | `src/lib/methodology/*` (readiness scoring, gate logic, pool-discovery, coach persistence), `src/lib/pipeline/*` (CRM actions, supabase), `portfolio-manifest.ts`, `methodology-intake-gate.ts` |
| **DB tables** | ~12 | `methodology_hypothesis_cards`, `methodology_campaigns`, `methodology_responses`, `readiness_criteria`, `promise_attributes`, `readiness_results`, `pipeline_gates`, `readiness_waivers`, `portfolio_manifest`, `product_validation_status`, `pipeline.contacts`/`events`/`audit_log` |
| **Scripts** | 4 | `track-idea.mjs`, `gen-methodology-doc.mjs`, `qa-session.mjs`, … |

### 1b. The integration seams (the webhooks we want to internalise)

| Seam | File | Talks to | Mechanism |
|---|---|---|---|
| **Discovery / outreach relay** | `api/methodology/sync/route.ts` → `relayInterviewedToInvestorPilot()` | InvestorPilot | POST + HMAC (`INVESTORPILOT_INTAKE_WEBHOOK_URL`, `CONNEXIONS_INTAKE_WEBHOOK_SECRET`) |
| **Demand signals return-leg** | `api/webhooks/investorpilot-signals/route.ts` | InvestorPilot | POST + HMAC (`INVESTORPILOT_SIGNAL_WEBHOOK_SECRET`) |
| **Interview intake** | `api/pipeline/intake/route.ts` | Connexions | Bearer (`CONNEXIONS_WEBHOOK_SECRET`) |
| **Voice coach post-call** | `api/convai/webhooks/coach-post-call/route.ts` | ElevenLabs ConvAI | HMAC (`ELEVENLABS_WEBHOOK_SECRET`) |
| **Pool discovery (already in-app!)** | `lib/methodology/pool-discovery.ts` | Brave + Anthropic | `@caistech/brave-search` direct — the model for everything else |
| **Post-production tickets** | `app/layout.tsx` `<SayFixWidget>` | SayFix service | client widget only |

> Note: **Hunter / Apollo / Unipile / email-finder are NOT in this repo today** — they live only in
> InvestorPilot. Internalising discovery means *adding* those `@caistech` packages to the Pipeline app.
> Brave is already consumed in-process via `pool-discovery.ts` — that file is the template for the pattern.

### 1c. The validation orchestrator (already external, in `cais-shared-services`)

The `validation-run` GitHub workflow runs the producers (naive-tester, voice-auditor, admin-tester,
promise-judge, repo-probe) against a product's live URL and writes results back to the cockpit DB via
`CAIS_GATES_URL`. This is the find→route→fix→verify loop (memory: `project_validation_orchestrator`).
It stays as Pipeline's CI engine; only the write-back target changes if the DB moves (Decision D2).

---

## 2. Target architecture — the integrated Pipeline product

```
┌────────────────────────────────────────────────────────────────────┐
│  PIPELINE  (standalone Next.js app, own repo, own domain post-GO)    │
│                                                                      │
│  COCKPIT (operator)            USER PIPELINE (CRM)                    │
│   /admin/pipeline  ───────┐     /pipeline/today, /contacts           │
│   /admin/methodology      │                                          │
│   readiness scoring       │                                          │
│   gate ledger             ▼                                          │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  THE 5-STAGE LOOP, IN-PROCESS                                 │   │
│  │  1 Ideation   → cards + ideation inbox                       │   │
│  │  2 Feasibility→ office-hours pass + gate-critical fields     │   │
│  │  3 Discovery  → @caistech/{brave,hunter,apollo,unipile,      │   │
│  │                  email-finder}  (replaces IP webhook)        │   │
│  │     + Interview → @caistech/elevenlabs-convai +              │   │
│  │                   voice-validation-bridge (replaces          │   │
│  │                   Connexions webhook)                        │   │
│  │  4 Go/No-Go   → readiness + demand scoring rubric            │   │
│  │  5 Build/Ship → design-build CI + validation-run producers   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  POST-PRODUCTION: own SayFix-style ticket agent                      │
│   @caistech/sayfix-embed + autofix loop (AUTOFIX_LOOP.md)            │
└────────────────────────────────────────────────────────────────────┘
            │ writes results          ▲ producers run in CI
            ▼                         │
   Shared cockpit DB tfgtfhwvrswjvkyeyvsp (portfolio validation data, cross-network)
            + Pipeline-own instance (pipeline.* CRM) — D2 = split only Pipeline-owned
```

**Key principle:** Pipeline does NOT depend on IP/Connexions/SayFix *deployments* being up. It
consumes the **same `@caistech` substrate** those products consume, in-process. IP and Connexions
remain portfolio products (they have their own end markets — Engine 3 / interviews); they are not
retired (Decision D3). What dies is the **fragile cross-product runtime webhook dependency**.

The substrate already exists (`SHARED_SERVICES.md`):
- Discovery: `@caistech/email-finder` (Hunter→Apollo cascade), `@caistech/hunter-email`,
  `@caistech/apollo-people`, `@caistech/brave-search`, `@caistech/unipile-channels` (LinkedIn + Gmail/Outlook send).
- Interview: `@caistech/elevenlabs-convai` (full persistent-memory voice loop + React widget),
  `@caistech/voice-validation-bridge` (extracts validation-schema fields from interview transcripts),
  `@caistech/cais-interview-agent`.
- Ticketing: `@caistech/sayfix-embed` + the proven autofix loop (`cais-shared-services/AUTOFIX_LOOP.md`).

---

## 3. The cut — what moves, what stays, what to sever

### 3a. Moves to the new Pipeline app (lift-and-shift)
All of §1a — every `/pipeline/*`, `/admin/pipeline/*`, `/admin/methodology/*` route, their APIs,
the `admin`/`methodology`/`pipeline` component trees, the `lib/methodology` + `lib/pipeline` modules,
the methodology + pipeline migrations, and the 4 scripts.

### 3b. Stays in `corporate-ai-solutions` (the marketing site)
Homepage, `/marketplace`, `/pricing`, `/studio`, `/engagement`, `/partner`, `/deck`, lead-capture
APIs (`/api/leads`, `/api/partners`, `/api/investors`). CAS reverts to being purely the brochure +
marketplace it was scoped as.

### 3c. The 6 coupling points to sever (the hard part)
| # | Coupling | Sever how |
|---|---|---|
| 1 | `lib/supabase.ts` shared by cockpit + marketing lead-capture | New `lib/supabase.ts` in Pipeline app, operator-key only |
| 2 | `lib/constants.ts` (`PLATFORMS[]`, `SITE`, `VOICE_AGENTS`) | Cockpit already reads `portfolio_manifest` at runtime; carry only `PLATFORMS` seed; define Pipeline's own `SITE`/voice config |
| 3 | `middleware.ts` matcher (`/pipeline`, `/admin`, `/api/methodology`) | Pipeline app owns the whole matcher; lift `isOperator()` + API-exempt logic |
| 4 | Shared auth utils (`lib/auth.ts`, `auth-utils.ts`) | Copy into Pipeline app (small, stable) |
| 5 | `VOICE_AGENTS['morgan']` shared with marketing | Define Pipeline's own Morgan agent config |
| 6 | `pipeline.*` + `methodology_*` schema in the CAS Supabase | Decision D2 = **split only `pipeline.*`** to a Pipeline instance; cockpit tables stay shared, read cross-network (§6) |

None of the cockpit code is imported by marketing routes (verified) — the dependency is one-way
(both read shared `lib/`), so the cut is mechanical, not architectural surgery.

---

## 4. Component-by-component integration (the new internalised parts)

### 4a. Discovery (replaces the InvestorPilot webhook)
- **Add** `@caistech/email-finder`, `@caistech/hunter-email`, `@caistech/apollo-people`,
  `@caistech/unipile-channels` to the Pipeline app (Brave already in via `pool-discovery.ts`).
- **New in-app jobs:** given a card's ICP (already derived in `pool-discovery.ts` → `generate-icp`),
  source two contact streams (distributor + end-user) in-process, write to a Pipeline-owned
  `discovery_prospects` table instead of POSTing to IP.
- **Outbound:** drafted messages land in a **human-in-the-loop approval queue** (per `BUSINESS_MODEL.md`
  §4: everything automated except the final send). On approve, send via `@caistech/unipile-channels`
  (LinkedIn DM) / Gmail. Config = Unipile account + Hunter/Apollo keys, not a separate product.
- **Retire** `relayInterviewedToInvestorPilot()` + the IP signal webhook once parity is proven.

### 4b. Interview agent (replaces the Connexions webhook)
- **Consume** `@caistech/elevenlabs-convai` (already a dependency, v0.4.4) for the voice interview +
  persistent-memory loop, and `@caistech/voice-validation-bridge` for the structured-feedback return leg.
- The interview becomes a Pipeline route (`/interview/[token]`) with an anon session token
  (`mintAnonSessionToken`), not a Connexions deployment. Transcript → `voice-validation-bridge` →
  `methodology_responses` (same table, same classify/score path already in `lib/methodology/classify.ts`).
- **Verify the HMAC** on every convai webhook (`VOICE_MEMORY_STANDARD`).

### 4c. Post-production ticket agent (Pipeline's own SayFix)
- Keep `<SayFixWidget repo="pipeline" />` in the Pipeline layout (PRODUCT_STANDARDS SayFix gate).
- Wire the **autofix loop** (`AUTOFIX_LOOP.md` §4 is the port map): ticket → triage
  (suggestion→operator / bug→builder→PR URL) → operator approves push-to-prod. Distributor-first
  framing already settled (memory: `project_sayfix_distributor_definition`).

### 4d. Validation orchestrator (keep, harden)
- The `validation-run` producers stay in `cais-shared-services` as Pipeline's CI. `CAIS_GATES_URL` is
  **unchanged** — the cockpit tables stay on the shared instance (Decision D2 = split only `pipeline.*`),
  so producers keep writing every product's results there (§6, steps 3–5).
- **Fix the reachability gap §8 surfaced** — this is a prerequisite, not optional.

---

## 5. Migration phases (de-risked, behaviour-preserving first)

| Phase | Goal | Exit criterion |
|---|---|---|
| **0. Decide + scaffold** | Settle Decisions D1–D5; create the new repo; CI; env; **provision the standard QA accounts + session-minter magic-link path (A4)** | New app builds + deploys empty shell; QA accounts exist |
| **1. Lift-and-shift** ✅ committed | Move all of §3a; sever the 6 couplings; **keep IP/Connexions webhooks exactly as-is** | Cockpit + CRM run standalone, byte-for-byte behaviour, deal-findrs card renders; **`/naive-tester` PASS recorded against the live deploy before the URL is shared (§0.5 URL-share gate)** |
| **1.5 Harden orchestrator** ✅ pulled-forward | §8 fix + producer reliability + fail-loud on 0-rows — **before** internalisation, so we observe the loop | A full validation-run records fresh rows reliably; a 0-row run goes red |
| **1.6 Harden IP/Connexions integration** ✅ committed (§15) | Replace the fragile webhooks with reliable calls (shared cockpit DB / queue / retries) — KEEP IP+Connexions as the capability owners; no reimplementation | The discovery + interview round-trips survive a missed/duplicated event (idempotent) |
| **2. Internalise discovery** ✅ COMMITTED NOW (Dennis 2026-06-11, reversed the SaaS-gate) | §4a — in-app Unipile/Hunter/Apollo + approval queue; retire the IP relay | A card sources both streams in-process; IP becomes a dead dependency |
| **3. Internalise interviews** ✅ COMMITTED NOW (Dennis 2026-06-11) | §4b — in-app convai interview + validation-bridge; retire the Connexions webhook | A voice interview completes end-to-end inside Pipeline |
| **4. Own ticketing** ✅ committed | §4c — Pipeline SayFix + autofix loop (genuinely Pipeline's own surface, not a duplication) | A ticket → PR round-trips |
| **5. Dogfood Pipeline through itself** | §13 — enrol Pipeline as a product card; run intake→coach→validation→gates on its own deployment | Pipeline holds a real Gate-1 score produced by its own producers |

**Committed now:** Phases 0, 1, 1.5, 1.6, 4, 5. **Gated on the Pipeline-as-SaaS Gate-2 GO** (§15):
Phases 2–3 (internalising discovery + interviews) — until then Pipeline *calls* IP/Connexions via the
hardened Phase-1.6 integration, not a reimplementation (coexist + DRY). Phase 1 is shippable on its
own; Phase 1.5 was pulled forward from the old Phase 5 (you cannot migrate a loop you cannot observe —
the deal-findrs silent-no-op proved it).

---

## 6. Data strategy — split only Pipeline-owned data (Decision D2 locked 2026-06-10)

The key reframe from the outside-voice review: **the cockpit tables are the PORTFOLIO's data, not
Pipeline's.** `methodology_*`, `readiness_*`, `portfolio_manifest`, and `product_validation_status`
hold rows about *all ~38 products* and are written by *every* product's `validation-run` and read by
hub tooling (`portfolio-env-sync`, `portfolio-migrator`) and the CAS marketplace. Moving them to a
"Pipeline-owned" DB would silently make the Pipeline app's database the whole portfolio's backbone.
So we split only what is genuinely Pipeline's:

1. **Create the Pipeline Supabase instance** (a 4th live instance — cockpit `tfgtfhwvrswjvkyeyvsp`,
   InvestorPilot `azelomanmlywwzbpkksy`, easy-claude-code, + Pipeline).
2. **Move ONLY the `pipeline.*` schema** (`contacts`/`events`/`audit_log` — the user CRM, genuinely
   Pipeline's own functional data) to the new instance via `pg_dump`/restore
   (`SUPABASE_MIGRATION_PLAYBOOK.md`). This is a small table set with a single writer (the intake
   webhook) — a brief freeze→dump→diff→replay window covers in-flight writes (P1.1).
3. **STAYS on the shared instance `tfgtfhwvrswjvkyeyvsp`** (the portfolio cockpit DB): all
   `methodology_*`, `readiness_*`, `promise_attributes`, `readiness_criteria`, `pipeline_gates`,
   `readiness_waivers`, `portfolio_manifest`, `product_validation_status` — plus the CAS marketing
   lead-capture tables. **No producer re-point. No manifest-ownership break. No marketplace break.**
4. **The Pipeline app reads/writes the cockpit tables cross-network** (service key to the shared
   instance) — exactly the pattern the `validation-run` producers already use. Two DB connections in
   the Pipeline app: the shared cockpit instance (portfolio validation data) + its own instance
   (Pipeline CRM, and the Phase 2–4 additions below).
5. **`CAIS_GATES_URL` is UNCHANGED** — producers keep writing every product's results to the shared
   cockpit instance. The original "re-point" cascade is gone; this is why this option is low-risk.
6. **New tables Pipeline adds (deferred to Phases 2–4):** `discovery_prospects`, an outreach
   `approval_queue`, interview-session rows — these ARE Pipeline-owned → new instance.
7. All migrations: RLS on, idempotent, applied via CLI against the **verified ref** — and since
   Pipeline now spans two instances, print the linked ref before every `db push` (the cockpit tables
   target `tfgtfhwvrswjvkyeyvsp`; CRM + new tables target the Pipeline ref). The 4th instance widens
   the drift trap — update the `PRODUCT_STANDARDS.md` §9 ref-map with the new Pipeline ref.

---

## 7. Open decisions for review (recommendations attached)

| # | Decision | Options | Recommendation |
|---|---|---|---|
| **D1** | Repo strategy | (a) New standalone repo · (b) Keep in CAS monorepo behind routes | **DECIDED: (a) full new-build provisioning** — new repo + new Supabase + new Vercel + new ElevenLabs agent (standard new-build kit) |
| **D2** | Database | (a) Stay on cockpit instance · (b) Split all · (c) Split only Pipeline-owned | **DECIDED 2026-06-10: (c).** Move only `pipeline.*` CRM; portfolio-cockpit tables stay shared, read cross-network. See §6 |
| **D3** | IP / Connexions fate | (a) Coexist · (b) Retire | **DECIDED: (a) Coexist** (products stay). ⚠️ but see §15 — coexist reframes *internalisation* (Phases 2–3) as capability-duplication, not product-retirement |
| **D4** | Positioning / lane | (a) Internal tool · (b) Locked SaaS · (c) Validated-hypothesis SaaS | **DECIDED (CEO-review §16): (c).** SaaS is a hypothesis, not a locked positioning; internal-only build now; validate via a faked white-label demo tenant; hosted-engine-private moat; real multi-tenant infra only on a Pipeline-as-SaaS Gate-2 GO |
| **D5** | Name + domain | Pipeline / Factory / other | **DECIDED: name = "Pipeline".** Domain bought only post-validation (Gate-2 spend rule) |

---

## 8. Evidence the engine works — the deal-findrs run (today, 2026-06-10)

**Question (a): how well does deal-findrs do?** — On its last good data (06-07) it is the
**strongest product in the pipeline**:

- **Experience/UX:** naive-tester PASS across responsive (#2), auth pattern (#22–25), explanatory
  headers, agent-readiness — essentially every NAIVE check green.
- **Voice:** voice-auditor PASS (#10, #12, #13, #16–19); memory checks N/A where not applicable.
- **Promise + preconditions:** P1 (live link), P2 (named distributor), P3 (four gate questions) all PASS —
  the three HARD rubric gates are green. Promise/distributor/end-user/friction/core-mechanism all populated.
- **Hard-gate tally:** 9 / 12. **Gate-1-ready: false** — blocked ONLY by *mechanical provisioning*, not experience:
  - `VT_D2` / `VT_D3` **fail** — the standard QA admin accounts aren't fully provisioned.
  - `VT_A1–A4` **na** — admin-tester couldn't auto-verify because the admin login is **magic-link-only**
    (no password form), so it recorded na + provisioning instructions (per the §9.5 standard-accounts rule).
  - `#35` (email sender) **fail** — Resend verified-subdomain sender not configured.
  - `#28` flipped to pass on 06-07 (was the stale url-share gate).

  **Verdict:** deal-findrs is experientially Gate-1-ready; it is held back purely by QA-account
  provisioning + magic-link auto-login + email-sender config. Those are exactly the "scale/ops"
  mechanical items, not "I want that" experience gaps. Fix the three and it clears Gate 1.

**Question (b): how well does the overall pipeline flow work now?** — **The orchestration is sound;
the producer leg has a reachability defect.**

- ✅ The `validation-run` workflow fired on demand, resolved the right product + URL
  (`deal-findrs.vercel.app`), ran all five producers, and the write-back path to the cockpit exists.
- ❌ **This run recorded nothing.** The browser producers failed fast:
  `naive-tester: could not load any page — recording nothing` (exit 1); voice-auditor + promise-judge
  same; admin-tester reached the site but hit the magic-link wall and recorded 4 na. So the card is
  **stale at 06-07** — the 09:22 run added zero fresh rows.
- ⚠️ **The workflow still reported "success."** The producers are `continue-on-error`, so a total
  recording failure looks green at the workflow level. That is the dangerous failure mode — a silent
  no-op that reads as a pass.

**Root cause (CONFIRMED 2026-06-10):** a one-line producer bug, not a Vercel wall. All four producers
read the URL verbatim (`const origin = arg('url').replace(/\/$/, '')`, e.g. `naive-tester.mjs:19`),
the cockpit stores `mvp_url` with **no `https://` scheme** (`deal-findrs.vercel.app`), and
`page.goto("deal-findrs.vercel.app")` is an invalid URL to Playwright → both attempts throw →
"could not load any page — recording nothing." Proof it's the scheme and not protection: `curl -L`
on the root and `/admin` both return HTTP 200 with no SSO wall. Fix = prepend `https://` in
`lib.mjs goto()` (details in `DEALFINDRS_GATE1_PUNCHLIST.md` B1). Still an argument *for* the
consolidation: fewer cross-product hops = fewer places the loop silently breaks.

**Two concrete fixes regardless of the separation:**
1. Make the producers **fail the workflow** (or surface a "recorded 0 rows" alarm) when they load nothing,
   so a silent no-op can't read as success.
2. Resolve deal-findrs reachability: verify the bypass secret + canonical URL, and give the
   admin-tester a **password-login QA path** (or magic-link mint via the session-minter `--magic-link`
   mode per PRODUCT_STANDARDS §9) so VT_A1–A4 resolve instead of sitting na.

---

## 9. Risks

- **Discovery internalisation needs Unipile LinkedIn accounts + Hunter/Apollo keys** in the Pipeline
  app — these are live, rate-limited, cost-bearing. Honour the monetisation rails (R10/R12/R14: BYOK
  where possible, hard usage caps).
- **The magic-link-only admin login** blocks automated admin verification portfolio-wide, not just
  deal-findrs — worth a standard fix.
- **DB split widens the drift trap** (D2 = split now) — a 4th live Supabase instance + the producer
  re-point are the riskiest Phase-1 items; print the linked ref before every `db push` (PRODUCT_STANDARDS §9).
- **Phase discipline:** Phase 1 must preserve behaviour exactly (keep webhooks) before any seam is
  swapped, or the loop breaks mid-migration.

---

## 13. Pipeline dogfoods itself (Phase 5)

The ultimate proof the factory works is the factory running *on itself*. Once extracted, Pipeline is
**not special-cased** — it is enrolled as a product card in its own cockpit and runs the identical
path every other product runs:

- **Intake** — a `methodology_hypothesis_cards` row for `pipeline` (promise / distributor / end-user
  / friction), admitted through the one-door coach gate like any other product.
- **Coach phase** — the same `OnboardingCoach` / voice-coach intake that captures gate-critical
  fields. Pipeline answers its own four gate questions (who's the distributor? — see D4).
- **Validation producers** — the `validation-run` browser producers (naive-tester, voice-auditor,
  admin-tester, promise-judge) run against Pipeline's **own live deployment**, writing
  `readiness_results` for `product_slug = 'pipeline'`.
- **Gates + score** — Pipeline earns a real Gate-1 readiness score and a Gate-2 demand verdict from
  its own rubric. Lane assignment per D4.

**Bootstrap / recursion guards (outside-voice P2.3 sharpened the real risks):**
- **Self-score can't gate the cockpit.** A failing Pipeline card surfaces as a finding like any other
  product's; it never disables the cockpit that produced it. The self-card is data, not a circuit-breaker.
- **Data-plane guard, not a deployment-lock.** The real break is that a producer run writes
  `readiness_results` rows the cockpit then renders — guard the self-card render against partial/malformed
  rows so a mid-run write can't crash the cockpit reading them.
- **The 0-row trap is worse when scoring yourself.** With the §8 `continue-on-error` bug, a 0-row run
  scoring *Pipeline* reads as a green self-validation — the factory certifies itself while broken. So
  Phase 1.5's fail-loud-on-0-rows is a **hard prerequisite** for dogfood meaning anything.

---

## 14. Open architecture questions surfaced by the eng-review (for tomorrow)

- **A1 — DB decoupling. RESOLVED 2026-06-10 → split only Pipeline-owned data (D2 = c).** The
  outside-voice review caught that the cockpit tables are portfolio-global; moving them would make the
  Pipeline DB the whole portfolio's backbone. Final call: move only `pipeline.*` (the CRM); cockpit
  tables stay shared and are read cross-network. Engineered in §6. This dissolves the producer
  re-point, the `portfolio_manifest` ownership break, and the marketplace break.
- **A2 — Phase-1 is not infra-free.** Moving the app moves the *caller*: IP's signal webhook targets
  CAS's `/api/webhooks/investorpilot-signals`, and the convai webhooks target CAS routes. On the new
  domain those URLs + IP-side allowlists/secrets must be re-pointed. "Keep webhooks as-is" holds at
  the code layer, not the infra layer — **Phase 1 needs a webhook-cutover checklist.**
- **A3 — `pipeline.*` move is a coordinated cutover, not a copy** (outside-voice P1.1). The intake
  webhook writes to `pipeline.contacts`; freeze it during the dump, then diff→replay, or in-flight
  interviews are lost at cutover.
- **A4 — QA-account + magic-link auth gaps belong in Phase 0/1, not "regardless"** (outside-voice
  P3.3). They block Pipeline's own §13 dogfood (admin-tester VT_A1–A4 will sit `na` on Pipeline too) —
  provision the standard accounts + the session-minter magic-link path as part of scaffolding.
- **A5 — outbound idempotency for Phases 2–4** (outside-voice P3.2). Webhooks gave process isolation
  for live LinkedIn/email send; in-process means a Pipeline crash/redeploy can drop or double-send.
  The internalised outbound needs an at-least-once + dedup design — name it when Phase 2 is scoped.

---

## 15. Eng challenge on D3 + D4 — the internalisation thesis (DECIDED 2026-06-10; REVERSED 2026-06-11)

> **UPDATE 2026-06-11 — gating LIFTED.** Dennis chose to internalise NOW (not at the SaaS GO):
> pipeline brings IP's discovery/outreach engine + the interview engine in-process so IP/Connexions
> become dead dependencies and pipeline is self-contained. Accepted tradeoffs (vs the original
> reasoning below): pipeline duplicates IP's capability (mitigated by consuming the SAME `@caistech`
> substrate, not forking IP's code — DRY at the package level), and the shared Unipile account needs
> per-system coordination. Phases 2–3 are now committed work, not SaaS-gated. The reasoning that
> produced the (now-superseded) gate decision is preserved below for the record.

**Original outcome (superseded): gate internalisation on the Pipeline-as-SaaS Gate-2 GO.** Coexist + DRY now (Pipeline
*calls* IP/Connexions via the hardened Phase-1.6 integration); internalise (Phases 2–3) only when a
sellable SaaS needs self-containment. The reasoning that got here:

D3 (coexist) and D4 (future SaaS) are locked, but together they reframe the plan's **headline thesis**
— "internalise discovery + interview in-process instead of webhooks" (Phases 2–3). The eng read:

**Internalisation is a capability-duplication decision, not a product decision.** Coexist means IP
stays the portfolio's outreach engine (Engine 3 — and per `BUSINESS_MODEL.md` §11.2 the validation
pipeline *is* IP's standing funnel) and Connexions stays the interview product. If Pipeline *also*
runs discovery + interviews in-process, you have **two systems driving the same Unipile LinkedIn
account and the same Hunter/Apollo quota** (ban + double-send hazard, A5) and **two codebases to keep
in sync** on the same `@caistech` substrate. That's a DRY violation at the system level — the exact
thing the `@caistech`-first rule exists to prevent, one level up.

**The two locked decisions pull in opposite directions on this:**
- **Coexist + DRY → don't duplicate.** Keep IP/Connexions as the capability owners; Pipeline *calls*
  them. The webhook fragility we saw (§8) is an argument to make the *call reliable* (shared cockpit
  DB, a queue, or robust retries), not to *reimplement* the capability.
- **Future SaaS → do duplicate.** A Pipeline you sell to other studios must be self-contained — you
  can't ship a product whose setup is "also buy these two other products." A sellable Pipeline needs
  the whole loop inside one app.

**Resolution (the persuade): gate internalisation on the SaaS GO, not on "standalone runs clean."**
Until Pipeline-as-SaaS clears its own Gate-2 (validated demand from other studios — the same
dual-stream every product gets), **harden the call to IP/Connexions rather than duplicate them.**
Internalise (Phases 2–3) only when the SaaS future is real enough to need a self-contained product.
This keeps DRY + dodges the double-drive hazard now, and defers the duplication cost until revenue
justifies it. Net change to the plan: Phases 2–3's trigger moves from "standalone running clean" to
"Pipeline-as-SaaS Gate-2 GO"; in the interim, add a small **Phase 1.6 — harden the IP/Connexions
integration** (reliable calls, not webhooks-or-rewrite). Phase 4 (own SayFix ticketing) is unaffected
— that's genuinely Pipeline's own surface, not a duplication of IP/Connexions.

---

## 16. CEO review — the D4 SaaS bet (DECIDED 2026-06-10)

Pressure-tested the "Pipeline becomes a lane-1 SaaS" bet. Four CEO-lens objections were raised; the
resolution holds the ambition while defusing each.

**Objections raised:**
1. **Moat-leak** — selling the factory could hand competitors the methodology that's supposed to be
   the durable, ownable asset (the North Star's "what makes it his is the methodology").
2. **Re-chains Dennis to the tireless middle** — a SaaS = support/onboarding/sales, the opposite of
   "free Dennis to opine and decide" (the North Star tie-breaker).
3. **Unvalidated GO** — "DECIDED: future lane-1 SaaS" pre-blesses a positioning the methodology itself
   says must be validated.
4. **Category** — "lane-1" assumed a per-active-end-user clip with a named distributor book.

**Resolution (decided):**
- **D4 = validated-hypothesis, not locked positioning.** Build internal-only now. Pipeline-as-SaaS
  must clear its OWN Gate-2 (real studio demand via dual-stream validation) before any positioning or
  multi-tenant infra. Defuses objection 3 and the tie-breaker (2) — no SaaS company gets stood up on a guess.
- **Validation vehicle = a faked white-label demo tenant** (THIN_MVP_RUBRIC, experience-vs-infra
  split). To show studios the distributor experience you build a tenant-scoped *view* + seeded
  "other studio" portfolio + logo swap, single-tenant under the hood, founder-operated — NOT real
  multi-tenancy/billing. "SaaS-like" (experience) ✓, "SaaS" (infra) ✗. This is the Gate-1 outreach
  artifact; real multi-tenant/billing only on the Gate-2 GO.
- **Moat = hosted-engine-private (RESOLVES objection 1).** Distributors get the **white-label
  front-end only**; the methodology engine (rubric weights, gate policy, scoring, prompts, producers)
  stays **server-side on CAS's backend and never ships to them**. They consume the judgment as a
  hosted service; they never possess it. This is the canonical `BUSINESS_MODEL.md` §3 **Hosted**
  lane-1 shape — and it re-legitimises the "lane-1" label (objection 4 narrows to a pricing detail:
  the metered unit, per-seat vs per-validated-product-run, decided at the Gate-2).

**Net:** the SaaS ambition stays alive as the headline value-capture play, but it earns its GO through
the same pipeline as every other product, the validation costs a demo not a platform, and the moat is
protected by architecture (front-end to distributors, engine stays home).

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | CLEARED | D4 pressure-tested → validated-hypothesis SaaS; moat resolved (hosted engine private); §16 |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | ISSUES_RESOLVED | scope reduced (extract-first); 1 arch decision (DB); 0 critical gaps |
| Outside Voice | Claude subagent (Codex CLI broken) | Independent challenge | 1 | issues_found | DB-split reframe (P1.1/1.2/1.3) → reshaped D2; 5 additive fixes (A2–A5) folded in |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | n/a — backend/architecture plan |
| DX Review | `/plan-devex-review` | DX gaps | 0 | — | n/a |

- **CROSS-MODEL:** Eng-review locked "split DB now"; outside voice showed the cockpit tables are
  portfolio-global. Resolved by Dennis → split only Pipeline-owned `pipeline.*` (D2 = c). Both
  reviewers now aligned.
- **DECISIONS LOCKED (all of D1–D5 + scope + internalisation):** scope = extract-first;
  Phases 0/1/1.5/1.6/4/5 committed, Phases 2–3 gated on a Pipeline-as-SaaS Gate-2 GO (§15).
  D1 = new repo + new Supabase/Vercel/ElevenLabs. D2 = split only Pipeline-owned `pipeline.*`;
  cockpit tables stay shared (read cross-network). D3 = coexist. D4 = future lane-1 SaaS
  (single-operator build now, tenant-aware model, no scale infra pre-GO). D5 = name "Pipeline".
  Pipeline dogfoods itself (§13).
- **CEO:** D4 SaaS bet pressure-tested (§16) → reframed from locked positioning to validated-hypothesis;
  validation via a faked white-label demo tenant; moat resolved by architecture (distributors get the
  white-label front-end, the methodology engine stays server-side/private — the Hosted lane-1 shape).
- **UNRESOLVED:** none blocking — all open decisions resolved this session. Open pricing detail for the
  SaaS Gate-2: the metered unit (per-seat vs per-validated-product-run).
- **VERDICT:** ENG + CEO CLEARED — architecture sound, scope right-sized, DB de-risked, internalisation
  gated on validated SaaS demand, D4 SaaS ambition preserved but de-risked (hypothesis + faked-demo +
  private-engine moat). Ready to implement Phase 0/1 when you are.
