# Product Factory — Connector Inventory & Cycle Map

> Working document. Purpose: enumerate every node and every edge in the
> task → trigger → execution → score → display cycle, slot in the
> newly-discovered `easy-claude-code` node, and mark each edge as
> **LIVE / STALE / NEVER-BUILT / DECISION-NEEDED** so we know exactly what
> to verify vs. build vs. deliberately *not* wire.

Status legend:
- **LIVE** — confirmed working this session or previously.
- **STALE** — exists but known-superseded / not the canonical path.
- **NEVER-BUILT** — does not exist yet; would have to be created.
- **DECISION-NEEDED** — could be built, but we must first decide whether it *should* be.
- **VERIFY** — unknown; needs a physical check before classifying.

---

## Hard constraint established this session

`easy-claude-code` runs on its **own Supabase instance**, separate from the
cockpit DB (`tfgtfhwvrswjvkyeyvsp`, shared by cockpit + shared-services only).
Consequence:

> **No "cockpit card reads run/fix data" connector can exist as a shared-DB read.**
> The data lives in a different database. Any link must be an explicit relay
> (push from easy-claude-code → cockpit DB, or pull from easy-claude-code's API).
> The card showing nothing is therefore an **unbuilt edge**, not a broken one.

## Settled by the shared-services audit (claude_map_of_shared_services)

1. **`easy-claude-code` is classified as TOOLING** — "Agent/LLM tooling
   (Python/Node)" bucket, alongside `agentic-os`, `AI_Forge`, `llm-council`.
   It is **not** shared substrate (cockpit / cais-shared-services /
   platform-trust) and **not** one of the 37 scanned product repos. It is a
   tool that *operates on* repos, not a node *inside* the validation chain.
   → This resolves the gate decision below. B1 is OK to build, but as a
   **one-way tool→cockpit report relay**, not as "wiring a pipeline node."

2. **The shared-services moat barely exists yet.** Of 8 patterns, only Voice
   (`@caistech/elevenlabs-convai`, ~9 repos) is genuinely shared — and even
   that is split (~12 repos hand-roll raw ElevenLabs). The other 7 (admin-auth,
   tenant bootstrap, Stripe, email, QA, Supabase client, auth flows) are LOCAL
   or ABSENT in **every** product repo. `@caistech/corporate-components` and
   `portfolio-gate` are phantom deps (declared, never imported except
   LessonsLearned). **`deal-findrs` = all LOCAL except QA.**
   → Bears directly on the scoring leg: see the new note under Edge C.

---

## Nodes

> **DB topology is THREE databases, not "one shared" (corrected 2026-06-05).**
> - `tfgtfhwvrswjvkyeyvsp` = **Cockpit + Shared-services** (same instance — gate
>   machinery reads cockpit tables same-instance). Owns `product_validation_status`,
>   methodology cards, `portfolio_manifest`. **← all PR1 migrations target THIS ref.**
> - `azelomanmlywwzbpkksy` = **InvestorPilot** (its OWN instance — separate from cockpit).
> - easy-claude-code = its OWN instance (separate again).
> The earlier "stale ref" scare was the CLI linked to `azelomanmlywwzbpkksy` (InvestorPilot)
> while pushing cockpit migrations → "relation product_validation_status does not exist."
> Not stale — the wrong one of multiple LIVE DBs. ALWAYS verify link == intended ref before push.

| Node | Repo / Host | DB | Role in chain | Status |
|---|---|---|---|---|
| Cockpit | `dennissolver/corporate-ai-solutions` (Vercel) | **`tfgtfhwvrswjvkyeyvsp`** | Validation UI, `product_validation_status`, canonical scorer | LIVE |
| Shared services | `caistech/cais-shared-services` | **`tfgtfhwvrswjvkyeyvsp`** (same as cockpit) | Gate machinery (reads cockpit tables same-instance), skills, migrations | skills LIVE, pipeline routes STALE |
| InvestorPilot | `dennissolver/investor-pilot` (Vercel) | **`azelomanmlywwzbpkksy`** (OWN, separate) | Downstream market-test consumer | LIVE |
| **easy-claude-code** | Vercel (`easy-claude-code.vercel.app`) | **OWN Supabase** (separate again) | Cloud task executor — runs Claude against a repo, can change code | **TOOLING** (per audit) — external executor, not a chain node |
| `deal-findrs` | `dennissolver/deal-findrs` (GitHub) | n/a | Target repo being validated/fixed | LIVE (configured for cloud exec) |

---

## Edges (the actual connectors)

### A. easy-claude-code internal loop — CONFIRMED THIS SESSION
| Edge | What fires it | Writes | Reads | Status |
|---|---|---|---|---|
| A1 task dispatch | UI input box ("Enter to send") inserts dispatch row | easy-claude-code's own DB | poller | **LIVE** |
| A2 dispatch poller | `GET /api/dispatch?limit=50` on setInterval | — | dispatch rows | **LIVE** (but no error handling — floods console on failure) |
| A3 setup-workflow | `POST /api/projects/setup-workflow` (auth: **user bearer token**, not anon key) | installs GH workflow + secrets (`ANTHROPIC_API_KEY`, `EASY_CLAUDE_API_KEY`, `GH_PAT`) | — | **LIVE** |
| A4 cloud execution | dispatch row → GitHub Actions run on **target** repo (`github-actions.ts:73`) | commit (`:599`) / push autonomous (`:618`) / PR standard (`:614`); status → ECC's own DB (`dispatch/complete/route.ts:41-56`) | repo | **LIVE — CONFIRMED ×2** (both recon tools: it genuinely commits/pushes/PRs to `deal-findrs`) |

### B. easy-claude-code → cockpit — THE GAP
| Edge | What it would do | Status |
|---|---|---|
| B1 run/fix result relay | Carry run status + commit/PR + outcome from ECC into cockpit's card | **NEVER-BUILT — CONFIRMED ×2** (no cross-system write/API either direction; ECC is only a static seed row in cockpit). Build as one-way tool→cockpit relay. |
| B2 join key | Whatever B1 writes must key on something the card matches (ECC `project_id` `07c7743c-…` ↔ cockpit product) | **ESTABLISHED ✓** — intake work added `ecc_project_id` as a first-class column on `product_validation_status`, captured at onboarding, on the card payload via `select('*')`. B1 reads it directly — no string-matching. (B1 relay itself still NEVER-BUILT.) |

> B1 is the edge behind "card isn't receiving run/fix data." It cannot be a DB
> read (separate DBs). It must be a webhook/API push or a cockpit-side pull.
> The audit settled *whether* to build it: yes, but as a **one-way report
> relay from a tool** — easy-claude-code pushes run results into the cockpit's
> table. It does **not** become a first-class pipeline node. Still gated on the
> A4 verification (does a run actually commit?) before it's worth relaying.

### C. Cockpit scoring / display — partially known
| Edge | What it does | Status |
|---|---|---|
| C1 canonical score | `score.ts` / `loadCardScore`, compute-on-read, 45-check rubric | **LIVE** |
| C2 legacy score writer | `recalculate-score/route.ts` — its broken five-boolean formula was **already retired** (`:6-16`); `weighted_score_percent` now derives from `score.ts` and nowhere else; `run-test/route.ts:323` no longer writes score | **RESOLVED** — no longer a *disagreeing* source. `weighted_score_percent` is now a persisted **snapshot of the same math** that can go **stale** (→ handled by C6/freshness). |
| C3 SQL readiness fn | Stage-6 `compute_readiness` SQL duplicate of score.ts | **STALE** (shelve) |
| C4 card → score source | Compute-on-read `loadCardScore`/`scoreCard` (`readiness.ts:23-55`) **AND** a persisted `weighted_score_percent` (`portfolio-scanner.ts:51,198,331`) | **RESOLVED** — the persisted value is now the *same* `score.ts` math (C2 retired the disagreeing formula), so the "two sources disagree" worry was **historical, already fixed**. Remaining risk is purely **staleness** → C6/freshness, not conflict. |
| C5 card → run/fix status | Only `build_status` (manual enum) exists; no execution/dispatch/fix field | **NEVER-BUILT — CONFIRMED ×2** |
| C6 post-commit re-score trigger | After a deploy lands, re-run **headless** verdict producers + write fresh `readiness_results`; flag **agent-required** ones stale | **NEVER-BUILT — CONFIRMED ×2 (THE KEYSTONE).** Correction: only auto/headless checks are server-re-runnable (`validation-test` is *ingest*; naive-tester/judge are agent-produced). P2/P3-as-deterministic-grep may be headless — STEP 0 decides. Build manual `/rescore` first. |

> **Scoring-leg hinge — RESOLVED by recon (×2).** Of 45 checks, only a small
> handful reward *consuming* shared services: #11 Voice → `@caistech/elevenlabs-convai`
> (CONDITIONAL-HARD), #36 `@caistech-first` fork-check (WEIGHTED), and per Claude
> Code also #23 password-toggle shared component (OpenCode's sample didn't surface
> #23 — treat as superset: #11/#23/#36). **Every other check (incl. #38 Supabase,
> auth, tenant) rewards an implementation EXISTING, shared or forked.** So
> `deal-findrs`'s wall of LOCAL is *not* why it fails (except those checks). Your
> reuse rule is **mostly beside this cycle, not inside it** — a fix task will not
> be pushed toward `@caistech/*` by the rubric except on #11/#23/#36. Shared
> consolidation is a separate program, driven by your rule, not the gate.

