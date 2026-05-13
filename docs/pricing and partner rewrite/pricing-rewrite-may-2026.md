# Pricing Page Rewrite — May 2026

**Target file:** `app/pricing/page.tsx` (or equivalent) on the `corporate-ai-solutions` repo
**Companion change:** see `docs/partner-rewrite-may-2026.md` (must ship together)
**Owner:** Dennis McMahon

---

## Purpose of this rewrite

The current `/pricing` page is misaligned with where Corporate AI Solutions actually is commercially:

- Anchors at $49/$199 platform subscriptions that have **zero revenue** behind them
- Includes a "Partner Rev Share" tier that gives away custom development for equity — currently the most leaky part of the pricing
- References inconsistent platform counts (38 / 17 / "all 17") across the same page
- Offers no path for prospects who want to **hire Dennis** directly for advisory or commercial custom builds (the work that actually pays now)

New positioning: three engagement options with clear commercial structure.

1. **Free Community** — soft entry, no commitment
2. **Technical Advisory** — $15,000/month retainer minimum (the anchor)
3. **Custom Build** — by negotiation, MMC Build as the reference engagement

The rev-share / co-founder partnership offer moves **out of pricing** and **into the Studio** (see partner rewrite doc).

---

## What to remove from the existing page

Delete entirely:

- All "Starter $49/mo" tier copy
- All "Pro $199/mo" tier copy
- All "Builder add-on" and "Starter add-on" copy
- All "Scale plan" references
- The entire "Need More Platforms?" section
- The "Partner Rev Share" tier (this offer moves to /partner — do not duplicate here)
- Any FAQ entries that reference the above (switching platforms, free trials of subscription tiers, etc.)
- All references to "17 platforms," "38 platforms," "all 17 platforms" — replace with "35 platforms" only where appropriate to the new copy

Also update meta tags:
- `og:description` → `Technical advisory from $15k/mo. Custom AI platform builds by negotiation. 35+ live AI platforms as portfolio evidence.`
- `twitter:description` → same as above
- `meta description` → same as above

---

## New page content

The page below is the source of truth. Render with existing site styles (Tailwind, existing tier-card components if any). Match visual language of `/marketplace` and `/about` pages.

### Page title

```
Pricing
```

### Hero block

```
# Three ways to work with Corporate AI Solutions

Use the platforms self-serve, retain me as your technical advisor, or commission a custom build. Choose the engagement that matches the stage you're at.
```

### Three tier cards (in this order, side-by-side on desktop, stacked on mobile)

**Card 1 — Free Community**

- Accent color: green `#0B7A5C`
- Icon: 🟢 (or equivalent green dot)
- Title: `Free — Community`
- Price line: `Free`
- One-line description: `Join The Easily Distracted. Share problems, find collaborators, watch builds in public.`
- Bullet list:
  - Skool community access
  - Share ideas and problems
  - Find potential collaborators
  - Learn in public from 35+ live AI builds
  - No commitment, no upsell
- CTA: `Join Free →`
- CTA destination: `https://www.skool.com/the-easily-distracted-5598`

**Card 2 — Technical Advisory**

- Accent color: blue `#1E5AA8`
- Icon: 🔵 (or equivalent blue dot)
- Title: `Technical Advisory`
- Price line: `From $15,000 / month`
- One-line description: `A monthly retainer for ongoing technical leadership. Architecture, AI stack decisions, code review, build acceleration, and the technical conversations your team needs to have but hasn't yet.`
- Best-fit line (smaller text, italic): `Best fit: AI-native startups pre-Series A, founders evaluating technical decisions before raising, teams scaling beyond their first engineer.`
- Bullet list:
  - 1:1 sessions on your stack, your code, your architecture
  - AI stack selection — model choice, vendor risk, fallback strategy, agent vs platform decisions
  - Architecture review against investor due-diligence standards
  - Direct access to my own production playbook from 35+ live AI platforms
  - Compliance-by-design baked in (Australian Privacy Act, OWASP, SOC 2 — via Platform Trust)
  - Available remote in AU/SE Asia time zones
- Credibility line (small, muted text below bullets): `Currently: Chief Technology Advisor at LingoPure (AI voice tutoring) and PreLabz (venture studio, pre-seed → Series A).`
- CTA: `Book a Discovery Call →`
- CTA destination: `https://www.calendly.com/mcmdennis`

**Card 3 — Custom Platform Build**

- Accent color: orange `#FF6B35`
- Icon: 🟠 (or equivalent orange dot)
- Title: `Custom Platform Build`
- Price line: `By Negotiation`
- One-line description: `End-to-end ownership of a new AI-native platform — schema through to deployment. Fixed-price commercial contracts, scoped to your problem, delivered solo on the Corporate AI Solutions stack.`
- Best-fit line: `Best fit: companies who need a real production AI platform shipped fast, not a prototype or a pitch-deck demo.`
- Bullet list:
  - Solo-delivered, end-to-end build
  - Stack: Next.js, Supabase, Vercel, Anthropic Claude, OpenAI, ElevenLabs, MCP, Stripe
  - Multi-tenant SaaS, agentic workflows, voice AI, RAG, compliance infrastructure, billing — whatever the platform needs
  - Platform Trust middleware included for SOC 2 / OWASP / Australian Privacy Act posture
  - 35+ delivered platforms as portfolio evidence
