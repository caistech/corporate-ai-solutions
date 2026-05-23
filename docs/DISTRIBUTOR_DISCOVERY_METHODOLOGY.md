# Distributor Discovery Methodology

**Status:** v1.0 drafted 2026-05-23.
**Scope:** the structured process CAS runs *before* committing to build a new product. Outputs either a distributor-validated build spec or a "do not build yet" parking note. Sector-first.
**Anchored to:** `MONETISATION_RULES.md` Rule 15 (DISTRIBUTOR-FIRST PRODUCT GATE). Rule 15's product gate fires this methodology; this methodology produces the answer the gate evaluates.

---

## Why this exists

CAS has historically built products end-user-first: identify a real person's pain (Karen needs to track R&D-eligible work; an actor needs someone to run lines with; a parent wants personalised kids' books) and build a tool. The distributor — the operator with an existing book of those end-users who could onsell the product as part of their existing offering — gets identified *after* the build, sometimes months later. The retrofit is expensive: marketing copy aimed at the wrong audience, product features tuned for solo end-users rather than consultancy-of-many, repositioning workstreams that should have been build workstreams.

The fix is **not** another tool that does the discovery. The fix is the methodology itself, run upfront, captured in a doc, repeatable. If it ever gets productised, that's a downstream Rule 15 candidate of its own — but the methodology proves itself manually first.

## Two failure modes this prevents

1. **End-user-first reactivity** — building because one person's pain felt real, without checking whether anyone with distribution can monetise it. R&D Tax Tracker is the canonical case.
2. **Hand-wavy distributor identification** — naming "SMEs" or "founders" as the distributor when those are end-user archetypes, not distributors with an existing book. The methodology forces specificity.

---

## The pipeline — three phases

**Phase Zero — Portfolio Backfill (run once, before any forward-build work).** Walk every existing portfolio product through the methodology *in reverse* to identify the sector/distributor it would best fit, then decide whether to redesign to that template, keep as personal-interest override, or kill. The 28 existing in-migration products are sunk cost; extracting distributor-aligned value from them is cheaper than building new.

**Phase One — Forward New Products (Stage 0 scan → Stage 1 deep dive).** Runs only AFTER Phase Zero is complete (or for one-off new-product evaluations that arrive mid-stream). Stage 0 surfaces ranked candidate sectors via cross-industry scan; Stage 1 deep-dives each picked candidate through five steps + validation loop + synthesis gate.

**Phase Two — Ongoing portfolio governance (quarterly).** Re-runs backfill cycle on any product whose distributor-fit has drifted (distributor exited, sector shifted, competitor entered). Re-runs Stage 0 scan against accumulated capability seeds from `@caistech/*` packages that didn't trigger a build initially.

Cost discipline:
- Phase Zero per product: **15–45 minutes** if the product is well-known to the operator. Backfill across 28 products: **1–2 sessions of focused work.**
- Phase One Stage 0: **30–60 minutes** (agent-run) per product hypothesis.
- Phase One Stage 1: **2–4 hours per candidate sector**.

The cost is deliberately small at every phase so the gate fires often.

---

## Phase Zero — Portfolio Backfill

**Purpose:** for every product already in the portfolio, determine whether it has a viable distributor-aligned redesign path, or whether it should be parked as personal-interest-override, or killed.

**Why this is the first phase:** building forward without backfilling first means continuing to add to a portfolio whose existing entries are still mis-aligned with Rule 15. Each existing in-migration product represents capability and engineering work already done — that capability is the cheapest distributor-aligned product CAS can ship IF a distributor can be retrofitted to it.

**Per-product backfill process — Socratic dialogue THEN parallel validation, not form-filling, not Dennis-as-oracle.**

The whole point of the methodology is that the answers *emerge* through the discovery process. If the operator could fill in a card upfront, they wouldn't need the system. The operator's role in the dialogue is *not* to be the source of answers about end-users, distributors, or competitive landscape — the operator typically doesn't know those answers definitively (they're hypothesised at best). The operator's role is to surface their **intent + mental model + candidates worth testing**. Real answers come from going OUT to target users + distributors via InvestorPilot validation campaigns, running in parallel.

Phase Zero per product therefore produces TWO artifacts, in order:

