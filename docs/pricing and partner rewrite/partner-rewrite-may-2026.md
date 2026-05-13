# Partner Page Rewrite — May 2026

**Target file:** `app/partner/page.tsx` (or equivalent) on the `corporate-ai-solutions` repo
**Companion change:** see `docs/pricing-rewrite-may-2026.md` (must ship together)
**Owner:** Dennis McMahon

---

## Purpose of this rewrite

The current `/partner` page sells the rev-share model as a transactional alternative to subscription tiers — *"bring a problem, we build it free, you give us 10-30% equity."* That framing is wrong for where Corporate AI Solutions is now:

- It's listed as a pricing option, which makes it sound like a cheap way to get development done
- It invites bad-fit inbound (people with ideas but no domain depth, no GTM capacity, no skin in the game)
- It contradicts the new `/pricing` page, which explicitly says "no free rev-share builds as a hired service"
- It doesn't tie to the Studio thesis, where this partnership model actually belongs

This rewrite **repositions rev-share from a pricing tier into a Studio co-founder partnership**. The audience shifts from "people who want development done cheap" to "domain experts who want to co-found a vertical."

---

## What stays vs. what changes

**Keep:**
- The page URL `/partner`
- The general visual language of the existing site
- The connection to `/studio/thesis` (which sells the broader long-tail model)
- The basic structure of "this is who we want / this is who we don't want"

**Change:**
- Whole framing: from "hire us cheap via equity" to "co-found a vertical with us"
- Tone: from sales-y to selective
- CTA: from "Let's Talk" (transactional) to "Apply for a Studio Partnership" (more deliberate)
- Cross-links: must now point to `/pricing` for cash-paying alternatives

---

## New page content

The page below is the source of truth. Render with existing site styles. Match visual language of `/studio/thesis` (the studio brand) more than `/pricing` (the services brand).

### Page title

```
Studio Partnerships
```

### Hero block

```
# Co-found a Vertical With Us

You've spent 20+ years watching the same problem cost your industry millions. You know the workaround everyone uses. You know exactly what the fix would look like. You just never had anyone who could build it.

The Studio model exists for you.
```

### "How the Partnership Works" section

```
## How the Partnership Works

You bring deep industry expertise — 15+ years on the ground in construction, logistics, healthcare, finance, manufacturing, legal, or any sector where the workflows are real and the gaps are obvious. We bring the build capability — solo end-to-end delivery, the Corporate AI Solutions stack, 35+ live AI platforms as portfolio evidence.

Together we ship a vertical platform in your industry. You operate the front of the business — relationships, sales, domain expertise, market positioning. We operate the back — architecture, AI stack, build, deployment, infrastructure.

You take a meaningful equity stake in the resulting venture, typically 10–30% depending on involvement and contribution.

This is not a hired-development model. It's a co-founder model. The platform carries your name, your relationships, and your judgment about what the industry actually needs.
```

### "What 'Studio Partnership' Means in Practice" — four-card block

Four cards in a 2×2 grid on desktop, stacked on mobile. Each card has an engagement-color accent and the same icon style as the `/pricing` tier cards.

**Card 1 — Equity-based, not fee-based**
- Color accent: green `#0B7A5C`
- Icon: 🟢
- Body: `Build cost is absorbed by the Studio in exchange for revenue share or equity. You contribute domain expertise, network access, and operational involvement — not cash up front.`

**Card 2 — Selective**
- Color accent: blue `#1E5AA8`
- Icon: 🔵
- Body: `We take on a small number of partnerships per quarter. Each one needs a clear domain insight, an operator who can sell into the market, and alignment on long-term direction. We say no often.`

**Card 3 — Real ownership**
- Color accent: orange `#FF6B35`
- Icon: 🟠
- Body: `You're a co-founder. Your name is on the product. Your relationships drive the GTM. Decisions are joint where they should be.`

**Card 4 — Backed by the Studio portfolio**
- Color accent: dark navy `#0B1F3A`
- Icon: ⚫
- Body: `Platform Trust middleware, generator architecture, shared AI infrastructure — your venture inherits all of it from day one. Compliance, observability, billing, RBAC: not built from scratch.`

### "Who This Is Not For" section

This section sits below the four cards. Visually muted, similar treatment to the "What I won't do" section on `/pricing` — slightly subdued background or a dark band.

```
## Who This Is Not For

- People with an idea but no domain depth
- People looking for hired development at a discount
- People who can't operate the front of the business
- People expecting a passive equity windfall

If "I have a great idea but no budget" is the pitch — this isn't the right path. The [pricing page](/pricing) covers retainer advisory and fixed-price custom builds for people who want to pay cash for our time. Studio partnerships are reserved for domain experts who can take a venture to market with us.
```

### "Current Studio Activity" section

