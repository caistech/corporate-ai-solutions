# Naive-Tester Remediation Plan — Corporate AI Solutions

**Date:** 2026-05-19
**Persona:** Helen, 50, CTO at a 500-person AU property / valuation / consulting firm, ex-Big 4 transformation lead, 22 years in tech.
**Source report:** `C:\Users\denni\naive-tester-reports\2026-05-19-1711\corporate-ai-solutions.md`
**Portfolio context:** `C:\Users\denni\naive-tester-reports\2026-05-19-1711\PORTFOLIO_SUMMARY.md`
**Repo:** `C:\Users\denni\PycharmProjects\Corporate-AI-Solutions`
**Live URL tested:** https://corporate-ai-solutions.vercel.app
**Verdict in report:** "Yes, I would email — but conditional on the Studio Partner 404 being fixed before I do."

This is a **plan only**. No fixes have been executed.

---

## 1. Severity-ranked findings

### P0 — Dealbreaker (must fix before Helen revisits)

| # | Finding | Evidence | Buyer impact |
|---|---|---|---|
| P0-1 | **"Studio Partner" link in the global nav returned a 404** with body text "Looks like this page doesn't exist. Maybe the platform hasn't been built yet?" | Report lines 22-23 | Helen explicitly said this is the one thing holding her back from emailing today. A broken header link on the day a 500-person-firm CTO evaluates you closes the procurement conversation. |
| P0-2 | **`/studio` route loads HTTP 200 but renders only header + footer — no body content** | Report line 24 | "Empty page is worse than 404 — I don't know if it's broken, intentional, or coming soon." |

### P1 — High strategic friction (call-blockers if not addressed)

| # | Finding | Evidence | Buyer impact |
|---|---|---|---|
| P1-1 | **Brand confusion** — Corporate AI Solutions / Long Tail Venture Studio / Long Tail AI Studio / Generator / The Factory / The Easily Distracted are 5–6 brands competing on one site | Report lines 18, 64; pattern 6 in portfolio summary | "Every time I have to figure out which brand owns what, I'm losing trust that the operator knows what he's selling." |
| P1-2 | **Investor pitch leaking onto buyer surface** — `$200M+ ARR`, `$5K build cost, 7-day cycle` appears in the hero / "Two Sides" block where Helen (a buyer, not an investor) is evaluating engagement model | Report lines 17, 65 | Buyer-side objection: "I don't care about your portfolio cap-table aspiration; I care whether you can ship for my company." |
| P1-3 | **No data residency / IP-ownership / compliance posture page** | Report line 66 | "For a 500-person AU regulated firm to even short-list you, that page has to exist. Right now it doesn't, and the absence will kill you in procurement." |
| P1-4 | **No named-customer logos or testimonials above the fold.** MMC Build / LingoPure / PreLabz only surface in pricing FAQ + About | Report line 67 | The two strongest existing trust signals are buried. |

### P2 — IA / copy improvements (move from "good" to "great")

| # | Finding | Evidence |
|---|---|---|
| P2-1 | Top-nav has two items ("Studio" + "Studio Partner") that read as duplicates until parsed | Report line 22 |
| P2-2 | "45 platforms" floats in 3 places with no clickable audit trail; marketplace says "35 parent / 10 white-label" — reader has to do the maths | Report lines 16, 33 |
| P2-3 | "Visit Platform" button is the same label whether the destination is live / waitlist / "Building" — buyer can't tell what is sellable today | Report line 34 |
| P2-4 | "Voice AI" used as feature, category, and architecture interchangeably | Report line 35 |
| P2-5 | Custom Build tier card has no price band; "$80k+" is buried in FAQ | Report line 44 |
| P2-6 | Pricing page positioning ("AI-native startups pre-Series A...") explicitly excludes 500-person mid-market buyers — no fourth tier signal | Report line 41 |
| P2-7 | "Solutions Architect / outside-tech / 35 years construction" differentiator is on About, not the landing page | Report lines 15, 48 |
| P2-8 | Final landing CTA pushes buyer-segment visitors into the Skool community as a soft on-ramp — wrong on-ramp for executive buyers | Report lines 55-57 |
| P2-9 | Voice agent CTA is "Open voice assistant" with no context for what it does | Report line 68 |
| P2-10 | Marketplace responsive grid (35 tiles) not verified at 375px | Report line 69 |