1. **Hypothesis Card** (output of dialogue) — Dennis's intent + candidate target users + candidate distributors + problem hypotheses, all explicitly tagged *to-be-validated*. Takes 10–30 minutes of dialogue.
2. **Validated Backfill Card** (output of validation) — Hypothesis Card with each row updated from real first-party signal returned by InvestorPilot campaigns to both target users and distributor candidates. Validation runs in parallel for all 28 products; data lands over days; cards populate as data returns.

Only the Validated Backfill Card reaches the synthesis gate. The Hypothesis Card alone is not enough to decide REDESIGN-TO-FIT / OVERRIDE / KILL.

**This means Phase Zero has two sub-phases:**

- **Phase Zero-A — Dialogue sprint.** Walk all 28 products through the Socratic dialogue in a few focused sessions. Output: 28 Hypothesis Cards. Validation campaigns queued.
- **Phase Zero-B — Validation wave.** Run all 28 InvestorPilot campaigns (target-user + distributor-candidate per product) in parallel. As data lands per product, Hypothesis Card becomes Validated Backfill Card; product enters synthesis. Decisions cascade in over 2–6 weeks.

**The dialogue shape — opening questions per step:**

- **Step 1 origin question** — *"What was this product originally built for? Walk me through the moment you decided to build it. What were you trying to solve, and for whom?"*
- **Step 2 problem deepening** — *"What happened to that end-user when they didn't have this tool? What were they doing instead — what were they paying, suffering, working around?"*
- **Step 3 persona sharpening** — *"Is that end-user typically alone, or part of a team / cohort / book of clients managed by someone else? Who else is in their world?"*
- **Step 4 competition mapping** — *"What were they trying before they hit your product? Why did those alternatives fail them? What's still missing in what's available today?"*
- **Step 5 distributor discovery** — *"Who owns the relationship with that end-user today? Who sends them invoices, who they call when something goes wrong, who's their go-to advisor for this kind of problem? Could that someone be a channel for this product as an upsell to their existing offering?"*

**Refining question patterns** (used as the conversation unfolds):

- *"Could this product be part of [candidate distributor]'s existing offering, or would it compete with what they already sell?"*
- *"Do you know any [candidate distributor archetype] personally or through warm contacts?"*
- *"What would [candidate distributor] need from this product that we don't have, before they'd add it to their offering?"*
- *"Is the end-user we've been talking about actually the buyer, or just the user? Who signs the cheque?"*
- *"If [candidate distributor] saw this product tomorrow, what's their first instinct — 'I could sell this' or 'don't need this'?"*

**Decision questions toward the end of the dialogue:**

- *"Of the candidates we've surfaced, which feels most realistic to you?"*
- *"Is there a personal-interest reason to keep building this even if no distributor exists?"*
- *"What would have to be true for you to commit a session to redesigning this product?"*

**The agent's job during the dialogue:**

- Ask the open question, then *listen*.
- Reflect back what the operator said in tighter language to confirm shared understanding (*"so the end-user is X, who currently does Y manually — is that right?"*).
- Surface candidate distributors / persona variants / sector framings the operator hasn't yet named, as hypotheses to test (*"could this fit accountancy practices as a distributor? — drama agencies? — vertical SaaS resellers?"*).
- Note tensions and contradictions the operator surfaces, so they get resolved rather than papered over (*"earlier you said the end-user was X, but the distributor we just landed on serves Y — which is the real customer?"*).
- Capture the Backfill Card *only* when the operator confirms the synthesis fits.

**Validation hook (Step 5.5 — applies during dialogue):** for the top distributor candidate that emerges, the dialogue closes with a plan to use InvestorPilot to outreach to 20–50 named operators in that archetype and validate the wedge. The validation may happen between this dialogue and committing to redesign — the dialogue identifies the hypothesis; the validation tests it.

**Synthesis — three outcomes:**
   - **REDESIGN-TO-FIT** — distributor identified + reachable + wedge confirmed. Redesign the product (positioning, pricing model, possibly admin layer) to fit the distributor channel. Output: redesign brief naming the changes required and the expected investment.
   - **PERSONAL-INTEREST OVERRIDE** — no distributor identified, but the product has personal/strategic value Dennis wants to preserve. Captured in manifest; Model B (plan-with-cap) pricing applies; not load-bearing for the monetisation thesis.
   - **KILL / ARCHIVE** — no distributor + no personal interest. Product is parked indefinitely; constants.ts entry tagged `kill-pending`; eventual removal from marketplace + repo archival.