> **Verdict producers (recon ×2):** writers exist for `auto` (`survey/route.ts:174`),
> `naive-tester` (`validation-test/route.ts:177,191`), `judge` (`survey/route.ts:185,196`).
> `voice-auditor` = NEVER-BUILT. `qa-only` and `gtm-auditor` = report-only, no
> `readiness_results` writer (they inform a human, don't feed the machine).
> `deal-findrs` has no voice → voice-auditor irrelevant for it.

---

## The decision that gated everything downstream — RESOLVED

**Was: is `easy-claude-code` THE execution leg of Product Factory, or a redundant overlap?**

**Resolved by the audit: it is neither — it is external TOOLING.** It operates
*on* repos from its own separate DB; it is not part of the validation substrate.
So:

- B1 is OK to build — but as a **one-way report relay** (tool pushes run results
  into the cockpit), not as promoting easy-claude-code to a chain node.
- The "second uncoordinated writer" risk is contained precisely because it stays
  a tool: it reports *into* `product_validation_status`, it does not own scoring
  or compete with `loadCardScore`.
- Still gated on **A4** (does a run actually commit?) before the relay is worth building.

---

## Recon status — all five questions closed (two independent tools)

Run A = Claude Code (Opus 4.8). Run B = OpenCode (MiniMax M2.5). Same five questions.

| Finding | Run A | Run B | Confidence |
|---|---|---|---|
| Execution commits to target repo | YES | YES | **double-confirmed** |
| Post-commit re-score trigger | NEVER-BUILT | NEVER-BUILT | **double-confirmed** |
| Relay cockpit↔ECC | NEVER-BUILT | NEVER-BUILT | **double-confirmed** |
| Card run/fix field | NEVER-BUILT | NEVER-BUILT | **double-confirmed** |
| voice-auditor producer | NEVER-BUILT | NEVER-BUILT | **double-confirmed** |
| Rubric rewards shared-consumption | only #11/#23/#36 | only #11/#36 | confirmed (superset #11/#23/#36) |
| Card score source | compute-on-read only | compute-on-read **+ persisted `weighted_score_percent`** | **conflict — trust B** (legacy `recalculate-score` corroborates) |
| Portability (Q6) | (skipped) | logic in repo DB/code; only the *runner* is Claude-Code-coupled | single-source (B), reassuring |

**Net:** scoring exists, execution exists, **nothing connects them.** Every
missing edge sits on the execution↔scoring boundary.

---

## The full cycle — definition of done + the four pieces to build

Target loop:
```
scoreCard reads verdicts → card shows score + toReachGo + run/fix truth
  → dispatch ECC fix (a toReachGo item) → ECC commits/PRs to deal-findrs
  → [C6] commit lands → re-run applicable verdict producers → write readiness_results
  → [B1] ECC reports run outcome into cockpit, keyed to card
  → scoreCard re-reads → score moves → repeat until isMvpReady (HARD gate + band GO)
```
Exit condition is exact: `isMvpReady` = HARD gate passes AND band ≥ GO (6.5).

**Build order (by dependency — keystone first):**

1. **C6 — post-commit re-score trigger** (KEYSTONE — without this nothing else
   matters; a relay/field would faithfully report a score that never moves).
   Build as a **manually-invocable** `/rescore` endpoint first, then automate.
   **CORRECTION (recon):** only **headless/auto** producers can be re-run by a
   server trigger — `validation-test/route.ts` is an *ingest* endpoint, and
   `naive-tester`/`judge` are agent-produced (a skill walks the live URL). So the
   trigger re-runs auto verdicts and **flags agent verdicts stale**, not re-runs
   them. **Open question for STEP 0:** P2/P3 are now *deterministic DOM-marker*
   grepping (`survey-markers.ts:228-249,340-359`) — if that's a plain server-side
   fetch+parse it's HEADLESS (so `deal-findrs`'s P2 reseller-banlist HARD failure
   *can* be re-scored autonomously after a fix); if it needs rendered DOM it's
   agent-required. This one answer decides whether `deal-findrs` reaches GO
   autonomously. Use `deployment_id` as the freshness key (no `commit_sha` column).
   Write verdicts via the existing contract, not a slash command (portability).