---

## 2. Repo validation against findings

### P0-1 — "/studio-partner" 404

**Helen's URL string in the report:** `/studio-partner` (hyphenated).
**Source-of-truth route in the repo:** `/studio/partner` (slashed).

Validation steps run:
- `Grep` for `studio-partner` (hyphenated) in `src/` → **no matches**.
- `Grep` for `/studio/partner` → 14 matches; route file exists at `src/app/studio/partner/page.tsx` (full content, well-formed).
- `src/app/layout.tsx:14` defines the nav as `{ href: '/studio/partner', label: 'Studio Partner' }`. This is the nav actually rendered (via `CorporateHeader` in `src/components/corporate/CorporateHeader.tsx`).
- `src/components/layout/Header.tsx` (legacy / not wired into `layout.tsx`) also uses `/studio/partner`.
- `next.config.js:32-35` has a 301 redirect: `/partner` → `/studio/partner`. There is **no** redirect from `/studio-partner` (hyphenated) to anything.

**Diagnosis** (three candidates, ranked by likelihood):

1. **Most likely — stale Vercel deployment.** The page file exists on disk in this repo, but the deployment Helen tested either pre-dated the `/studio/partner` page commit, or the production build failed for that route and Helen hit `not-found.tsx`. (The 404 body she quoted — "Maybe the platform hasn't been built yet?" — is verbatim from `src/app/not-found.tsx:11`. So she was served the app's custom 404, not a Vercel default. That confirms the request reached Next.js but no route matched.)
2. **Less likely — Helen typed the URL with a hyphen.** The report transcript says she "clicked Studio Partner in the nav," which renders an `<a href="/studio/partner">` element. A click can't introduce a hyphen. Discount this unless the nav was previously hyphenated and got refactored mid-deploy.
3. **Possible — there's a third nav definition we haven't found.** Both Header.tsx and CorporateHeader render `/studio/partner`. No other nav source. Discount this.

### P0-2 — `/studio` empty body

`src/app/studio/page.tsx` is six lines: a `redirect('/studio/thesis')` server component. On the live deploy Helen hit, that redirect either:
- silently failed (rendered the layout chrome with no body — exactly what she reported),
- or the build was stale and `studio/page.tsx` didn't exist yet at deploy time.

The destination page `src/app/studio/thesis/page.tsx` does exist and has real content. So the route is fine in theory; the symptom is a deploy-state mismatch.

### P1-1 — Brand mention audit

Confirmed in source:

| Brand | Where it appears |
|---|---|
| **Corporate AI Solutions** | `lib/constants.ts:5` (canonical site name); `layout.tsx` (page titles); `app/page.tsx:442, 448` (homepage Two Sides block); `about/page.tsx:342` |
| **Long Tail Venture Studio** | `app/page.tsx:442, 462, 464` (Two Sides block) |
| **Long Tail AI Studio** | `app/launchstack/page.tsx:545, 547`; `app/about/page.tsx:68, 261, 326`; `lib/constants.ts:768, 828` (voice-agent greetings) |
| **The Factory** | `app/page.tsx:122, 345`; `app/deck/page.tsx:99`; `app/studio/invest/page.tsx:133`; `layout.tsx:23, 32` |
| **Generator(s)** | `lib/constants.ts` (`isGenerator` field on platforms); `marketplace/page.tsx:51` (visible stat: "4 Generators"); `app/page.tsx:386` (section heading) |
| **The Easily Distracted** | `lib/constants.ts:54`; `community/page.tsx:7, 18, 140`; `pricing/page.tsx:52`; `lib/elevenlabs.ts:48, 52, 95` |

The clash that hits Helen hardest is **Long Tail Venture Studio vs Long Tail AI Studio**: same parent brand, two names, sometimes on the same page. The voice agents introduce themselves as "Alex from Long Tail AI Studio" while the homepage Two Sides block says "Long Tail Venture Studio."

---

## 3. P0 fix proposals

### Fix P0-1 — Studio Partner 404

**Recommended (single best fix):** trigger a fresh production deploy, then verify the link reaches `/studio/partner` with 200 + content. The page exists in source; the bug is a stale deploy, not a code bug. Steps:

1. `git pull` on the production branch, confirm `src/app/studio/partner/page.tsx` is present.
2. Run `npm run build` locally — fail loudly on any route-build error so it's caught here, not in production.
3. Push / merge to trigger Vercel; on green, hit `https://corporate-ai-solutions.vercel.app/studio/partner` and confirm 200 + the "Co-found a Vertical With Us" hero renders.
4. Hit `/studio-partner` (hyphenated, the URL Helen wrote down) and confirm it 404s — then **add a defensive redirect** in `next.config.js`:
   ```js
   { source: '/studio-partner', destination: '/studio/partner', permanent: true }
   ```
   This costs one line and immunises the site against any future link rot where someone typo's the URL.

**Belt-and-braces — add a deploy-time link-checker** (the report explicitly recommends this on line 27). A 30-line GitHub Action that runs after every deploy:
- Fetch each `href` listed in `layout.tsx` `navItems` (the source of truth).
- Fail the deploy on any non-2xx response.
- Fail the deploy on any body length below a minimum threshold (e.g. < 500 bytes of rendered HTML inside `<main>`) — this catches P0-2 in the same gate.

Implementation file path: `.github/workflows/nav-smoke-test.yml` (new). Or use the existing `playwright.config.ts` in the repo to add an e2e smoke at `e2e/nav-smoke.spec.ts` that runs on `vercel-deploy-success`.

### Fix P0-2 — `/studio` empty body

Two options. Recommend option B.

- **Option A:** keep the redirect in `src/app/studio/page.tsx`. Replace `redirect('/studio/thesis')` with `permanentRedirect('/studio/thesis')` (Next.js 14 App-Router pattern) to ensure a 308 instead of a silent no-op. Drawback: Helen still has "Studio" and "Studio Partner" in the top nav reading as duplicates (P2-1), and clicking Studio bounces to a different URL.
- **Option B (recommended):** turn `/studio` into a **real hub page** — a one-screen overview that links out to `/studio/thesis`, `/studio/portfolio`, `/studio/partner`, `/studio/invest`, `/studio/join`. The five sub-routes already exist; what's missing is the parent page. A hub page also fixes P2-1: rename the nav from `Studio Partner` + `Studio` to a single dropdown `Studio ▾` with the five children under it (the same shape `Header.tsx` already implements but isn't currently wired into `layout.tsx`). This is the cleanest IA fix.