**Per-product output:** a **Backfill Card** — one paragraph per product naming the sector, the candidate distributor, the wedge, the validation status, and the decision (redesign / override / kill).

**Phase-Zero output overall:** a remapped portfolio where every entry has either a redesign path with a named distributor, a personal-interest-override flag, or a kill tag. This output replaces the heuristic BYOK conversion sweep snapshot in `project_byok_approved_for_conversion.md`.

**Pass criterion for Phase Zero:** every product in `PLATFORMS` array has one of the three outcomes assigned. No silent in-migration entries left.

---

## Phase One — Forward New Products

Runs only after Phase Zero is complete, or when an explicit new-product opportunity arrives that can't wait. Two stages:

**Stage 0 — Sector scan (cross-industry, agent-run).** Surfaces ranked candidate sectors before any human commits effort. Input is a product hypothesis (or just "the next thing we're thinking of building"); output is a ranked shortlist of sector candidates with problem / opportunity / distributor hypotheses per row.

**Stage 1 — Deep dive (sector-specific, five steps).** Picks one (or a few) of Stage 0's top candidates and walks the full five-step pipeline below: sector definition → problems → end-user archetype → existing solutions → distributor identification → validation loop → synthesis gate.

---

## Stage 0 — Sector scan

- **Input:** a product hypothesis or capability seed. Even loose framings work — *"a drop-in voice clarifier widget for SaaS products"*, *"a tool that finds R&D-eligible work as it happens"*, *"a real-time translation widget for in-person service interactions"*. The looser the seed, the more sectors get scanned; the tighter the seed, the more focused the scan.
- **Process:** an LLM-driven cross-industry scan. The agent reviews many candidate sectors against four signal dimensions:
  - **Problem density** — how acute is the pain this capability would address in this sector?
  - **Distributor reachability** — does an obvious distributor archetype exist for this sector, and is it within reach (warm network / cold-but-accessible / blocked)?
  - **Existing-solution gap** — what's used today; how badly does it fit; why hasn't AI eaten it yet?
  - **Market size class** — order-of-magnitude size of the addressable opportunity (small / medium / large / very-large; geographic constraint noted).
- **Artifact produced:** **Stage 0 Scan Output** — ranked table of sectors with one row each carrying: sector name, candidate problem (one-liner), distributor hypothesis, signal-strength score across the four dimensions, market-size class, reachability tag.
- **Pass criterion:** at least **3 candidate sectors score "strong" or higher** on signal-strength AND have an accessible (warm or warm-cold) distributor hypothesis. If <3 pass, the product hypothesis itself is suspect — the capability may not have a clear distribution fit anywhere; re-scope or kill.

The human picks **1–3 candidates from the Stage 0 ranking** to proceed to Stage 1 deep-dive. Picks are based on a combination of signal strength, warmth of the distributor channel, alignment with the operator's existing book, and strategic preference. The methodology doesn't pick — it ranks; the human chooses.

**Important — this stage is the most automation-heavy.** Today, the LLM agent doing Stage 0 IS Claude or the equivalent running cross-industry analysis manually within the operator's session. When this methodology productises (future Rule 15 candidate), Stage 0 is the first stage to become an automated workflow — sector libraries + signal-scoring heuristics + LLM-driven pattern matching. The manual run today produces the spec for the eventual automation.

---

## Stage 1 — Deep dive (per Stage-0 candidate)

Each step has an **input**, a **process**, an **artifact produced**, and a **pass criterion**. Any step that fails its pass criterion blocks the synthesis gate — go back and sharpen, or accept the product won't be built.

### Step 1 — Sector

- **Input:** a sector name with as much specificity as you can muster on day one.
- **Process:** refine the definition by listing
  - Size (number of operators in the target geography)
  - Geographic concentration (Australia-only / ANZ / English-speaking / global)
  - Common operator types within the sector (e.g. accountancy → R&D specialists vs general practice vs corporate audit)
  - Accessibility — *warm* (you or your network knows operators in this sector), *cold* (cold-outreach only), *blocked* (gated by regulation / closed industry / requires credentialing)
