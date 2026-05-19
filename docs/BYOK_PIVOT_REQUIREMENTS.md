# BYOK Pivot — Requirements for the next session

**Created:** 2026-05-20
**Wave 2 status (as of 2026-05-19):** SHIPPED — plumbing layer landed (CQR page, PLATFORMS retag, nav dedupe, /engagement stub + 301). See main branch.
**Wave 3 prep (as of 2026-05-19):** IN-FLIGHT on `feat/wave3-prep` branch — Long Tail Venture Studio retired; /launchstack, /studio/invest, /deck deleted; lucide-react bumped past peer-dep conflict; locked Wave 3 decisions captured below.
**Source:** /office-hours session at `C:\Users\denni\` that produced the methodology monetisation plan. This file is the handoff brief for the next Claude session opened against this repo.

---

## Wave 3 — decisions locked 2026-05-19

These were open questions at Wave 2 close; user locked them before Wave 3 starts.

1. **Voice persona — CONSOLIDATE** to one canonical persona. The 4-agent layout (Alex/Scout/Morgan/Victoria) collapses; Wave 3 picks one canonical voice + opening + signature for every surface. Victoria already removed in Wave 3 prep (she qualified for /studio/invest which is gone). Kira's `/launchstack` system prompt also removed.
2. **Property Services in marketplace** — render with a **"shared infrastructure"** badge (not filter out). It's `releaseMode: 'placeholder'` because it's consumed via `@caistech/property-services-sdk`, but the marketplace acknowledges its existence rather than hiding it.
3. **paid-client visibility on marketplace** — Checkpoint **stays visible** with a "Private deployment / by introduction only" badge. **MMC Build is removed** from the marketplace and moves to a new `/clients` (or `/projects`) page along with the LingoPure CTO Advisor and PreLabz CTO Advisor entries currently on `/about`.
4. **New `/clients` page** — Wave 3 deliverable. Hosts MMC Build + LingoPure + PreLabz (current "Live Commercial Contract" content from `/about`). Bare facts, evidence-style: contract shape, scope, dates, tech stack, link out. No marketing language.
5. **Long Tail Venture Studio retired** — for now. Re-introduce after enough studio-in-residence engagements ship that an own-venture-studio narrative is credible (~Phase 2 of `MONETISATION_EXECUTION_PLAN.md`). All `/studio/invest`, `/deck`, `/invest-in-the-future-of-ai` routes deleted in Wave 3 prep; they now 301 to `/about`. Brand text "LONG TAIL AI STUDIO" replaced with "CORPORATE AI SOLUTIONS" across header. Homepage Long Tail Venture Studio section removed.
6. **/launchstack retired** — deleted in Wave 3 prep. Now 301s to `/marketplace`. LaunchStack-specific Kira voice agent prompt removed.
7. **CQR public-ship dependency** — agreed. `/marketplace/cqr` "Deploy Your Own" CTA stays disabled until CQR's sibling session reports the GitHub template URL + Vercel Deploy button URL; then `deployUrl` populates and `status` flips from `'building'` → `'live'` in `constants.ts`.
8. **`layout.tsx` hard-coded nav** — Wave 3 prep removed `/studio/partner` reference and added `/engagement`. Wave 3 should reconcile to a single source of truth (currently `NAV_ITEMS` in `constants.ts`, `Header.tsx` `navItems`, and `layout.tsx` `navItems` all carry parallel arrays).
9. **13 explanatory-header exemptions** — leave as pending. Replace exemptions with proper `<ExplanatoryHeader/>` (or hand-built dark-theme heroes) when the page itself is rewritten in Wave 3 / housekeeping. Don't do it as a separate pass.

---

## `/engagement` page spec — locked 2026-05-19

Content blueprint for the Wave 3 `/engagement` content rewrite. Replaces the Wave 2 holding stub. Programmatic structure: a host (VC / studio / accelerator) reading the page should be able to answer three questions in order, the same shape every time.

### Capacity + windows (lead with scarcity)

```
2 × 3-month engagements per year   OR   1 × 6-month engagement per year (max)
Windows:  January–March  and  July–September
Pipeline: opens 3 months before each window
By application
```

Front-of-page framing: scarcity-priced expertise; signals seriousness; justifies the rate; creates a natural qualification loop.

### A. What the studio-in-residence brings

```
- {n_platforms} live portfolio platforms as receipts
- {n_caistech_packages} reusable @caistech/* modules covering
  {capability_bundle_for_this_cohort}
- Methodology install: auth pattern, bootstrap automation, CLAUDE.md,
  voice agent standard, BYOK substrate
- Client engagement proof: MMC Build (Stages 0-5 in 5 weeks vs 14-week plan),
  PreLabz + LingoPure CTO advisory positions
- Domain bench: construction, NDIS/SDA, fund tokenisation, voice coaching,
  language tech, property intelligence, B2B SaaS
```

Per-host customization: `capability_bundle` curated from the 30 `@caistech` packages to match the host's cohort industries.

### B. What gets delivered while the studio-in-residence is there

```
Studio-level (institution outcomes):
  Week 1:        Discovery + substrate install (CLAUDE.md customised,
                 .npmrc/@caistech registry, auth pattern, bootstrap scripts,
                 voice agent standard)
  Leave behind:  Deployable factory the studio's team operates after the gig

Cohort-level ({4-6} portfolio companies during a 3-mo engagement;
              {8-12} during a 6-mo engagement):
  Week 2-3:      Pick 1 anchor company → ship v0.1 BYOK-first
  Week 4 →:      Scale to remaining cohort, each with working product on their keys
  Per company:   Vercel-deployable repo, voice agent provisioned, env wired

Public artifact:
  Factory Floor essay documenting what shipped (consent-clause mandatory)
  Joint case study used by host to recruit next cohort
```

### C. What the stay looks like

```
Engagement shape:
  Duration:     3 months (default) OR 6 months (deeper transformation)
  Cadence:      1-2 days/week onsite, remote daily with async standup
  Phases:       W1     Discovery + substrate install
                W2-3   Anchor company v0.1 ship
                W4-N-2 Cohort scale-up
                W{N-1}-W{N} Handoff + case study + factory hardening

Cost (three deal shapes; host picks):
  Shape A — Studio Pays:
    Studio: $65k/mo retainer + 1-3% equity in host
    Total cash (3-mo stint): $195k; (6-mo): $390k

  Shape B — Hybrid (shared with cohort fractional CTOs):
    Studio: $35-40k/mo + 1-3% equity in host
    Each cohort company opting in: $7-10k/mo + 0.25-1% equity in that company
    Total cash flows roughly the same as Shape A but distributed across
    multiple counterparties

  Shape C — Modular:
    Base: $30k/mo to studio + per-cohort add-ons
    Host dials engagement depth based on how many cohort cos opt in

Kill criteria (built into every contract):
  - {2-3 measurable triggers — host-specific, e.g., cohort Series A graduation
     rate <X% over prior cohort, substrate not deployable by week N, etc.}
  - Either party can exit at month {N/2} if criteria miss

Exit state:
  - Studio's team running the factory without me
  - Case study published (consent-clause)
  - Open invitation for follow-on engagement at year+1
```

### Equity caps — Rule 7 clarification

`MONETISATION_RULES.md` Rule 7 reads "equity ≤3% per engagement". For hybrid (Shape B) deals where there are multiple counterparties in the same stint, the cap applies **per counterparty**, not aggregate per stint:

```
Host (studio/VC/accelerator):  ≤3% (target 1-3%, mid 2%)
Each cohort company opted in:  ≤3% (target 0.25-1%, mid 0.5%)
```

This needs a small edit to `MONETISATION_RULES.md` Rule 7 to make the per-counterparty reading explicit.

### Inquiry capture (form fields)

A host hitting `/engagement`'s inquiry form should be asked for:
- Host name + role
- Type: VC fund / studio / accelerator / dev shop
- AUM or annual program revenue (qualification gate)
- Cohort size + industries (informs `capability_bundle`)
- Target window (Jan-Mar / Jul-Sep / either)
- Engagement length preference (3-mo / 6-mo / flexible)
- Deal shape preference (A / B / C / open to discussion)
- Past cohort outcomes URL or summary (for Shape-B qualification — see kill-criteria)

Form action: send to Dennis via Resend per the email infrastructure rule. Calendly link as immediate secondary CTA.

### Page tone

- Builder-to-builder; no consulting copy
- Numbers up front (capacity, rate, equity bands) — no "let's chat about your needs"
- The kill criteria are visible — that's the credibility signal
- Voice agent surface present per VOICE AI rule (Wave 3 voice persona = consolidated canonical)

### Wave 3 implementation notes

- Page replaces the Wave 2 holding stub at `src/app/engagement/page.tsx`
- New page gets the hand-built dark-theme three-question structure
- Add `// @explanatory-header-exempt` comment with a Wave 3 reason (custom hero covers R3 intent)
- Inquiry form posts to a new `/api/engagement` route (mirrors `/api/leads` pattern)
- Add `ENGAGEMENT` capture in Supabase (table `engagement_inquiries`) — schema mirrors `lead` shape + the new fields above

---

**Read first (in order):**
1. `C:\Users\denni\.gstack\projects\denni\denni-unknown-design-20260520-014844.md` — APPROVED design doc (the strategy)
2. `C:\Users\denni\MONETISATION_STATE.md` — current state of the monetisation operation (weekly cadence)
3. `C:\Users\denni\MONETISATION_RULES.md` — 11 non-negotiables at auth-pattern severity
4. `C:\Users\denni\MONETISATION_EXECUTION_PLAN.md` — Phase 0 → Phase 4 milestone sequence
5. Memory: `~/.claude/projects/C--Users-denni/memory/project_methodology_monetisation.md` + `project_cqr_byok_distribution.md` + `feedback_operator_does_not_wait.md`

---

## What changed in this repo on 2026-05-20

Two surgical edits, both backwards-compatible:

1. **`src/types/index.ts`** — extended `Platform` interface with 5 optional fields for the BYOK era:
   - `releaseMode?: 'commercial' | 'byok-free' | 'paid-client' | 'in-migration' | 'placeholder'`
   - `githubUrl?: string`
   - `deployUrl?: string` (Vercel Deploy button URL)
   - `deploymentModes?: Array<'customer-self-serve' | 'vendor-self-deploy'>`
   - `requiredCredentials?: string[]`

2. **`src/lib/constants.ts`** — added CQR (Community Question Responder) as the first `byok-free` release in the BUSINESS TOOLS section. `featured: true`, `status: 'building'`, `url: '/marketplace/cqr'` (page does not exist yet — see Task 1 below).

Typecheck (`npx tsc --noEmit`) passes.

---

## Where this work sits in the bigger plan

The methodology monetisation plan (Phase 1c — BYOK-free distribution) ships CQR as the first public artifact. This site is the marketplace surface where every BYOK-free product gets discovered. The current site is positioned around `$49/month marketplace entry` and `45 platforms`; the new direction is `free with BYOK, your keys, your infra, studio-in-residence engagements for teams that want the substrate installed`.

The repurposing of this site is **scoped in three waves**:
- **Wave 1 (this session — DONE):** schema + CQR data entry.
- **Wave 2 (next session — THE WORK BELOW, tightened 2026-05-20):** dedicated CQR page (Task 1) + retag every entry in `PLATFORMS` (Task 4) + nav dedupe + `/studio/partner` → `/engagement` 301 redirect-only (content rewrite deferred). Shipped as one PR.
- **Wave 3 (follow-on, separate PR after Wave 2 lands):** hero rewrite, pricing rewrite, About page rewrite, `/engagement` content rewrite, marketplace card UI honours `releaseMode` (Task 3), voice persona consolidation. Wave 3 runs **after** the platform retag so hero copy can quote an honest count.

---

## Scope (user clarification 2026-05-20, retightened same day)

The next session's Wave 2 scope is the **plumbing layer of the BYOK pivot** — the schema/data side — not the visible copy rewrite. Specifically:

1. The dedicated CQR product page (Task 1 below).
2. Retag every existing platform in `constants.ts` with `releaseMode` and any other BYOK-era fields (Task 4 below) — *"adding to constants"* per user's instruction.
3. Remove the duplicate `Pricing` nav entry (`NAV_ITEMS` lines 71–72) and add a 301 redirect from `/studio/partner` → `/engagement` (route stub only; content rewrite is Wave 3).

Wave 2 ships as a single PR. Wave 3 (hero/pricing/About rewrites, `/engagement` content, marketplace card UI by `releaseMode`) follows as a separate PR — sequenced so hero copy can cite the real post-retag platform count, not a guessed one.

## Tasks, in suggested execution order

### Task 1 (P1) — Build `/marketplace/cqr` dedicated product page

**Why:** the CQR marketplace card already points at this route via `url: '/marketplace/cqr'`. Without the page, the card lands on a 404.

**Acceptance criteria:**
- Route exists at `src/app/marketplace/cqr/page.tsx` (or wherever the existing marketplace product-page pattern lives — check first).
- Hero section: name, tagline (from `constants.ts`), short problem statement.
- Demo placeholder (video embed or animated screenshot — content from user when ready).
- Both deployment modes documented side-by-side: customer-self-serve vs vendor-self-deploy.
- Required credentials list (from `constants.ts` `requiredCredentials` field).
- "Deploy Your Own" CTA — placeholder until the Vercel Deploy button URL is real (the CQR GitHub template + Deploy button URL is in Phase 3 of the execution plan — currently in-progress at CQR's own repo, not this one).
- "View on GitHub" CTA — placeholder pointing at the planned location (`https://github.com/dennissolver/community-question-responder`).
- Methodology footer link — points at the doctrine gist (TBD per execution plan Step 3.1) and the studio-in-residence inquiry route on this site.
- VOICE AI STANDARD RULE compliance — voice agent surface present (consume `@caistech/elevenlabs-convai` per the rule; the site already has 4 ElevenLabs agents available).
- Responsive design rule compliance (mobile ≤414px + laptop ≥1280px).
- UI explanatory header at the top per the explanatory header rule in global CLAUDE.md.

**Before starting:** check `src/app/marketplace/` for an existing dynamic product-page pattern (e.g. `[slug]/page.tsx`). If one exists, CQR should slot into that pattern, not a one-off route. The data is already in `constants.ts` — the page should pull from there, not duplicate copy.

**`deployUrl` convention (added 2026-05-20):** the CQR entry in `constants.ts` carries an explicit `deployUrl: undefined` with a `// TODO: real URL after CQR repo is public` comment. This is deliberate — the field is present so future sessions don't think it was forgotten, and absence-of-value (vs. absence-of-field) signals "intentionally pending." When the CQR repo goes public + the Vercel Deploy button URL is generated, populate this field; do **not** add the field anew.

---

### Task 2 — `marketplaceVisible` defaulting decision — **DECIDED 2026-05-20: Option A**

CQR card and CQR page ship in the **same PR** (Wave 2). No `marketplaceVisible` flag added — unnecessary surface area when the page lands in the same deploy as the card. If a future BYOK entry needs to land before its page is ready, revisit the flag at that point. Do not re-open this decision in the next session.

---

### Task 3 (P2) — Marketplace card UI honours `releaseMode`

**Why:** every BYOK-free card needs a different CTA than commercial platforms ("Deploy Your Own" instead of "Visit Platform"; the GitHub repo + Vercel Deploy button instead of a hosted URL).

**Acceptance criteria:**
- Marketplace product card component reads `platform.releaseMode` and renders accordingly:
  - `'commercial'` → existing "Visit Platform" CTA + hosted `url`.
  - `'byok-free'` → "Deploy Your Own" primary CTA (uses `deployUrl`) + secondary "View on GitHub" link (uses `githubUrl`) + small badge "Free • BYOK".
  - `'paid-client'` → no CTA, badge "Private deployment" (these are client-only — only render in admin views; consider filtering them out of the public marketplace entirely).
  - `'in-migration'` → "Coming Soon" CTA + badge "BYOK release planned".
  - `'placeholder'` → existing waitlist CTA.
- Optional: filter chips on the marketplace page (`All` / `Free with BYOK` / `Commercial` / `Coming Soon`).

**Defer until:** CQR's GitHub template is set up and the Vercel Deploy button URL is real (Phase 3 of execution plan). Building this UI before there's a real `deployUrl` to plug in is premature.

---

### Task 4 (Wave 2 — P1) — Retag every entry in `PLATFORMS` with `releaseMode`

**Why:** the schema is in place; existing platforms have `releaseMode: undefined`. Once Wave 3 renders by mode, every existing card would default to "no badge / no special CTA" — confusing. Retag now, render later.

**Tagging convention — LOCKED 2026-05-20 (user decision):**

Apply this convention mechanically. Do not re-deliberate per row. The entire portfolio is being repositioned to BYOK, so `in-migration` is the **default**; exceptions are explicit and short.

| Tag | Applies to |
|---|---|
| `paid-client` | **MMC Build / Checkpoint only.** True external-client deliverable per user clarification 2026-05-20. |
| `placeholder` | **Platform Trust, PubGuard, and any other entry that's shared infrastructure** (consumed via `@caistech/*` imports per Rule 9, not a deployable customer-facing product). Consider whether these belong on the public marketplace at all — surface to user during retag if any are visible-but-shouldn't-be. |
| `byok-free` | **CQR only at present** (first public BYOK release; already tagged). |
| `in-migration` | **Everything else.** Every other parent entry — including those currently sold as hosted services (Kira, Rehearsals AI, UniversalLingo, etc.). The `commercial` tag is effectively retired in the new direction; the pivot is portfolio-wide, just sequenced over months. |
| **Children inherit parent's `releaseMode`** | A generator's children (e.g. `universal-interviews` under Connexions, UniversalLingo's industry verticals, RaiseReady's `raiseready-impact`) take the parent's tag unless the user explicitly overrides during retag. Do not stop and ask per child — apply the parent's tag and move on. |

**Sequencing:** retag must complete before any Wave 3 hero copy that quotes a platform count. Read `MONETISATION_STATE.md` once at session start for any **specific overrides** the user has flagged since this convention was locked, but otherwise the table above is the authoritative rule.

**Sanity check after retag:** count entries per tag and report the breakdown to the user before opening the PR. Expected shape: ~1 `byok-free` + 2 `paid-client` + 2–3 `placeholder` + everything else `in-migration`. If the breakdown looks different (e.g. a flood of `placeholder` because too many entries got read as shared infra), pause and resurface.

---

### Task 5 (Wave 3 — deferred from next session per 2026-05-20 retightening) — Hero copy + pricing page reframe

**Why:** current hero is *"$49/month marketplace entry + partner with us"*. New direction is *"free with BYOK + studio-in-residence engagements"*. The two don't co-exist coherently.

**Sequencing — non-negotiable:** retag first (Task 4), then count the resulting `releaseMode !== 'placeholder'` entries, then write hero copy using **that exact number**. The doc currently cycles through *45 / 35 / 17+*; the live `constants.ts` has ~46 `id:` entries. Hero copy that quotes a guessed number is a tell — operators read it as marketing slop. Do the count after retag, not before.

**Sequencing note:** if CQR's public artifact (GitHub template + Vercel Deploy button) isn't yet live when the hero rewrite ships, the hero needs a concrete artifact to point at OR a "coming soon" landing for the BYOK proposition. Don't ship a hero that promises a button that doesn't work. If the CQR public ship is genuinely close (Phase 3 of `MONETISATION_EXECUTION_PLAN.md` — week 4-5 target), coordinate the hero rewrite to land in the same deploy window as CQR going public.

**Acceptance criteria when this is run:**
- Hero copy layer in the BYOK proposition. Suggested line: *"Free with BYOK. Your keys. Your infrastructure. Studio-in-residence for teams who want the substrate installed in-house."*
- Pricing page rewrite — primary path is "free (BYOK)"; the $49/mo tier (if retained) becomes a "hosted version" option for teams that don't want to self-deploy; studio-in-residence is the paid wedge per `MONETISATION_RULES.md` Rule 1 / `MONETISATION_EXECUTION_PLAN.md` Phase 1b.
- Three-path section reconciliation: existing CTAs ("Browse Marketplace" / "Partner With Us" / "Join the Journey") need redesign — "Partner With Us" rev-share is a different model from studio-in-residence; either retire it or repurpose it as the engagement entry.

---

### Task 6 (P3) — Reconcile 4 ElevenLabs voice agents with canonical persona config

**Why:** this site currently has 4 ElevenLabs voice agents (Alex, Scout, Morgan, Victoria) with unique system prompts per the CLAUDE.md. The VOICE AI STANDARD RULE in global CLAUDE.md mandates persona consistency across the portfolio — canonical voice ID, opening style, signature line, in `cais-shared-services/voice-config.json`.

**Decision needed:**
- Keep all 4 with declared roles (each agent represents a specific surface: e.g. Alex = marketplace concierge, Scout = lead capture, etc.) — but apply the canonical voice+opening+signature where appropriate.
- OR consolidate to one canonical voice agent across the site.

**Defer until:** `voice-config.json` is created per execution plan Phase 0 Step 0.4.

---

## Constraints that apply to all tasks

- **Rule 6 (anti-fork) applies.** Marketplace card component changes should consume `Platform.releaseMode` directly — don't fork the card per mode. One component, branched rendering.
- **Rule 9 (hub stays closed) applies.** The `byok-setup` wizard (`cais-shared-services/scripts/setup-product-credentials.mjs`) is the canonical source. This site can reference it but should not duplicate its logic.
- **Rule 10 (every key user-provided) applies to CQR specifically.** When the `/marketplace/cqr` page documents the deployment, it lists every key the user provides — no implication that any key is "managed for you."
- **Rule 11 (operator does not wait) applies to this work.** Before flagging anything as "non-trivial / blocked on X / need to wait for Y" — run the verification heuristic. Draft from public surfaces in minutes, route around, don't defer.
- **AUTH PAGE PATTERN + RESPONSIVE DESIGN RULE + UI EXPLANATORY HEADER RULE** in global CLAUDE.md apply to every new page (Task 1's `/marketplace/cqr` page must comply).
- **The methodology brand name is still pending.** Execution plan Phase 0 Step 0.2. Task 1's footer link target depends on this. If the name isn't decided when Task 1 runs, use a placeholder and flag in the PR.

---

## Brand naming — DECIDED 2026-05-20

- **Full descriptive name:** *BYOK AI Factory* — formal contexts only (LinkedIn company, contracts, investor decks, the company footer, formal "about" sections)
- **Everyday brand short form:** *BYOK Factory* — used everywhere else (hero badges, repo names, gist titles, product card footers, in-app branding, conversation)
- **Essay sub-brand:** *Factory Floor* — content arm. Phrasing: *"Factory Floor essays from BYOK Factory"*
- **Eventual one-word form:** *BYOK* — earn over time, do not use yet
- **Tagline candidate:** *"BYOK First. One operator. 17+ AI products that ship with your keys, your infra, your control. Studio-in-residence engagements when your team wants the substrate installed."*

Apply this hierarchy consistently — everyday surfaces use *BYOK Factory*, formal-only uses *BYOK AI Factory*.

## Open decisions surfaced for the user

1. **Dedicated CQR page route:** `/marketplace/cqr` (current `url` value) or `/products/cqr` or other? Whatever pattern existing product pages use, follow it.
2. ~~`marketplaceVisible` flag~~ **DECIDED 2026-05-20: Option A — CQR card + page ship in the same Wave 2 PR. No flag added.** See Task 2.
3. **Hide `paid-client` mode entries from public marketplace?** MMC Build / Checkpoint shouldn't be public-marketable. Filter at render time, or remove from the marketplace category entirely. (Wave 3 — marketplace card UI work.)
4. **Vercel Deploy button URL for CQR** — depends on the CQR repo being public + a GitHub template. Currently both are pending. Wave 2 ships with explicit `deployUrl: undefined` + TODO comment; Wave 3 marketplace card UI needs the real URL.
5. ~~`/studio/partner` — RETIRE or REPURPOSE?~~ **DECIDED 2026-05-20: REPURPOSE as `/engagement`.** Wave 2 ships route stub + redirect; Wave 3 ships full content.
6. **Voice agent reconciliation** — keep 4 ElevenLabs agents (Alex/Scout/Morgan/Victoria) with declared roles + apply canonical opening/signature, OR consolidate to one canonical agent? Depends on `cais-shared-services/voice-config.json` being created per `MONETISATION_EXECUTION_PLAN.md` Step 0.4. **Resolve at start of Wave 3, not Wave 2.**

### Engagement terminology — UNIFIED 2026-05-20

**"Studio-in-residence"** is the canonical term for the engagement wedge across every artifact, public and internal. User confirmed the sweep on 2026-05-20.

- *Studio-in-residence* (sentence case) in running text.
- *Studio-in-Residence* (header case) in section titles and CTA labels.
- *Studio in Residence* (display case, no hyphens) in navigation menu items and hero badges where typographic preference dictates.

The sweep applied across: `MONETISATION_STATE.md`, `MONETISATION_RULES.md`, `MONETISATION_EXECUTION_PLAN.md`, the design doc at `~/.gstack/projects/denni/`, the methodology + CQR memory files, this brief, and `MEMORY.md` index. The legacy term "operator-in-residence" should not appear in any new content.

The chosen term pairs naturally with *BYOK Factory* — the studio comes into the client's dev shop, the factory gets installed. Bridges to existing Longtail AI Venture Studio brand. The audience self-identifies because *studio-in-residence* is a recognisable engagement shape (parallel to *entrepreneur-in-residence* at VC firms, *artist-in-residence* at universities) but specifies *the studio* — implying methodology + people + infrastructure together, not just a person.

---

## Site inconsistency review (added 2026-05-20 after brand decision)

Per user instruction: *"corporate-ai site gets reviewed for inconsistency with the new branding and updated / pages deleted where inconsistent."* This is the per-page action list. Each entry is **UPDATE** (rewrite content), **DELETE** (retire the route + redirect), or **KEEP** (already aligned, no action needed).

### Homepage (`/`)
- **Action:** UPDATE
- **Why:** Hero still aligns at the spine (*"The factory that builds AI companies. One founder. Zero employees. 45 platforms in 12 months."*) but is missing the BYOK proposition and references the `$49/month` floor implicitly via the marketplace CTA.
- **Changes:**
  - Apply *BYOK Factory* brand to the hero (badge / wordmark).
  - Replace `"Browse Marketplace"` CTA copy if it implies paid entry. New CTA: *"Browse Free BYOK Products"* or similar.
  - Replace `"Partner With Us"` CTA per decision #5 above (retire or repurpose as studio-in-residence).
  - Insert tagline near hero: *"BYOK First. One operator. 17+ AI products that ship with your keys, your infra, your control. Studio-in-residence engagements when your team wants the substrate installed."* (or refined version).
  - Founder narrative section: leave Dennis's story largely intact — already aligned.

### Marketplace (`/marketplace`)
- **Action:** UPDATE
- **Why:** Currently 35 platforms shown undifferentiated. New direction requires `releaseMode` badging + different CTAs per mode (see Task 3).
- **Changes:**
  - Add filter chips: All / Free with BYOK / Commercial / Coming Soon / Private (paid-client — admin only).
  - Card rendering reads `releaseMode` and renders the appropriate badge + CTA.
  - `paid-client` entries filtered out of public render entirely.

### Pricing (`/pricing`)
- **Action:** UPDATE (significant rewrite)
- **Why:** Currently fronts `$49/month` marketplace entry + Stripe subscription tiers + credits. New direction is *free with BYOK* + *studio-in-residence engagements*.
- **Changes:**
  - Primary path: *"Free with BYOK — clone any product, bring your own keys, run on your own infra. No subscription. No credit cards."*
  - Secondary path: *"Studio-in-Residence — we install the BYOK Factory substrate inside your dev shop. Monthly retainer + minority equity. Email Dennis."*
  - Tertiary (optional): *"Hosted versions"* — if you retain the Stripe tiers for teams that don't want to self-deploy, position them here as the convenience tier, not the headline.
  - Remove the credit-package framing unless it explicitly maps to studio-in-residence engagement units.

### Solutions (`/solutions`)
- **Action:** UPDATE
- **Why:** Categorisation may need to surface `releaseMode` differentiation. Current categories (Performance / Intelligence / Industry) are orthogonal to BYOK status.
- **Changes:**
  - Add a top-level filter or section for "BYOK-Free Releases" surfacing CQR + future BYOK products distinctly.
  - Keep existing categorisation as a secondary lens.

### Voice AI (`/voice-ai`)
- **Action:** UPDATE
- **Why:** Currently describes the 4-agent voice approach. Per VOICE AI STANDARD RULE in global CLAUDE.md, persona consistency across the portfolio is mandated. This page needs to reflect the canonical persona once decided (open decision #6).
- **Changes:**
  - Once `cais-shared-services/voice-config.json` is created, document the canonical persona on this page.
  - Frame the 4 site-side agents (Alex/Scout/Morgan/Victoria) as role-specialised instances of the canonical persona, OR consolidate to one.

### About (`/about`)
- **Action:** UPDATE — **Wave 3** (demoted from Wave 2 on 2026-05-20 retightening; still a P1 within Wave 3) per user: *"the about page should openly be looking for studio-in-residence opportunities to share the methodology."*
- **Why:** About is now part of the engagement funnel, not just founder narrative. Visitors who read the founder story should land on an explicit invitation to bring BYOK Factory into their own organisation as a studio-in-residence engagement.
- **Changes:**
  - Apply *BYOK AI Factory* (full form) as the legal/formal entity reference where appropriate.
  - Apply *BYOK Factory* (short form) as the operating brand in narrative copy.
  - Add an explicit section at the end (or alongside the founder narrative): *"Looking for studio-in-residence engagements"* — describes the wedge openly, lists what gets installed (auth pattern, bootstrap automation, CLAUDE.md customisation, first 3 `@caistech` packages, factory rhythm), lists who it's for (engineering leaders / dev-shop owners running 5–20 person teams), states the model (cash retainer + minority equity per Rule 7, ≤3% equity per engagement).
  - CTA: routes to `/engagement` (the repurposed `/studio/partner` page) for full details + inquiry form.
  - Tone: builder-to-builder, direct. Not "consultancy services" copy. Not "let's chat about your needs" copy. State what gets installed, the cost shape, who it fits, how to inquire.

### Studio pages

#### `/studio/portfolio`
- **Action:** UPDATE (light)
- **Why:** Portfolio framing largely still aligned. Brand application + any `$49/mo` references need cleanup.
- **Changes:** Apply *BYOK Factory* brand. Review for outdated pricing references.

#### `/studio/thesis`
- **Action:** UPDATE
- **Why:** Thesis content needs to incorporate the BYOK AI Factory direction explicitly. *"The factory IS the unicorn"* + *"BYOK First"* + studio-in-residence wedge should be visible here as the strategic narrative.
- **Changes:** Rewrite to incorporate the methodology monetisation thesis as documented in `~/.gstack/projects/denni/denni-unknown-design-20260520-014844.md`.

#### `/studio/invest`
- **Action:** UPDATE or DELETE depending on whether LP conversations are intended pre-Phase 2.
- **Why:** Studio Fund (Phase 2 in execution plan) is explicitly *out of scope* until ≥2 published case studies exist (~month 18+). Investor-facing content here may be premature.
- **Decision needed:** keep as a long-horizon investor-relations surface (UPDATE to align with BYOK Factory branding and Phase 2 framing), or DELETE until Phase 2 conversations begin.

#### `/studio/partner` → `/engagement` (rev-share Partner With Us)
- **Action:** REPURPOSE as `/engagement` — **DECIDED 2026-05-20** — split across two waves on the same-day retightening:
  - **Wave 2 (next session):** route stub at `/engagement` + 301 permanent redirect `/studio/partner` → `/engagement`. Stub renders a holding page (one-line "Studio-in-residence engagement details — landing soon" + Dennis's contact). This preserves SEO equity and prevents broken inbound links without committing to copy that hasn't been pressure-tested.
  - **Wave 3 (follow-on PR):** full content rewrite per the spec below.
- **Why:** Rev-share partnership model conflicts directly with the studio-in-residence engagement model. The page real-estate (and SEO equity from existing rev-share inbound) is repurposed for the new wedge.
- **Changes (Wave 3 spec):**
  - Page content rewrite: from rev-share Partner With Us → studio-in-residence engagement landing.
  - Required content sections:
    - **What is studio-in-residence** — Dennis brings BYOK Factory into your dev shop for a defined period; installs the substrate; produces a publishable case study; transfers operational competence to your team.
    - **What gets installed** — auth pattern (forgot-password / visibility toggle / magic link per global CLAUDE.md auth rule), bootstrap automation (`onboard-new-project.sh`, env sync, SMTP wiring), CLAUDE.md customised to your stack, first 3 `@caistech` packages wired (typically `platform-trust-middleware`, `corporate-components`, and one domain-specific), voice agent surface per VOICE AI rule.
    - **The model** — cash retainer ($15–25k/month per shop) + minority equity (1–3% per shop, capped at 3% per `MONETISATION_RULES.md` Rule 7), case-study consent clause mandatory per Rule 4, IP terms (contribution-back per Rule 6), kill-criteria built into contract.
    - **Who it fits** — engineering leaders / dev-shop owners running 5–20 person teams shipping client work.
    - **How to inquire** — direct contact (Dennis's email or Calendly per `constants.ts` FOUNDER block). No form for now — keep the bar high; serious inquiries only.
  - Tone: builder-to-builder, direct. Not enterprise consulting copy. State what gets installed, the cost shape, who it fits, how to inquire.
  - Header navigation: update menu link from "Partner With Us" to "Engagement" or "Studio in Residence".

#### `/studio/join`
- **Action:** UPDATE (light)
- **Why:** Talent recruitment likely still aligned. Brand application needed.
- **Changes:** Apply *BYOK Factory* brand. Review framing — if the "Join the Journey" CTA on the homepage continues, this page is its landing.

### Investor deck (`/deck`)
- **Action:** UPDATE
- **Why:** Investor-facing deck. Currently likely positions around `$49/mo + rev-share + venture studio`. Needs reframing around `BYOK AI Factory + studio-in-residence + Studio Fund Phase 2`.
- **Changes:** Significant content rewrite required. Defer until Phase 2 (Studio Fund) is actively being raised — premature to update if no LP conversations are scheduled. Consider DELETING for now if no investor activity is planned within the next 6 months.

### LaunchStack (`/launchstack`)
- **Action:** UPDATE or DELETE — **needs review**
- **Why:** Partner platform. Unclear how it fits the new direction. May be redundant with `/studio/partner` or with the marketplace itself.
- **Changes:** Investigate during the next session — is this still a live product? If yes, apply BYOK Factory branding + `releaseMode` tagging. If no, DELETE.

### Community (`/community`)
- **Action:** KEEP (light review)
- **Why:** *"The Easily Distracted"* Skool community framing aligns naturally with BYOK Factory ethos. Free, community-led, no gating.
- **Changes:** Light brand application. Tagline may need refresh.

### `/invest-in-the-future-of-ai`
- **Action:** UPDATE or DELETE — see `/studio/invest` decision
- **Why:** Long URL is a redirect target (`/invest` → `/invest-in-the-future-of-ai`). Same decision as `/studio/invest` applies.

### Navigation (`NAV_ITEMS` in `constants.ts`)
- **Action:** UPDATE
- **Why:** Current nav has *two* "Pricing" entries (lines 71-72 in constants.ts) — a duplicate that's currently shipping. Needs deduplication. Brand-level rename of menu items may also be appropriate.
- **Changes:**
  - Remove duplicate "Pricing" entry.
  - Consider renaming "Solutions" → "Products" or "BYOK Products" depending on whether the brand emphasises product-shape.
  - Add "Engagement" item if `/studio/partner` is repurposed as studio-in-residence landing.

### Footer
- **Action:** UPDATE (light)
- **Why:** Legal entity remains *Global Buildtech Australia Pty Ltd* (per `constants.ts` line 11). Operating brand surfaces should switch to *BYOK Factory* / *BYOK AI Factory*.
- **Changes:**
  - Operating brand in footer copy: *BYOK Factory* (linked to homepage).
  - Legal entity line: *"BYOK AI Factory is operated by Global Buildtech Australia Pty Ltd (ABN 54 672 395 685)"*.
  - Community link to Skool stays.

### 4 ElevenLabs voice agents
- **Action:** UPDATE — depends on Open Decision #6
- **Why:** VOICE AI STANDARD RULE in global CLAUDE.md mandates persona consistency across portfolio. Currently 4 distinct agent personalities with unique system prompts.
- **Changes:** Either (a) apply canonical voice + opening + signature to all 4, keep distinct role-specialisations, or (b) consolidate to one canonical agent. Decision deferred to user.

---

### Summary table for the next session

| Route | Action | Wave | Depends on |
|---|---|---|---|
| `/marketplace/cqr` | CREATE | **Wave 2** | Task 1 (build the page) |
| `PLATFORMS` retag in `constants.ts` | UPDATE | **Wave 2** | Task 4 (every entry gets explicit `releaseMode`) |
| `NAV_ITEMS` duplicate `Pricing` removal | UPDATE | **Wave 2** | `constants.ts` lines 71–72 — surgical edit |
| `/studio/partner` → `/engagement` 301 redirect + stub page | CREATE | **Wave 2** | Route + redirect only; content is Wave 3 |
| `/` (homepage hero rewrite) | UPDATE | Wave 3 | Wave 2 retag must land first (honest platform count) |
| `/pricing` | UPDATE | Wave 3 | Wave 2 |
| `/about` | UPDATE | Wave 3 | Wave 2 |
| `/engagement` (content rewrite, replacing stub) | UPDATE | Wave 3 | Wave 2 stub |
| `/marketplace` (card UI honours `releaseMode`) | UPDATE | Wave 3 | Task 3; CQR `deployUrl` populated |
| `/solutions` | UPDATE | Wave 3 | Wave 2 retag |
| `/voice-ai` | UPDATE | Wave 3 | Open Decision #6 (voice persona) |
| `/studio/portfolio` | UPDATE (light) | Wave 3 | Brand decisions locked ✓ |
| `/studio/thesis` | UPDATE | Wave 3 | Reference design doc |
| `/studio/join` | UPDATE (light) | Wave 3 | Brand decisions locked ✓ |
| `/community` | KEEP | Wave 3 | Light brand application only |
| Footer | UPDATE (light) | Wave 3 | Brand decisions locked ✓ |
| 4 voice agents | UPDATE | Wave 3 | Open Decision #6 |
| `/studio/invest` | UPDATE or DELETE | Backlog | LP-conversation timing decision |
| `/deck` | UPDATE or DELETE | Backlog | LP-conversation timing decision |
| `/launchstack` | UPDATE or DELETE | Backlog | Investigate current state |
| `/invest-in-the-future-of-ai` | Mirrors `/studio/invest` decision | Backlog | LP-conversation timing |

**Hard blocker for Wave 3 (hero/voice unification):** Open Decision #6 (voice persona — keep 4 ElevenLabs agents with role-specialisations, or consolidate to one canonical). This decision feeds the hero (single voice surface vs. 4) and the `/voice-ai` page rewrite. Surface to user at the **start of Wave 3**, not the start of Wave 2 — Wave 2 doesn't touch the voice layer.

---

## What success looks like at end of the next session (Wave 2)

Per the 2026-05-20 retightening, the next session's scope is **Wave 2 — the plumbing layer**. Hero/pricing/About rewrites move to Wave 3 as a separate PR.

**Wave 2 end-state acceptance (one PR):**
- `/marketplace/cqr` dedicated product page live, compliant with VOICE AI / responsive / explanatory header / explanatory copy rules.
- Every entry in `PLATFORMS` array in `constants.ts` has an explicit `releaseMode` value. (No public render change yet — that's Wave 3.)
- Duplicate `Pricing` entry in `NAV_ITEMS` removed (`constants.ts` lines 71–72).
- `/engagement` route stub exists; `/studio/partner` → `/engagement` 301 redirect in place. Stub page: one-line holding copy + Dennis contact. No marketing rewrite yet.
- CQR entry in `constants.ts` carries explicit `deployUrl: undefined` with `// TODO: real URL after CQR repo is public` comment.

**Wave 3 end-state acceptance (separate PR after Wave 2 lands):**
- Hero copy + pricing page reflect the free-with-BYOK + studio-in-residence direction. The `$49/mo marketplace entry` framing is either retired or repositioned as "hosted version for teams that don't want to self-deploy." **Hero quotes the actual post-retag platform count**, not a guessed number.
- About page rewritten with explicit studio-in-residence invitation.
- `/engagement` stub replaced with full content per the spec in the inconsistency review.
- Marketplace card UI honours `releaseMode` — different CTAs per mode (e.g. "Deploy Your Own" for `byok-free`, no CTA for `paid-client`).
- Open Decision #6 (voice persona) resolved.
- All open decisions resolved or explicitly logged as pending with a tripwire (e.g. "methodology name still TBD; using working name `<X>` until Phase 0.2 of execution plan locks it").

**Coordination with the broader plan:**
- The CQR GitHub template + Vercel Deploy button URL may or may not be ready by the time the hero rewrite ships. If they're not, the hero needs an honest framing ("first BYOK release shipping in days, here's the doctrine") rather than a button that doesn't work yet.
- The methodology brand name decision (`MONETISATION_EXECUTION_PLAN.md` Step 0.2) is a hard dependency for at least three of the tasks. If the name is still TBD at session start, surface this to the user *before* writing any user-facing copy.

**Read `MONETISATION_STATE.md` at the start of the session** — it's the live state file and may have updates from work between now and then. Tripwire status (Rule 1 in `MONETISATION_RULES.md`) takes precedence over all of the above. If tripwire is red, this work pauses regardless of how much is queued.