2. **B1 — relay**: extend ECC's completion callback (`dispatch/complete/route.ts:41-56`)
   to also POST run outcome into the cockpit, keyed via the **now-established**
   `ecc_project_id` column (B2 ✓ — see below). One-way, secret-gated.
3. **C5 — card run/fix field + freshness** (C4 dual-source already RESOLVED — the
   persisted `weighted_score_percent` is now the same `score.ts` math, so this
   shrinks to: add the run/fix field the relay populates, and show **verdict
   freshness** via `deployment_id` so the card distinguishes current from stale
   rather than lying by omission).
4. **voice-auditor** — SKIP for `deal-findrs` (no voice). Build only if an
   applicable `applies_when: voice` check enters scope.

→ Corrected copy-paste Claude Code instruction block for the C6 re-score trigger
is in **`CYCLE_CLOSE_BUILD_SPEC.md`** (STEP 1 rewritten to headless-vs-agent reality).

---

## ⚠️ PARTIAL — Track one: entry-mode intake (create works; render/score BLOCKED)

The onboarding front door establishes path + identifiers at intake (which
**dissolves the B2 join-key problem**) — but a `review` product does **not yet
render or score on the card.** Create works; the card-side seam is not closed.

**What shipped (committed, build green, branch `feat/entry-mode-intake-and-rescore-trigger`):**
- **`entry_mode`** stamped at admission: identifiers ABSENT → auto `new`;
  PRESENT → operator picks `review` | `repurpose` (`new` never offered with
  identifiers; route-level contradiction guard 400s a "new" product carrying assets).