- **Artifact produced:** **Sector Card** — one paragraph.
  > *Australian accountancy firms that specialise in R&D tax credit claims for SME clients. Population estimate: 60–120 firms nationally with named R&D practices. Concentrated in Sydney + Melbourne with regional outposts. Accessibility: warm — Dennis has direct relationships with 3 firms via the Karen connection + adjacent accountancy referrals.*
- **Pass criterion:** can you name **3–5 example operators** in this sector? If not, the sector isn't specific enough — sharpen before continuing.

### Step 2 — Problems

- **Input:** the Sector Card from Step 1.
- **Process:** evidence-driven problem identification. Source from at least three of:
  - **Public surfaces:** Reddit threads in sector subreddits, X/LinkedIn posts from sector practitioners, industry-association forums, support-queue complaints visible on vendor sites
  - **Inbound signals:** conversations you've had with operators in the sector (paid or casual), recent industry-news framing, sector-specific newsletter pain
  - **Inferential:** tool-stack gaps in the sector's standard SaaS lineup, vendor changelog patterns ("we added X" implies X was missing), conference panel topics ("the future of Y" implies Y is unresolved)
  - **Adjacent operators:** "What do you wish your software did?" asked of any operator you have access to
  - **Active validation via InvestorPilot (after Step 5):** once the distributor archetype is identified in Step 5, the candidate problem list is validated by running an InvestorPilot outreach campaign at named operators in that archetype. The campaign asks 2–3 of the candidate problems back at the distributor in a way that surfaces *"is this real? how often? how badly?"* — first-party signal beats inference. Responses feed back to confirm / refine / kill problems on the list before the synthesis gate fires.
- **Artifact produced:** **Problem List** — 5–10 problems, each with one cited piece of evidence (link or quote), and (post-validation) a distributor-response signal column.
- **Pass criterion:** at least **3 problems have evidence stronger than "I think so"** — a quote, a link, an inbound signal, a tool-gap observation, or a direct distributor response from the InvestorPilot validation loop. Problems sourced only from inference fail the criterion; sharpen with at least one citation per top-3.

### Step 3 — End-user archetype

- **Input:** Problem List + Sector Card.
- **Process:** pick the **top 1–3 problems** by combination of *frequency* (how many operators hit this) × *intensity* (how badly it hurts). For each, define who specifically in the sector lives the problem.
  - Role / title (specific — not "manager," but "R&D claims specialist at a mid-tier firm")
  - Daily workflow involving the problem
  - Current emotional state about it (annoyance / dread / shrug-and-suffer / actively shopping for solutions)
  - Named example if at all possible — even a pseudonym ("a Karen-archetype at a 40-person firm")
- **Artifact produced:** **End-User Persona(s)** — one paragraph per top problem.
- **Pass criterion:** each top problem has a **named persona with workflow specifics**. If the persona is "operators in general," sharpen — that's not a persona.

### Step 4 — Existing solutions

- **Input:** top problems + personas.
- **Process:** per problem, identify what gets used today.
  - **Vendors:** named tools currently sold into this sector for this problem (even if poorly fitting)
  - **Manual:** spreadsheets, email threads, in-person processes, paper
  - **Internal builds:** custom in-house dashboards / scripts the sector has built for itself
  - **Adjacent SaaS adapted:** general-purpose tools (Notion, Airtable, Excel) being abused into the role
- For each, characterise the gap: what does it do badly? what does it not do at all? what's the cost (in time / money / errors) of the gap?
- **The "why now" question:** why hasn't AI eaten this already? What's changed in the last 12–24 months that makes the build now feasible / the market now ready / a competitor not yet entrenched?
- **Artifact produced:** **Competitive Map** per top problem with gap analysis + "why now" claim.
- **Pass criterion:** the gap is clear and specific, and the "why now" claim holds water. *"AI is hot right now"* is not a why-now; *"ElevenLabs ConvAI crossed the natural-conversation threshold in Q1 2026 making practice-bot quality high enough that the AppleScript-grade existing solutions look obsolete"* is.

### Step 5 — Distributor