- Credibility line: `Reference engagement: MMC Build platform — multi-tenant AI for Australian modular construction. Multi-model AI architecture, agentic compliance + cost-estimation workflows, Stripe billing. Stages 0–5 delivered in 5 weeks against an original 14-week schedule.`
- Footer line (smaller, italic): `Pricing is by negotiation, scoped to your specific problem. Discovery call first to understand the gap before any quote.`
- CTA: `Book a Discovery Call →`
- CTA destination: `https://www.calendly.com/mcmdennis`

### "What I won't do" section

This section sits below the three tier cards. Visually distinct — slightly muted background, or a dark band, to read as deliberate counter-positioning rather than feature copy.

```
## What I won't do

Just as important as what I will:

- **No free rev-share builds as a hired service.** I used to offer custom development in exchange for equity. As a *hired service*, that's closed. If you have deep industry expertise and want to co-build a vertical with me as a domain co-founder, that's a separate partnership track under the Studio — different fit, different terms, [selective](/partner).
- **No "AI agency" framing.** I work solo, end-to-end. No PMs, no offshore dev pool, no account managers. If you want a 12-person team and a Gantt chart, I'm not the fit.
- **No retainer-creep.** Advisory retainers are for ongoing strategic input, not for me to disappear into your codebase as a hidden FTE. If a project needs build work, we scope it as a Custom Build separately.
```

### FAQ section

```
## FAQ

### How is the advisory retainer structured?
$15k/month minimum, three-month initial commitment, monthly thereafter. Includes a defined number of strategic sessions per month plus async availability for architecture and AI stack questions. Specific cadence is set during the discovery call based on your stage.

### Can I do advisory plus custom build at the same time?
Yes — they're separate engagements with separate scopes. The advisory retainer covers technical guidance for your team; a custom build is me delivering a specific platform end-to-end. Some clients run both in parallel.

### What's the minimum custom build size?
Most engagements start around AUD $80k+ fixed price. Smaller scope work (one specific feature, one specific integration) is usually better served as advisory hours than as a custom build.

### Do you sub-contract or hire other developers?
No. Solo end-to-end is the operating model, and it's why builds ship fast. You get the same person from schema design through to deployment.

### What about the 35+ platforms — can I subscribe to them?
Yes — pricing for each platform sits on the individual product page. Some are free, some are paid, all are live. Browse the marketplace to find what's relevant.

### Do you take equity instead of cash?
Equity-only work as a hired service is closed. Open to discussing equity *alongside* a cash retainer for advisory engagements where there's strong long-term alignment. Pure equity partnerships (no cash, you bring domain expertise) live under the [Studio](/partner) — different track.

### What time zones do you work in?
Remote-only, AU/SE Asia working hours (AEST, ICT, SGT, MYT). Based in Fortitude Valley, QLD, Australia.

### How fast can you start?
Advisory retainers can usually start within 1–2 weeks of the discovery call. Custom builds depend on current commitments and scope — discussed during discovery.
```

### Footer CTA block

```
## Still have questions?

[**Book a Discovery Call →**](https://www.calendly.com/mcmdennis) · 30 minutes, no pressure
[**Join the Community Free →**](https://www.skool.com/the-easily-distracted-5598)
```

---

## Implementation constraints

1. **Use existing site styles.** Tailwind classes only. No new color tokens. Match visual language of `/marketplace` and `/about` pages.
2. **Tier cards.** Three cards in a row on desktop (`md:grid-cols-3`), stacked on mobile. Equal heights. Each card has the colored accent border or top bar matching the engagement color.
3. **"What I won't do" section.** Visually distinct — slightly subdued (muted background or dark band) to read as deliberate counter-positioning. Not just another bulleted list.
4. **All CTAs route to Calendly or Skool.** No other CTA destinations introduced.
5. **Cross-links.** "What I won't do" and FAQ both reference `/partner` (the studio partnership page) — make sure those links work. The partner page is being rewritten in the same task (see `partner-rewrite-may-2026.md`).
6. **Meta tags updated.** See top of this doc for new descriptions.
7. **Platform count = 35.** Sweep the file for "17," "38," "17 platforms" — replace as appropriate. The headline number is 35.

---

## Definition of done

- [ ] `/pricing` page rendered with new three-tier structure
- [ ] All references to $49 Starter, $199 Pro, add-ons, Scale plan removed
- [ ] Rev-share tier removed from `/pricing` entirely
- [ ] All platform-count inconsistencies resolved (35 only)
- [ ] Meta tags updated
- [ ] Mobile rendering verified at 375px
- [ ] All internal cross-links to `/partner` work after partner-rewrite ships
- [ ] All CTAs route to correct Calendly / Skool URLs
- [ ] Vercel deploy successful

---

## Commit message

```
pricing: reposition to advisory retainer + custom build, remove subscription tiers and rev-share, 35 platforms everywhere
```