- **Five identifiers** captured: `mvp_url` (reused, not duplicated), `github_repo`,
  `vercel_project`, `supabase_ref`, **`ecc_project_id`** (the B2 relay key, now
  first-class). `review` requires + validates all five; `new` leaves them null;
  `repurpose` captures unvalidated, inert.
- **`repurpose`** = inert "coming soon" placeholder (TODO: pivot identity keep-vs-fork, deferred).
- Migration `20260605000000_entry_mode_intake.sql` **applied to the correct prod DB**
  (`tfgtfhwvrswjvkyeyvsp`) — columns exist. (`GITHUB_TOKEN` deferred to go-private;
  repo public now.)

**❌ Onboarding→card seam — Z WIRED ✓ / Y STILL MANUAL (the render gap):**
A `review`-created product writes `product_validation_status` and routes to the
card. Two card-side side-effects were needed; **neither was ever created by the
coach chain** — the existing portfolio was backfilled (seeded cards + hand-listed
manifest), so `review` is the *first* path asked to create them programmatically.

- **Z — `methodology_hypothesis_cards` row → WIRED ✓** (committed,
  branch `feat/entry-mode-intake-and-rescore-trigger`, `86b9056`). Factored the
  `cards/route.ts` upsert into a **shared helper** `src/lib/methodology/upsert-card.ts`;
  both the route and review-create call it → **one** card-creation path, no fourth
  writer, dead `enrollMethodologyCard` untouched. Card upsert runs *after* the
  identifier-validation gate + the status write (no orphan on failure); idempotent
  on `product_slug`; `loadCardScore` verified to read the new row → product would
  render + score. **Conscious decision:** review-create calls the helper directly,
  bypassing the route's Rule 16 WIP gate — review's five-identifier validation is
  its own gate. (Two gates → one helper; remember this asymmetry exists.)