The dropdown shape is already coded in `src/components/layout/Header.tsx:14-30`. The fix is either to (i) swap `CorporateHeader` for `Header` in `layout.tsx`, or (ii) extend `CorporateHeader` to accept `children` nav items (currently it doesn't — see `CorporateHeader.tsx:6`). Option (ii) is preferred because every other site in the portfolio uses `@caistech/corporate-components`'s `CorporateHeader`; extending it once benefits the whole portfolio.

---

## 4. Brand confusion — proposed unification pattern

Helen's verdict was unambiguous: **pick one operating brand; treat the others as sub-products**. The cheapest, highest-impact pattern:

### One parent brand: **Corporate AI Solutions**

- URL: `corporateaisolutions.com` (already canonical in `lib/constants.ts:5`).
- All marketing surfaces, all page titles, all voice-agent introductions ("I'm Alex from Corporate AI Solutions...").
- Files to update: `lib/constants.ts:768, 828` (voice greetings), `app/about/page.tsx:68, 261, 326`, `app/launchstack/page.tsx:545, 547`. Replace "Long Tail AI Studio" / "Long Tail Venture Studio" with "Corporate AI Solutions" or "the Studio" depending on context.

### Three sub-brands under the parent

| Sub-brand | What it is | Where it lives | Visual treatment |
|---|---|---|---|
| **The Studio** (formerly "Long Tail Venture Studio" / "Long Tail AI Studio") | The venture-arm of CAIS. The portfolio model. Equity-based co-founding. | `/studio/*` (thesis, portfolio, partner, invest, join) | Orange accent (already conventional in this codebase) |
| **The Factory** | The internal build engine — `$5K / 7-day` cycle, generator architecture, shared platform-trust middleware. This is the **mechanism**, not a brand the buyer transacts with. | Mentioned in `/studio/thesis` and `/deck`. Never a top-level nav item. Never a stand-alone offering. | Treat as a metaphor inside Studio copy; do not give it a logo. |
| **The Easily Distracted** | The free Skool community. Indie-hacker / explorer audience. | `/community` + skool.com link | Purple accent (already conventional). Clearly labelled as "the community" — not as a CAIS offering. |

### Single explanatory pattern to insert site-wide

Add a 3-line "What's the relationship between these brands?" block to:
- `/about` (paragraph form);
- `/studio` (the new hub page from fix P0-2);
- footer of `app/page.tsx` (one-liner).

Suggested copy (drop-in, matches the operator-facing voice of the existing site):

> **Corporate AI Solutions** is the parent brand — the consultancy and platform business you transact with. **The Studio** is our venture arm: we co-found vertical AI companies with domain experts under equity-based partnerships (see `/studio`). **The Easily Distracted** is our free community for builders and operators who want to learn the model without buying anything (see `/community`). One operator. Three doors. Different commercial structures.

### Drop the "Generator" capitalisation as a brand

`Generator` is a product category (RaiseReady Template, Connexions, etc. produce white-label children). Stop capitalising it as if it were a brand. Lowercase "generator" in marketing copy; keep the `isGenerator: true` field in `lib/constants.ts` as-is (that's a data flag, not a brand). Specific file edits:
- `app/marketplace/page.tsx:51, 52` — keep the stat card label "Generators" (it's a count, not a brand).
- `app/page.tsx:386` — change section heading from "Generator Output Examples" to "Examples from our generator platforms" (descriptive, not branded).

### Voice-AI terminology lock-down (P2-4)

Pick one of: "Voice AI" (capitalised, treated as a category) **OR** "voice agents" (lower-case, treated as a capability). Recommend **"voice agents"** as the capability term (matches industry shift post-ElevenLabs / Vapi) and reserve **"Voice Coaching Suite"** as the only proper-noun category. Files: tag-rendering logic in `lib/constants.ts` Platform type, `app/page.tsx:361`, `app/marketplace/page.tsx:59`.

---

## 5. P1 fix proposals (sequenced after P0)

### P1-2 — Split buyer pitch from investor pitch

`app/page.tsx` "Two Sides of the Same Coin" block at line 437-479 is the single source of audience-collision. Recommended action:

- **Buyer hero** (the homepage as Helen sees it): keep the "factory that builds AI companies / 45 platforms / one founder" line. Strip out `$200M+ ARR`, `$5K build cost, 7-day cycle`, `Portfolio targets $200M+ ARR` from the homepage entirely (lines 470-473).
- **Investor surface**: move those numbers to `/studio/invest` (route already exists). Move "Two Sides of the Same Coin" off the homepage and onto `/studio/thesis` where it actually fits.
- Replace the homepage Two Sides block with a 3-card "Three doors" block:
  1. **Use a platform** → /marketplace
  2. **Hire on retainer / Custom Build** → /pricing
  3. **Co-found a vertical** → /studio/partner
  This is also the cleanest fix for Helen's "two on-ramps" comment (P2-8): buyers go to /pricing; builders go to /community; nobody is funneled through the wrong door.

### P1-3 — Add a Compliance Posture page

Single new page at `/trust` (or `/compliance` — `/trust` is shorter and aligns with the Platform Trust product). Must answer four questions on one page:

1. **Where data sits.** AU region (Supabase Sydney, Vercel Sydney edge). Per-product matrix (see P2 below).
2. **Who owns the IP.** Default contract clause for paying customers. Plain-English version + downloadable PDF.
3. **Privacy Act / OWASP / SOC 2 posture.** What is in place today, what is on the roadmap. No vapourware claims — be specific. Reference Platform Trust as the internal compliance product (closing the loop with the marketplace).
4. **Incident response.** Email + phone for security incidents. SLA on first-response.

Link from: header nav (after `About`), pricing page, every product card in marketplace (the "data residency by product" matrix that Helen explicitly asked for — P2 in the report opportunities list).

### P1-4 — Surface named customers above the fold

Add a 1-row "Working with" strip on the homepage hero, immediately under the "45 platforms" subhead. Three logos + role labels:
- MMC Build (commercial contract, Chief Technology Advisor)
- LingoPure (Chief Technology Advisor)
- PreLabz (Chief Technology Advisor)

These three names are already in `app/about/page.tsx` under "Current Engagements." Just lift them up. No new content writing required.

---

## 6. P2 fix proposals (queue for the same sprint)

| # | Fix | File |
|---|---|---|
| P2-1 | Replace top-nav "Studio Partner" + "Studio" with single dropdown "Studio ▾" containing Thesis / Portfolio / Partner / Invest / Join | `src/app/layout.tsx:11-19`, extend `CorporateHeader.tsx` to support children |
| P2-2 | Build `/portfolio-live` page that auto-pulls each product's `/api/status` endpoint and renders a live grid (uptime / last deploy / has-paying-users / last-paid-invoice). Make every "45 platforms" mention clickable to this page. **This is the single highest-leverage trust signal Helen requested.** | New: `src/app/portfolio-live/page.tsx`, `src/app/api/portfolio-status/route.ts` |
| P2-3 | Add status pill to each marketplace card: `Live · Paying users` / `Live · No paying users yet` / `Beta` / `Waitlist`. Add `status` field to `Platform` type in `src/types/index.ts`. | `src/lib/constants.ts` (data), `src/app/marketplace/page.tsx` (render) |
| P2-4 | Lock terminology: "voice agents" (capability), "Voice Coaching Suite" (category). Strike "Voice AI" elsewhere. | site-wide string replacement |
| P2-5 | Move `$80k+` price band from FAQ onto the Custom Build tier card itself | `src/app/pricing/page.tsx` |
| P2-6 | Add a fourth pricing tier signal: "Enterprise / mid-market engagement — by negotiation, structured as fixed-stage SOW." Lifts mid-market buyers like Helen out of the "this is for startups" filter without softening the operating model. | `src/app/pricing/page.tsx` |
| P2-7 | Promote the "35 years construction, came from outside tech" differentiator onto the homepage hero, not just About | `src/app/page.tsx:144-148` is the source paragraph; mirror onto homepage |
| P2-8 | Replace homepage "Not Sure Where to Start? Join our community" CTA stack with three intent-based doors (use / hire / co-found) — see P1-2 | `src/app/page.tsx:481-498` |
| P2-9 | Relabel voice-agent CTA from "Open voice assistant" to "Talk to Dennis's AI assistant — pricing, scope, timeline" | `src/components/voice/VoiceAgent.tsx` (label) |
| P2-10 | Verify marketplace 35-tile grid at 375px (iPhone SE) and 1440px. Add `e2e/marketplace-responsive.spec.ts` Playwright test that loads at 375px and asserts no horizontal scroll. | `e2e/` |

### Additional opportunities Helen called out

- **Pre-call discovery questionnaire** (report line 61): 90-second form embedded on `/contact` before the Calendly handoff. Three questions: problem, timeline, company stage. Save to Supabase, send to founder before each call.
- **Sample SOW PDF** for Custom Build tier (report line 45): publish a redacted-but-real SOW from a recent engagement. Three-week discovery → 6-12 week build → fixed-price stages → IP-ownership boilerplate. Gates: name + work email.
- **Named references with permission** (report line 52): the "References on request" subsection on About. Names the three current engagements with role + LinkedIn URL.

### What to keep (positive signals — do not touch)

- The **"What I won't do"** block on `/pricing` (line 145 onwards in `src/app/pricing/page.tsx`). Helen called this "the standout piece of writing on the entire site." Reading it cut her vendor-skepticism in half. Do not soften it.
- The **5-step Our Story timeline** on the homepage. Helen called it "unusual for a B2B site and I like it. Reads like the founder actually wrote it."
- **Direct founder email + phone + Calendly in the footer.** "A real, accountable, one-throat-to-choke operator." Keep visible.
- The **`/about` page's `View Resume` + `My Repos` buttons.** "Most B2B founder pages would never link to GitHub. The fact that you do tells me you're confident your work stands up to scrutiny."
- The **`/pricing` tier transparency** ($15k/month with 3-month minimum). "Honest pricing for the AU market."

---

## 7. Sprint sequencing

The single 4-hour block that maximally moves Helen from "I'll think about it" to "I'm booking the call this week":

1. **(15 min) Trigger fresh deploy.** Verify `/studio/partner` returns 200 + content. Verify `/studio` either redirects cleanly or is a real hub page. (P0-1 + P0-2)
2. **(45 min) Add nav-smoke GitHub Action.** Fails the deploy if any `layout.tsx` nav href returns non-2xx or renders an empty body. Catches this entire class of bug forever. (P0)
3. **(30 min) Add `/studio-partner` → `/studio/partner` defensive redirect.** One line in `next.config.js`. (P0-1)
4. **(60 min) Restructure homepage CTA stack** into Three Doors (use / hire / co-found). Strip investor numbers off the homepage. (P1-2 + P2-8)
5. **(60 min) Replace top-nav duplicate items** with `Studio ▾` dropdown. Extend `CorporateHeader` to support children. (P2-1)
6. **(30 min) Add "Working with" logo strip** under the homepage hero with MMC Build / LingoPure / PreLabz. (P1-4)

That ships in one session. Helen revisits in a week, finds the 404 fixed and four other things noticeably better, sends the email.

Follow-on (next sprint):
- **`/trust` page** (P1-3) — single highest procurement unblocker.
- **`/portfolio-live` page** (P2-2) — single highest trust signal on the "45 platforms" claim.
- **Brand unification pass** (Section 4) — site-wide text edits over an afternoon.
- **Pre-call discovery form** + **Sample SOW PDF** (Section 6).

---

## 8. Files inspected for this plan

- `src/app/layout.tsx` — active nav source.
- `src/app/studio/page.tsx` — 6-line redirect file (P0-2 source).
- `src/app/studio/partner/page.tsx` — full route (exists; deploy was stale).
- `src/app/page.tsx` — homepage, Two Sides block, Three Paths block.
- `src/app/about/page.tsx` — brand-mention audit.
- `src/app/community/page.tsx` — "The Easily Distracted" surface.
- `src/app/marketplace/page.tsx` — count math, status pills.
- `src/app/pricing/page.tsx` — "What I won't do" block (keep).
- `src/app/not-found.tsx` — confirms Helen's 404 body text came from this file.
- `src/app/studio/thesis/page.tsx` — destination of `/studio` redirect.
- `src/components/layout/Header.tsx` — legacy header (not wired in), has dropdown shape we want.
- `src/components/corporate/CorporateHeader.tsx` — active header, needs children support.
- `src/lib/constants.ts` — SITE / FOUNDER / SKOOL / PLATFORMS; voice greetings reference Long Tail AI Studio.
- `src/lib/elevenlabs.ts` — voice-agent system prompts (brand strings).
- `next.config.js` — redirect rules; missing `/studio-partner` defensive redirect.
- `vercel.json` — deploy config (no nav-smoke gate present).

---

## 9. What this plan deliberately does NOT recommend

- **Do not** rewrite the "Our Story" 5-step timeline. Helen liked it.
- **Do not** soften the solo-founder filter on pricing. Helen called it "the right trade-off for your stage and you should not soften it."
- **Do not** introduce a fourth or fifth brand to "solve" the brand confusion. The fix is fewer brands, not more.
- **Do not** remove the voice-agent widget. Helen did not engage with it, but the issue was the CTA label, not the agent's existence.
- **Do not** push for an SEO / blog content strategy as part of this remediation. Helen is one persona; SEO is a different motion. Out of scope for this plan.