- **Input:** persona + problem + competitive map.
- **Process:** identify who **already sells to this persona** and could onsell the new product as an upsell to their existing offering.
  - Adjacent vendors (sell something complementary to the same persona)
  - Sector agencies / consultancies (already manage that persona's outcomes for a fee)
  - Professional associations (have membership + the relationship + a newsletter)
  - Service providers (lawyers, accountants, advisors who serve the persona)
  - Software firms in the sector (white-label resellers)
- For each candidate distributor:
  - What do they currently sell to this persona?
  - What's the wedge this product opens for them? (new revenue line / better retention / sales differentiator / upsell on existing contract)
  - Are they reachable? (warm network / industry-event accessible / cold-outreachable / inaccessible)
  - Margin pressure? (a distributor under margin compression is more likely to add a new revenue line)
- **Artifact produced:** **Distributor Card(s)** — 2–3 named distributor archetypes with the wedge for each.
- **Pass criterion:** at least **one distributor archetype is reachable** (warm network or cold-reachable with reasonable effort) AND has a clear wedge. If all candidates are inaccessible or wedge-less, the sector doesn't have a viable distributor layer — the product can't ship Rule-15-aligned.

### Step 5.5 — Validation loop (InvestorPilot-powered)

Between Step 5 and synthesis, the candidate problem list (Step 2) and the candidate distributor archetype (Step 5) are validated against real first-party signal.

- **Tool:** **InvestorPilot** (`https://investor-pilot-pi.vercel.app/dashboard`) — already live; used internally by CAS for methodology validation in addition to its portfolio-product role.
- **Process:**
  1. Source 20–50 named operators matching the Step-5 distributor archetype (LinkedIn / public directories / sector associations / warm-intro graph).
  2. Configure an InvestorPilot campaign with messaging that asks 2–3 of the Step-2 candidate problems back at them — framed as research, not pitch ("we're scoping a tool for [archetype] in [sector] — does [problem] match your experience? how often?").
  3. Run the campaign; track responses; categorise per-problem as confirmed / refined / killed.
- **Output:** updated Problem List with a distributor-response signal column. Updated Distributor Cards with reachability evidence (who responded, what they said, who's worth a follow-up call).
- **Pass criterion:** **at least 5 distributor-archetype operators respond** (not just receive). If <5 respond, either the messaging needs reshaping (re-run) or the archetype is not as reachable as Step 5 claimed (push back to Step 5).

This step makes the methodology *empirical*, not just analytical. It also creates a dual role for InvestorPilot in the portfolio: a customer-facing product **and** an internal CAS instrument that powers methodology validation. The platform-as-research-tool model is part of why InvestorPilot is a load-bearing portfolio asset, not just one of N marketplace entries.

### Synthesis — Build / Don't-build gate

After all five steps:

- **All five pass criteria met** → **BUILD**, with distributor-in-mind from day one. Output a one-paragraph build brief:
  > *Build [product name] for [persona] in [sector]. Wedge: [problem]. Lead distributor: [distributor archetype] who currently sells [their existing offering] and adds this as [the wedge]. Pricing: distributor-clip Model A at $X per active end-user per month. Stack: [opinionated stack]. Voice: [if applicable]. Build-to-distributor mode: [BYOK self-deploy + paid-hosted distributor-clip].*
- **One or more pass criteria fail** → **DON'T BUILD YET**. Output a parking note:
  > *Sector [X] does not pass Step [N]. Specifically, [reason]. Re-visit when [trigger: a new signal type, a new distributor surfacing, a regulatory change, a vendor exit].*

The parking note is as valuable as the build brief — it converts "we'll get to it" into "we'll get to it *when X happens*" so future sessions can mechanically check whether X has happened.

### The personal-interest override (Rule 15 clause)

If the synthesis gate fails but you want to build the product anyway because it's personally interesting or scratches an itch:

- The override is documented in `cais-shared-services/portfolio-manifest.yaml` as `distributor_gate_status: personal-interest-override` with a one-line rationale.
- The product uses **Model B (plan-with-cap)** pricing per `PRICING_FORMULA.md`, not Model A (distributor-clip).
- It is NOT load-bearing for the monetisation thesis. It does not get studio-in-residence prioritisation. It does not generate clip revenue.
- It is reviewed quarterly — products that no longer carry personal interest should be killed, not life-supported.

---

## Annotated example — R&D Tax Tracker (reverse-engineered)

The R&D Tax Tracker exists in the portfolio today because the methodology *wasn't* run upfront. Running it in reverse shows what the methodology would have produced and where the actual build diverged.

### Step 1 — Sector (run in reverse)

> *Australian accountancy firms that specialise in R&D tax credit claims for SME clients. ~60–120 firms with named R&D practices. Warm to Dennis via Karen and adjacent accountancy referrals.*

Passes Step 1. (Specific. Reachable. Named examples available.)

### Step 2 — Problems (run in reverse)

Top problems for these firms (not for their end-clients):

1. R&D claim quality dependent on the client's after-the-fact recall of what work was eligible (evidence: every R&D consultant complains about this).
2. Junior consultants spend the most time on document chasing rather than claim strategy (evidence: industry survey citations + LinkedIn posts).
3. ATO scrutiny is increasing — claims that pass historically are now triggering audits (evidence: ATO public commentary 2024–2026).

Passes Step 2. (3 problems with at least loose evidence each.)

### Step 3 — End-user archetype (run in reverse)

For problem 1, the persona is a **mid-tier R&D consultant managing 20–40 SME clients across a financial year**. Their daily workflow involves chasing clients for recollection of which sprints/projects/work items were eligible. Emotional state: "this is the worst part of my job; the client always misses things; the claim always could have been bigger."

Passes Step 3.

### Step 4 — Existing solutions (run in reverse)

- Vendors: none specifically built for R&D eligibility tracking at the in-flight level (gap: huge).
- Manual: spreadsheets clients fill in retrospectively, post-mortem interviews.
- Internal builds: firms have ad-hoc templates and checklists, none AI-aware.
- Adjacent SaaS adapted: project management tools (Asana, Linear) used as proxies, but they don't classify by eligibility.

Gap: clear. Why now: LLM-aided eligibility classification per work item is now cheap enough to run continuously, not just at year-end.

Passes Step 4.

### Step 5 — Distributor (run in reverse)

- **R&D tax consultancies** (60–120 named firms nationally) — they sell claim-preparation services on retainer or success-fee basis. Wedge: this product gives them a real-time evidence stream from the client's own work, dramatically improving claim quality and reducing the audit-defence burden. Reachable: warm (Dennis has named contacts).
- **General accountancy firms with R&D practices** — broader category, slightly weaker fit (less specialised). Reachable: warm-to-cold.
- **R&D-focused tech consultancies** that bundle innovation strategy with claim assistance — narrow but exists. Reachable: cold.

Passes Step 5.

### Synthesis (what the build brief SHOULD have looked like)

> *Build R&D Tax Tracker for the in-flight tracking of R&D-eligible work, sold to Australian R&D tax consultancies. Lead distributor: R&D specialist consultancies. Wedge: gives consultants a real-time evidence stream from clients, improves claim quality, reduces audit-defence burden. Pricing: distributor-clip $15 per active client per month — consultant typically charges client $50–150/mo as part of retainer. Stack: Next.js + Supabase + Anthropic Sonnet (classification). Voice: optional (interview-style intake works well). Mode: BYOK self-deploy for consultancies running their own infra + paid-hosted clip for those who want CAS to operate.*

### What actually happened

Built end-user-first for Karen — a specific end-user with a specific R&D pain. UI tuned for individual-claimant flow. Marketing aimed at SMEs ("R&D tax credits made easy"). Distributor layer not identified until after launch. Now requires repositioning: marketing copy needs rewriting, UI needs an admin-for-consultancies layer added (per the global TEAM ADMIN rule three-tier shape), pricing model needs to flip from "end-user subscription" to "consultancy clip per managed client."

**Cost of the reverse:** at least one major revamp cycle. Methodology run upfront would have shipped the right shape on v0.1.

---

## Future automation hooks (do not build yet)

The methodology is manual on purpose. If/when it gets productised — only after it proves itself across 3–5 manual runs and a distributor for the meta-tool itself surfaces — these are the natural automation points the spec already anticipates:

- **Step 1 — Sector enrichment:** auto-pull operator counts + geographic distribution from public registries (ABR for Australia, company registries elsewhere).
- **Step 2 — Problem discovery:** LLM scraping of sector subreddits + LinkedIn + industry forums for pain-signal language; vendor changelog diffing for capability gaps.
- **Step 3 — Persona synthesis:** condense raw signal into typed personas.
- **Step 4 — Competitive map:** vendor-database joins + LLM gap analysis.
- **Step 5 — Distributor identification:** graph-walk from end-user archetype to adjacent-vendor / agency / association nodes; reachability scoring against your CRM.

Each automation hook has a clear input/output already defined by the methodology spec. Building the tool when it's needed is mechanical; building it now would itself violate Rule 15 (no distributor identified for the meta-tool yet).

Likely future distributors for the meta-tool if/when it productises:
- VC accelerator program managers running cohort opportunity discovery
- Dev shops vetting which client problems to take on
- Studio-in-residence engagements where this runs in week 1 to pick the cohort's build targets

When one of these distributors raises their hand asking for the tool, that's the trigger to build it.

---

## Voice agent as in-context clarifier (Rule: VOICE AI STANDARD)

Every step in this methodology has questions where someone running it can legitimately get stuck:

- *"What counts as evidence strong enough for Step 2's pass criterion?"*
- *"Is my persona specific enough or am I still at the 'operators in general' level?"*
- *"How do I tell a real distributor archetype from an adjacent vendor who isn't actually a distributor?"*
- *"What does 'reachable' mean in Step 5 — does my LinkedIn-connection-of-a-connection count?"*
- *"My synthesis output looks borderline — is this a GO with caveats or a parking note?"*

The fix is **not** more documentation — it's a voice agent embedded in whatever surface this methodology is being run on (CAS internal app, studio-in-residence whiteboard, an eventual productised meta-tool). When the user hits a question they don't fully grok, they click the voice agent; the agent has the methodology doc as its knowledge base and discusses the specific gate in real-time, with the user's actual sector / problem / persona as context; the user reaches understanding and completes the step.

This is the canonical use case for the VOICE AI STANDARD RULE applied to internal-operator surfaces, not just end-user surfaces. The agent isn't a chatbot bolted on top — it's the **clarifier layer for every nuanced question the methodology asks**. Same pattern applies to:

- BYOK setup wizards (user confused about what `RESEND_FROM_EMAIL` is for → click agent → real-time explanation in context)
- Admin layer per the TEAM ADMIN rule (distributor admin confused about clip billing → click agent → walk through their specific bill)
- Any product form-field that has nuance the field-label can't fully convey

Spec for the agent's role here:
- **Knowledge base:** the methodology doc + Rule 15 + cross-linked pricing model + worked examples
- **Context-awareness:** the agent reads the user's current step state, current artifact draft, and prior step outputs, so its answers are sector-specific not generic
- **Mode:** discussion-style (user can ask "what do you mean by X?" follow-ups), not single-shot Q&A
- **Exit:** when the user has the answer, the agent suggests "ready to fill in [field]?" and the user closes the agent and continues

This pattern is portfolio-wide and should be the default invocation of the VOICE AI STANDARD rule for any product with multi-step user input — not just CQR-style standalone voice surfaces.

---

## How to invoke this methodology

Trigger 1: **New product idea reaches Rule 15's gate.** Run the methodology against the sector the idea targets. Synthesis output drives the gate's GO/NO-GO decision.

Trigger 2: **Quarterly portfolio re-review.** Run the methodology against any in-portfolio product whose `distributor_gate_status` is `pending` (i.e. was built before Rule 15 existed). Reverse-engineer the steps; surface mismatches between the current product shape and the distributor-validated build brief; either retrofit or override-or-kill.

Trigger 3: **Studio-in-residence engagement week 1.** Run the methodology against the host's cohort sectors. Pick build targets for the engagement's anchor + cohort companies.

Trigger 4: **Sector-opportunity inbound** (a warm contact mentions a sector pain that sounds promising). Run the methodology to validate before committing build time.

---

## Maintenance

- **Append-only change log.** Methodology revisions get dated notes.
- **Quarterly re-review** of the methodology itself — does the synthesis gate fire too often / not enough? Are pass criteria too easy / too hard? Adjust based on observed run outcomes.
- **Cross-link to Rule 15** in `MONETISATION_RULES.md` — the gate references this doc; this doc operationalises the gate. If either changes substantially, reconcile both.