- **Y — manifest membership → STILL MANUAL.** `portfolio-scanner.ts:645` 404s any
  slug not in `portfolio-manifest.yaml`. The manifest is a **committed file in
  `cais-shared-services`**, not a DB row — so it can't be written by the app at
  review-time (the Y/Z asymmetry). Add via `_onboard-append-manifest.mjs` by hand
  (inputs `vercel_project` + `supabase_ref` are already captured at review).
  **DECISION DEFERRED** (Dennis): wire Z now to move the current portfolio through;
  revisit YAML-file-vs-DB-table once it's done. NB this same wall gates the future
  `new`→graduation path — whatever's decided for Y applies there too.

Consequence: a review product **renders + scores once its manifest entry is added
by hand.** That manual step is the first end-to-end proof of intake→card.

---

## 🧭 SETTLED INTAKE ARCHITECTURE (supersedes the review/repurpose model above)

The review/repurpose selector model recorded above was outgrown. The decided
architecture (being built on a **clean branch from main**, cherry-picking the
survivors: `portfolio_manifest` table + lib, the identifier *columns*,
`upsert-card.ts`, the `/rescore` keystone — dropping the selector, review-skips-coach,
Z+Y-at-submit, repurpose placeholder):

**One door, coach-for-all, deterministic gate, post-gate fork.**

1. **One Product Setup page** — new ideas AND deployed products, no mode selector.
   Mandatory: name + coach questions (pain points, why-now, etc.). Optional:
   asset fields (URL / Vercel / Supabase / GitHub + details) **and KB attachments**
   (docs → Supabase Storage; URLs → reference strings) so the operator can justify
   their market read with evidence. Deployed-vs-new is **derived from live-URL
   presence**, never chosen.

2. **One coach = expert marketing/GTM analyst** (prompted as such — knows what works,
   what doesn't, how it's assessed; guides the operator through a high-probability
   success process). It **ingests evidence** of two kinds:
   - **Live build markers** (when a URL is present) — via `deriveFieldsFromLiveUrl`
     (the ONE shared helper, factored from `survey/route.ts:92-141`, wrapping
     `deriveSurveyFromDom`; it has **THREE callers**: the coach, the **gate
     (server-side re-derive — see gate note)**, and the post-gate survey route).
     The build is *evidence the coach audits the product into spec against*, not a
     pass. Deployed earns nothing.
   - **KB uploads** (any product) — docs/URLs backing the market-read claims.
   No live URL → clean-sheet conversational elicitation.