```
## Current Studio Activity

35+ AI platforms live in production today, across voice AI, agentic systems, multi-tenant SaaS, blockchain tokenisation, and MCP integrations. Reference verticals include:

- **TourLingo, GovLingo, HotelLingo, DoctorLingo, EduLingo** — vertical instances of the UniversalLingo translation generator
- **MMC Build** — multi-tenant AI platform for Australian modular construction *(commercial contract, not equity partnership — provided here as a build-capability reference)*
- **Connexions, RaiseReady, Kira** — voice-discovery infrastructure
- **F2K Fund Tokenisation** — ERC-3643 wholesale housing fund on Ethereum

Full portfolio: [corporate-ai-solutions.vercel.app/marketplace](https://corporate-ai-solutions.vercel.app/marketplace)
```

### "Apply" CTA section

```
## Apply

If you've ever said *"someone should really fix that"* — that someone is you. Tell us about the gap you've been watching.

[**Apply for a Studio Partnership →**](https://www.calendly.com/mcmdennis)

30-minute discovery call. We'll know within the first 10 minutes whether the fit is there. No pitch deck required.
```

### Studio FAQ section

```
## Studio FAQ

### How much equity do partners get?
Typically 10–30%, depending on contribution depth. Pure domain expertise + warm GTM network sits at the lower end; significant operational time investment sits at the higher end. Specific splits are agreed during the discovery process.

### What if the platform doesn't gain traction?
Both sides take that risk. The build cost is the Studio's contribution; your time and network is yours. If the venture doesn't work, neither side owes the other anything. We've structured the model so we both have skin in the game.

### How long does a Studio build take?
Most platforms go from concept to live in 7–14 days. Refinement and GTM take longer. The factory model means we ship fast and iterate against real usage.

### Can I have multiple Studio partnerships at once?
You as a partner can only meaningfully operate one or two ventures well. We're selective on the operator side specifically because the Studio scales — but operator capacity doesn't.

### Why the "Studio" name?
Because that's what it is. A venture studio that manufactures AI companies at near-zero marginal cost — see [Our Thesis](/studio/thesis) for the full model. Partnerships are how new ventures enter the studio.

### How is this different from the Custom Build offer on /pricing?
Custom Build is **fixed-price commercial work** — you pay cash, you own the IP outright, no equity changes hands. Studio Partnership is **equity-based co-founding** — no cash exchanged for build, you and Dennis co-own the venture going forward. Different commercial structure, different governance, different time commitment.

### Can I bring my own existing team?
Yes — domain experts often have networks of advisors, salespeople, or operators they want to bring along. We discuss this during scoping.
```

### Footer cross-link block

```
## Other ways to engage

[**Use platforms →**](/marketplace) · Subscribe to existing AI platforms
[**Hire on retainer →**](/pricing) · Technical advisory or custom builds
[**Read the thesis →**](/studio/thesis) · Understand the long-tail model
```

---

## Implementation constraints

1. **Use existing site styles.** Tailwind only. Match `/studio/thesis` visual brand.
2. **Card grid.** Four cards in 2×2 on desktop, stacked on mobile.
3. **"Who This Is Not For" section.** Visually subdued — same treatment as "What I won't do" on `/pricing`. Reads as deliberate filtering, not afterthought.
4. **Cross-links must work.** Internal references to `/pricing`, `/studio/thesis`, `/marketplace` all need to resolve. The `/pricing` rewrite ships in the same task.
5. **All CTAs route to Calendly.** No other CTA destinations introduced.
6. **Meta tags:**
   - `og:description` → `Studio partnerships for domain experts ready to co-found a vertical. Selective. Equity-based. 35+ live AI platforms as portfolio evidence.`
   - `twitter:description` → same
   - `meta description` → same
7. **Platform count = 35.** Sweep the file for "17," "38," "17 platforms" — replace with 35 where appropriate.

---

## Additional cross-page changes (do these in the same task)

### `/studio/thesis` page minimal updates

Search the existing `/studio/thesis` page for the following and update:

- `38 platforms` → `35 platforms` (appears in hero, body, year-1 milestone)
- `50 platforms (38 built)` in Year 1 → `50 platforms (35 built)`
- Meta tag `og:description` currently includes "38 AI platforms" → update to "35 AI platforms"
- Meta tag `twitter:description` same update
- Meta tag `description` same update

No other content changes to `/studio/thesis`. The thesis itself doesn't need rewriting.

### Site-wide sweep

Before committing, do a final grep across the codebase for any user-facing copy still referencing:
- `38 platforms`
- `17 platforms`
- "$49/mo" or "$199/mo" subscription tiers
- "rev share" or "revenue share" framed as a hired-service offer

Replace as appropriate.

---

## Definition of done

- [ ] `/partner` page rewritten with Studio co-founder framing
- [ ] All rev-share-as-hired-service language removed
- [ ] Cross-links to `/pricing` and `/studio/thesis` working
- [ ] `/studio/thesis` updated — 35 platforms everywhere
- [ ] Meta tags updated on `/partner` and `/studio/thesis`
- [ ] Mobile rendering verified at 375px
- [ ] All CTAs route to Calendly correctly
- [ ] Site-wide grep for "38 platforms", "17 platforms", "$49/mo", "$199/mo" returns no user-facing hits
- [ ] Vercel deploy successful

---

## Commit message (combined task)

```
pricing+partner+thesis: reposition advisory at $15k/mo retainer, rev-share as studio co-founder model, 35 platforms everywhere
```