3. **One HARD gate — DETERMINISTIC, presence-checked, identical for all.**
   - Fails on **absence of justifying evidence** (bare assertion like "big market"
     with no user-supplied or referenceable source → fail) and on **failed build
     markers** (e.g. `data-distributor="reseller"` → P2 banlist fail).
   - **The gate never judges evidence *quality*** — only presence/verifiability —
     so the same finished answers always yield the same verdict. This is the
     anti-flake invariant: re-running the gate on identical inputs CANNOT disagree.
   - **Gate is server-authoritative.** For a URL-present product the gate
     (`admit`) **re-derives P1/P2/P3 from the live URL itself** via the shared helper
     — it does NOT trust markers passed through the client/coach payload (those can
     be stale or forged → tamperable, LLM-adjacent data in the verdict). Re-deriving
     makes identical live URL → identical verdict *by construction*. Do not collapse
     this into the survey route (couples admit to survey's gate-recording side effects).
   - **Deployment-pinned via IMMUTABLE FETCH (eng-review finding):** the live DOM is
     mutable, so a `deployment_id` *stamp* doesn't pin — the gate must resolve the prod
     deployment (Vercel API, `VERCEL_TOKEN`) and derive from the immutable
     `<project>-<hash>.vercel.app` URL, not the live alias. Same deployment → same verdict.
     Unpinned fallback (no `vercel_project`) → no build-marker gating, never claimed pinned.
   - **Staged build (PR1/PR2):** PR1 = determinism core — one door, coach two-mode
     (prefill, don't re-elicit), gate (presence + URL-markers, deployment-pinned, atomic
     membership via an `admit_product` RPC), backfill old admissions, harness fixed first,
     shared validator, dead-code deleted. **PR1 does NOT enforce no-URL "bare assertion →
     fail"** — that needs the KB evidence source. PR2 = KB-upload subsystem + no-URL
     evidence-teeth + expert-analyst persona + post-gate audit-button fork. Full spec +
     riders in `INTAKE_RESHAPE_HANDOFF.md`.
   - **Key principle:** *expert judgment raises the quality of what reaches the gate
     (the coach); presence-determinism guarantees the verdict can't flake (the gate).*
     Making the coach's opinion *be* the gate = the regression to refuse (it
     re-introduces the deal-findrs 12→10→9 LLM-judge non-determinism that was already
     engineered out via deterministic markers).

4. **Membership (card Z + manifest Y) granted AT THE GATE (`admit`)**, not at submit.
   Pass → both rows created, product is in the portfolio. Fail → no card, no manifest,
   not in the portfolio (bounced back to coaching). Invariant:
   **membership-follows-gate.** (Also fixes new ideas, which got no card/manifest
   under the old at-submit model.)

5. **Post-gate card fork keyed on LIVE-URL presence** (not "any asset"):
   - Live URL present → **audit-&-remediate** lane: operator-fired buttons for
     naive-tester / gtm / voice-auditor over the live URL → compliance-gap list.
     (Buttons, NOT auto-run — those producers are the expensive/agent ones; the
     survey-derive is the only cheap in-process one.)
   - No live URL → **design-&-build**.

**Build order:** (a) factor `deriveFieldsFromLiveUrl` (verify survey route unchanged)
→ (b) coach two-mode input → (c) coach SKILL.md live-surface branch → (d) Setup page
(drop selector, add asset + KB fields, derive mode from URL) → (e) move Z+Y to gate
→ (f) post-gate audit-vs-build fork. KB-ingest-at-coach + the expert-analyst prompt
ride on (b)/(c).

**Test-case reality:** deal-findrs currently emits `data-distributor="reseller"` →
it **fails P2 at the gate** under this model. That's correct (comply or stay out),
but means "prove the loop on deal-findrs" now includes fixing its distributor marker
— real product work, not just wiring.

**Migration lesson (codified into `PRODUCT_STANDARDS.md` §9 this session):** the
CLI's `.temp/project-ref` was **stale, pointing at the wrong project**
(`azelomanmlywwzbpkksy` — the InvestorPilot ref), caught only because `db push`
errored `relation "product_validation_status" does not exist`. Verify CLI link ==
app DB *before* every push. The "run migrations via CLI" policy was followed, but
the verify-target + drift/repair runbook was **not** baked in until this incident.

---

## Known hygiene items (not blocking, worth noting)
- A2 poller has no `.catch()` → unhandled-rejection flood when network drops
  (seen in the original DNS-failure logs). Wrap it.
- Auth pattern for any cockpit/executor call from console:
  `localStorage['sb-<ref>-auth-token'] → access_token → Authorization: Bearer`.
  The **anon key is not sufficient** — routes gate on the authenticated user token.
- Treat the user **access token** as a secret in any pasted logs (anon key is public; the session token is not).
