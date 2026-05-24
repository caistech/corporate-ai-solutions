# Singify Platform PRD v0.2

**Product:** Singify (first vertical in a B2B2C voice-AI platform)
**Author:** Dennis
**Status:** Pre-build, scaffold-ready
**Last updated:** May 24, 2026
**Reading time:** ~25 minutes for Claude Code, ~15 for founder review

---

## 0. How to use this document

This is a hand-off PRD for **Claude Code** (the agentic CLI) plus a strategic review document for the founder.

**Claude Code's workflow (do these in order, do NOT skip):**

1. Read this entire document
2. Complete the **strategic review** in section 14 — output a written assessment before any code
3. Surface any contradictions with existing portfolio strategy or business model decisions
4. Propose the scaffold tree (section 6.3) and wait for founder approval
5. Investigate LingoPure AI reuse opportunities (section 7) and propose integration approach
6. Refine v0.1 acceptance criteria (section 11) based on findings
7. **Only after sections 14, 6.3, 7, and 11 are approved by founder → write code**

If Claude Code is uncertain at any decision point, ask. Do not guess.

---

## 1. Executive summary

Singify is the first product in a B2B2C voice-AI platform. The platform applies the same underlying engine — AI-powered voice analysis, polish, coaching, and improvement — to multiple verticals via leveraged distributors.

**The first vertical is singing.** The first distributor is **singing teachers / music academies**. The first end users are **their students**.

The same engine will subsequently power:
- Tax accountants distributing presentation/audit-prep coaching to R&D tax clients
- Talent agents distributing rehearsal + self-tape polish to signed actors (integrating with our existing **LingoPure AI** product)
- Sales managers distributing pitch-rehearsal coaching to sales reps
- Communication coaches distributing executive-speaking improvement to senior leaders
- Drama schools, teacher-training orgs, language schools, and more

**The business model is leveraged distribution, not direct-to-consumer.** Distributors pay a recurring fee for their account; they choose whether to charge their end users. We never sell to end users directly.

**Why this matters strategically:** this model dramatically lowers CAC, increases willingness-to-pay per account, creates white-label moats, and creates a natural distribution mechanism for every product in our portfolio. It is also a strategic *amplifier* of LingoPure AI — Singify and LingoPure aren't separate products in this view; they are vertical applications of one platform whose distribution channels overlap (e.g., a drama school could distribute both).

---

## 2. Founder context for Claude Code

The founder operates a voice-AI agent company. Existing products and infrastructure to consider:

- **LingoPure AI** — voice AI agent that reads lines for actors. B2C/B2B for actors, drama students, voice-over artists, casting prep. Existing user base, existing voice-agent infrastructure, existing distribution relationships with agents and drama coaches.

- **(Other products if applicable)** — founder to provide additional context

**Existing strategic context Claude Code should request before completing the strategic review:**
- Most recent business model document or pitch deck
- Existing pricing strategy
- Existing distributor relationships (which professionals already trust us / use LingoPure?)
- Current revenue structure (consumer subscription? B2B licenses? Hybrid?)
- 12-month strategic goals

Claude Code: ask for these explicitly before completing section 14. Do not proceed without context.

---

## 3. The Singify product (vertical specifics)

### 3.1 One-line description

> Singify is a karaoke + AI vocal polish + voice coaching tool that singing teachers white-label and distribute to their students for practice between lessons.

### 3.2 Why singing teachers as the first distributor vertical

Strategic reasons this is the right starting point:
- **Closest to our existing competency** — adjacent to LingoPure's voice-coaching DNA
- **Clear value proposition** — students improve faster between lessons, teachers retain students longer
- **Low complexity** — no regulatory/compliance issues (unlike tax, sales, or medical)
- **Tangible outcomes** — singing improvement is audible, demoable, viral on social
- **Underserved segment** — vocal coaches currently rely on apps not designed for them
- **Network effects** — teachers know other teachers, music school owners know other school owners
- **Founder personal use** — the founder is the first user, can dogfood directly
- **Pricing reference** — singing teachers commonly charge $40-150/lesson; bundling a $20-50/mo digital tool is natural

### 3.3 The student user journey (v0.1)

1. **Teacher invites student** (email link, white-labeled with teacher's branding)
2. **Student signs up + ToS** (per CLAUDE.md auth directive, full rights acknowledgment)
3. **Vocal baseline assessment** (~2 min one-time):
   - Range test (highest/lowest comfortable note)
   - Comfortable key detection (sing a familiar simple phrase)
   - Pitch stability test (hold a single note)
   - Tonal character profile (sing the same phrase at three energy levels)
   - System stores: range, comfortable key, stability score, tonal profile
4. **Student picks a song** (search YouTube karaoke catalog, embedded playback)
5. **Auto-transposition** — song is offered in student's comfortable key by default; student can override
6. **Sing along** — webcam + mic capture, lyrics scroll synced to backing track
7. **One-click "Improve"** — pipeline runs pitch correction (informed by baseline), polish chain, optional vocal separation
8. **Adjust** — sliders for correction strength, polish preset, reverb, vocal gain; live preview
9. **AI Voice Coach** — analyzes performance against the student's baseline (not against a generic target), gives 3-5 specific, actionable bits of feedback with timestamps
10. **Save & share** — audio-only or synced video; shareable link valid 7 days
11. **Teacher sees aggregate progress** — student's range expansion, stability trend, practice frequency

### 3.4 The teacher (distributor) journey

1. **Teacher self-serve signup** as distributor (5 min)
2. **Branding setup** — upload logo, set colors, optionally custom subdomain
3. **Invite students** — CSV upload or email invite links
4. **Configure** — set whether students pay (and how much, captured by teacher's existing billing) or get it free as part of lesson package
5. **Monitor** — dashboard shows per-student baseline, progress, practice frequency, areas of struggle
6. **Coach customization** — adjust voice coach's personality, focus areas, terminology to match teacher's pedagogical approach
7. **Billing** — flat per-distributor monthly fee, optionally per-active-student tier

### 3.5 v0.1 scope (deliberately narrow)

**In scope:**
- Multi-tenant auth (distributor → students)
- White-label basics (logo, colors)
- Vocal baseline assessment
- YouTube search + embedded karaoke playback
- LRCLIB lyrics + WhisperX alignment fallback
- Webcam + mic recording in browser
- Polish pipeline (port from existing VoicePolish v2)
- AI Voice Coach (text-based feedback v0.1; voice playback deferred to v0.2)
- Save + share with signed URLs
- Teacher dashboard with per-student progress
- ToS + DMCA compliance

**Explicitly out of scope for v0.1:**
- Voice cloning / voice conversion
- Multilingual / translation features (deferred to v1)
- Real-time pitch correction during recording (post-recording only)
- Mobile app (web-only)
- Stripe billing integration (manual invoicing in beta)
- Public social feed (teachers control sharing, not us)
- Custom subdomain provisioning (only path-based white-label in v0.1, e.g. `singify.app/acme-music`)
- Voice cloning across languages (deferred but architecturally allowed)

### 3.6 v0.2 and beyond (architectural awareness, not v0.1 build)

- Multilingual: sing in one language, render lyrics + AI vocal in another
- Voice coach as conversational voice agent (reuse LingoPure infrastructure)
- Real-time pitch correction
- Mobile app
- Public catalog (verified teacher recommendations)
- Cross-vertical: same architecture supports Speakify, Teacherly, SalesPolish

---

## 4. Business model

### 4.1 The leveraged distributor model

**We sell to distributors, never to end users.** Distributors decide whether and how to monetize end users.

| Customer | Buyer's job | Our value to them | Pricing |
|---|---|---|---|
| **Singing teachers / music academies** | Improve student outcomes, retain students longer, justify premium pricing | Tool for between-lesson practice + measurable progress | $49-249/mo per teacher account |
| **Future: Tax accountants** | Help R&D clients prep audit submissions | Polished presentation videos for HMRC/IRS | $99-499/mo per firm |
| **Future: Talent agents** | Get actors more bookings | Self-tape polish + rehearsal (with LingoPure) | $79-299/mo per agency |
| **Future: Sales managers** | Ramp reps faster, improve close rates | Pitch rehearsal + coaching | $30-50/seat/mo |

### 4.2 Why this model beats direct-to-consumer

- **CAC drops 5-10x** — one distributor signup = 20-200 end users
- **Higher ARPU** — distributors pay more than individual consumers
- **Lower churn** — workflow integration makes switching costly
- **White-label revenue** — premium tier removes our branding for extra fee
- **Vertical expertise outsourced** — distributors bring domain knowledge; we bring AI
- **Lower regulatory exposure** — professionals handle compliance in their domain
- **Cross-portfolio synergy** — same distributors can use multiple products

### 4.3 Revenue model

- **Base tier:** flat monthly fee, includes up to N end users
- **Growth tier:** flat fee + per-active-end-user pricing above N
- **White-label tier:** premium add-on for full branding removal
- **API tier (future):** distributors with their own platforms integrate via API

### 4.4 What we charge end users: $0

We never bill end users directly. The distributor's billing relationship is sacred.

---

## 5. Architecture principles for cross-product reuse

This is the most strategically important section. Read carefully.

### 5.1 The product family on one engine

Same engine, different verticals:

| Product | Vertical | Distributor | End user |
|---|---|---|---|
| **Singify** (v0.1) | Singing | Music teachers | Students |
| **Speakify** | Presentations | Comms coaches, exec coaches | Senior leaders |
| **Teacherly** | Teaching delivery | School districts, teacher training orgs | Teachers |
| **SalesPolish** | Sales pitches | Sales enablement leaders | SDRs/AEs |
| **PitchPolish** | R&D tax | Tax accountants | Tax clients |
| **LingoPure AI** (existing) | Actor rehearsal + self-tape polish | Talent agents, drama schools | Actors |

The architecture must support adding a new vertical in **1-2 weeks of work**, not 2-3 months. This is the key strategic constraint on v0.1 architecture.

### 5.2 Architectural rules

1. **Core engine is product-agnostic.** Pitch detection, polish chain, baseline assessment, video sync — these live in `core/` and know nothing about singing, sales, or acting.

2. **Vertical-specific code lives in `products/`.** Singify-specific terminology, song catalog logic, coach prompts, success metrics, baseline test variant — these live in `products/singify/`.

3. **Dependency direction is one-way.** Core never imports from products. Products import from core.

4. **Coach prompts live in markdown files**, not Python source. PMs and domain experts iterate on coaching tone without touching code.

5. **Multi-tenancy is core**, not a product feature. Every product gets tenant isolation, distributor admin, white-labeling, analytics rollup.

6. **LingoPure AI is a first-class integration target**, not an afterthought. Specifically, its voice-agent loop should be the substrate for Singify's coach if technically feasible.

7. **No paid APIs in v0.1.** Everything runs on local models (Whisper, librosa, psola, demucs, pedalboard) and Claude API only if user provides a key. v0.1 must run with $0 of API spend per request.

### 5.3 Proposed scaffold tree

```
singify-platform/
├── core/                          # shared engine across all products
│   ├── audio/
│   │   ├── pitch_correction.py    # ported from VoicePolish v2
│   │   ├── polish_chain.py        # ported from VoicePolish v2
│   │   ├── separation.py          # demucs wrapper
│   │   ├── analysis.py            # extracts performance metrics
│   │   └── tests/
│   ├── video/
│   │   └── mux.py                 # ffmpeg wrappers (ported)
│   ├── voice_profile/             # vocal baseline assessment
│   │   ├── baseline_test.py
│   │   ├── range_detector.py
│   │   ├── key_estimator.py
│   │   ├── stability_analyzer.py
│   │   ├── tonal_profile.py
│   │   └── profile_storage.py
│   ├── coach/
│   │   ├── analyzer.py            # converts performance into structured data
│   │   ├── prompts/
│   │   │   ├── singing.md
│   │   │   ├── presenting.md
│   │   │   ├── teaching.md
│   │   │   ├── selling.md
│   │   │   └── acting.md          # for LingoPure integration
│   │   ├── feedback_generator.py  # LLM-driven coaching output
│   │   └── voice_agent.py         # ← bridges to LingoPure if feasible
│   ├── auth/
│   │   ├── tos_flow.py            # per CLAUDE.md directive
│   │   ├── distributor_model.py   # tenant entities
│   │   └── role_model.py          # admin vs end-user roles
│   ├── tenancy/
│   │   ├── distributor_storage.py # per-distributor data isolation
│   │   ├── branding.py            # logo, colors, copy customization
│   │   └── analytics_rollup.py    # per-distributor reporting
│   ├── storage/
│   │   ├── outputs.py             # user recording storage
│   │   └── signed_urls.py
│   └── search/
│       ├── youtube.py             # YouTube Data API wrapper
│       └── lyrics.py              # LRCLIB + WhisperX alignment
├── products/
│   ├── singify/                   # v0.1 deliverable
│   │   ├── app.py                 # Gradio UI (will migrate to React later)
│   │   ├── student_flow.py
│   │   ├── teacher_dashboard.py
│   │   ├── baseline_questions.py  # singing-specific baseline variant
│   │   ├── config.py
│   │   └── tests/
│   ├── speakify/                  # stub only in v0.1
│   ├── teacherly/                 # stub only
│   ├── salespolish/               # stub only
│   ├── pitchpolish/               # stub only
│   └── lingopure_bridge/          # adapter for existing product
├── shared/
│   ├── ffmpeg_utils.py
│   └── lingopure_client.py        # client for LingoPure's API
├── tests/
│   ├── integration/
│   └── e2e/
└── docs/
    ├── architecture.md
    ├── adding_a_new_vertical.md   # critical doc — how to add Speakify etc.
    └── distributor_onboarding.md
```

### 5.4 What must be true after v0.1

To validate the architecture works:
- Adding the second vertical (any of the above) must take <2 weeks
- No core/ file changes when adding a new vertical
- Distributor onboarding works for the second vertical with same UX patterns
- LingoPure integration path is at least prototyped

---

## 6. The vocal baseline assessment (core differentiator)

This is a feature competitors do not have. It's worth dwelling on.

### 6.1 Why it matters

Every other karaoke/polish app applies generic effects. Singify is the first to **know the user's voice first, then choose corrections that fit**.

This unlocks:
- Auto-transposition of songs to user's comfortable key
- Pitch correction parameters tuned to user's stability profile
- Polish presets selected by user's tonal character
- Voice Coach feedback referencing user's actual range and capabilities
- Measurable progress tracking over time (range expansion, stability gains)

### 6.2 The four tests (~2 minutes total)

1. **Range test** (~30s): user sings "ah" up and down a scale; system detects highest/lowest comfortable notes
2. **Comfortable key test** (~20s): user sings "Happy Birthday" or similar; system detects natural key center
3. **Stability test** (~20s): user holds a single note for 5 seconds; system measures pitch deviation + vibrato style
4. **Tonal character** (~30s): user sings the same short phrase at soft/medium/full energy; system captures spectral character

### 6.3 What it enables for the coach

The Voice Coach goes from generic ("you went flat in the chorus") to personal ("this song peaks at A4 — that's at the top of your comfortable range. Try the chorus an octave down for the repeat. Your stability score on held notes was 78%, so let's focus on breath support for these long lines specifically.")

### 6.4 Reusability across products

The baseline pattern reuses for every vertical:

- **Speakify baseline:** pace, default pitch, monotone tendency, filler-word frequency, projection
- **Teacherly baseline:** classroom-presence projection, pace variation, warmth, modulation
- **SalesPolish baseline:** confidence cues, urgency calibration, filler density, energy
- **LingoPure baseline:** vocal range for casting type, emotional flexibility, accent stability

The architecture must accommodate per-product baseline variants. This belongs in `core/voice_profile/` with product-specific configs in `products/*/baseline_questions.py`.

---

## 7. LingoPure AI integration

This is a critical investigation Claude Code must perform before final architecture sign-off.

### 7.1 Why this matters

LingoPure AI is an existing product with:
- Existing voice agent infrastructure
- Existing customer base (actors, drama students, agents)
- Existing distribution relationships
- Existing brand recognition

If Singify is architected without considering LingoPure, we risk:
- Building parallel voice-agent infrastructure (waste)
- Confusing positioning for existing customers
- Missing the opportunity to cross-sell

If LingoPure is integrated thoughtfully:
- Singify's coach reuses LingoPure's voice agent loop (massive engineering shortcut)
- LingoPure customers get Singify-style polish as an upgrade ("polish your audition tape")
- Drama schools and talent agents become natural Singify distributors
- One unified voice-AI platform brand emerges over time

### 7.2 What Claude Code must investigate

In section 14 (strategic review), Claude Code must address:

1. **Architecture compatibility**: can LingoPure's voice agent be the substrate for Singify's coach? If yes, what interface should `core/coach/voice_agent.py` expose?
2. **Customer overlap**: do LingoPure's customers (agents, drama schools) overlap with Singify's distributor profile? Should they be offered Singify first?
3. **Branding strategy**: do we present these as two products, one platform, or sub-products of an umbrella brand?
4. **Pricing strategy**: bundled? Separate? Cross-discounts?
5. **Cannibalization risk**: does Singify steal LingoPure usage time?
6. **Technical integration risk**: if LingoPure's stack is incompatible with Singify's (different languages, different infra), what's the cleanest adapter?

Claude Code should request LingoPure source code or architecture docs before answering.

---

## 8. Legal / compliance posture

(Per earlier draft, condensed)

- YouTube backing tracks: embedded playback only, never re-hosted
- User recording: their mic captures their performance; backing track bleed is incidental (legally analogous to recording yourself at a karaoke bar)
- DMCA endpoint required before public launch
- ToS includes user acknowledgment that they don't redistribute copyrighted backing tracks
- Optional "this is a cover" flag auto-mutes backing track in shared output (vocals only)
- White-label distributors carry their own ToS layer; we provide the template

Claude Code: flag this for legal review before any public launch beyond closed beta.

---

## 9. Tech stack (v0.1)

**Frontend:** Gradio 6.x → React/Next.js when scale demands. Not in v0.1.
**Backend:** Python 3.12 + FastAPI
**Audio/Video:** librosa, psola, pedalboard, soundfile, demucs, ffmpeg, WhisperX
**LLM:** Anthropic Claude API (BYOK in v0.1; platform-paid in v0.2)
**Local STT:** Whisper
**Search:** YouTube Data API v3, LRCLIB
**Auth/Storage:** Supabase (multi-tenant via row-level security)
**Database:** Postgres (via Supabase)
**Hosting:** Local for dev, Hugging Face Spaces or Render for staging, TBD for production
**Cost ceiling for v0.1:** $50/month all-in

---

## 10. Validation gates (do not skip)

**Gate A — Founder personal validation (2 weeks)**
Founder uses Singify on own recordings. Subjective: "does this make my singing actually sound better?"

**Gate B — Closed beta with founder's network (4 weeks)**
10 beta students from 1-3 sympathetic singing teachers. Quantitative: 7+ say they'd use it weekly. Qualitative: teacher reports improvement in students.

**Gate C — First paid distributor (8 weeks)**
1 paying singing teacher with 5+ active students. Validates the commercial model end-to-end.

**Gate D — Second vertical (12-16 weeks)**
Architecture proves out: pick one of Speakify/SalesPolish/PitchPolish/LingoPure-integration and ship v0.1 of it in <2 weeks of core/ engineering.

**Gate E — Cross-product distributor (24 weeks)**
A distributor (e.g., drama school) uses both Singify and LingoPure for their end users. Validates the platform vision.

---

## 11. v0.1 acceptance criteria (draft — Claude Code to refine)

- [ ] Hosted at TBD URL with founder access
- [ ] Distributor (singing teacher) can self-serve signup + ToS in <5 min
- [ ] Distributor can configure basic branding (logo, primary color)
- [ ] Distributor can invite end users via email/link
- [ ] End user (student) signs up + ToS in <30s
- [ ] End user completes 2-min vocal baseline
- [ ] System stores baseline + uses it in subsequent processing
- [ ] User can search for a song and see karaoke results
- [ ] System auto-transposes to user's comfortable key
- [ ] User can record (webcam + mic) with synced lyrics scrolling
- [ ] One-click "Improve" runs polish pipeline in <2x real-time
- [ ] User can preview adjustments via sliders before final render
- [ ] AI Voice Coach gives ≥3 specific timestamped pieces of feedback referencing baseline
- [ ] User can export audio or synced video
- [ ] Shareable link valid 7 days
- [ ] Teacher dashboard shows student baseline + progress
- [ ] All copyrighted-material disclaimers in place
- [ ] DMCA endpoint exists (even if manual in beta)
- [ ] Architecture supports adding a second vertical without core/ changes

---

## 12. Cost & resource estimate

**Founder engineering effort:** 8-12 weeks of focused weekends with Claude Code
**Outside engineering (optional):** 6-8 weeks with one mid-level full-stack dev
**Operational cost during v0.1:** <$50/mo
**Pre-revenue runway needed:** ~3 months
**Time to first paying distributor:** ~10 weeks from build start
**Time to second vertical shipping:** ~16 weeks total

---

## 13. Open questions for the founder

Claude Code: surface these for founder decision after strategic review.

1. Brand architecture: Singify and LingoPure as sibling products under an umbrella brand, or independent products that share infra?
2. White-label naming convention?
3. Voice Coach in v0.1: text-only or already voice-enabled (using LingoPure infra)?
4. Pricing tiers: how many, and at what price points?
5. Beta distributor: do you have a specific singing teacher in mind, or open recruitment?
6. Should there be a "founder mode" — Singify usable as a standalone tool for the founder personally, independent of distributor flow, for v0 testing?
7. Geographic launch: Singapore only initially? Global? Affects YouTube content availability, language, payment.
8. Privacy stance: do students see their teacher's view, or only teacher sees student progress? Affects trust.

---

## 14. STRATEGIC REVIEW — Claude Code must complete before any code

**This is a directive, not a suggestion.**

Before scaffolding, before writing a single .py file, Claude Code must produce a written **Strategic Review Document** that addresses the following. The founder will read this and approve/refine before build begins.

### 14.1 Review prompt

> Read the founder's existing strategy materials (request them if not provided). Review the full Singify PRD against that strategy. **Do not just check for consistency — actively look for places where Singify *changes* what we should be doing.**
>
> The founder explicitly wants to know: where does this new product, and its B2B2C distribution model, *enhance* or *reshape* what was already underway?

### 14.2 Required deliverables in the review

A. **Strategic alignment audit**
- Where Singify fits cleanly into existing strategy
- Where it stretches or contradicts existing strategy
- What strategic assumptions Singify validates or invalidates

B. **Portfolio enhancement opportunities**
- Specifically how Singify changes the case for LingoPure AI (does it strengthen, dilute, or refocus?)
- Cross-sell paths between products
- Brand architecture implications (umbrella brand vs. independent brands)
- Joint distribution opportunities (which distributors could carry both LingoPure and Singify?)

C. **New strategic insights**
- What does the "leveraged distributor" model reveal about how the rest of the portfolio should go to market?
- Are there existing distribution relationships we're underusing?
- Is there a vertical we'd previously deprioritized that now looks more attractive given the B2B2C lens?
- Does the multi-tenant platform architecture enable a play we hadn't considered (e.g., licensing the engine to vertical SaaS companies)?

D. **Risks and tensions**
- Brand confusion risks
- Engineering complexity from supporting multiple verticals
- Distraction risk from existing LingoPure roadmap
- Cannibalization risk
- Channel conflict risk (if existing LingoPure customers are also potential Singify distributors)

E. **Recommended adjustments**
- Concrete recommendations to either the Singify v0.1 plan OR the existing portfolio strategy
- Sequencing recommendations (which vertical second? what platform features to prioritize?)
- Naming and positioning recommendations

F. **Open questions for founder**
- Anything Claude Code cannot resolve without founder input

### 14.3 Format

Markdown document, 2-4 pages. Sections matching A-F above. Concrete and direct, not hedging. Numbered observations make founder discussion easier.

### 14.4 Approval gate

Founder reviews the strategic review document. Approves, requests revisions, or pauses the build. **No code is written until this is signed off.**

---

## 15. What Claude Code should do, in order

1. **Read this PRD in full.**
2. **Request** founder's existing strategy materials (business model docs, pitch decks, LingoPure architecture, current revenue structure, 12-month plan).
3. **Request** LingoPure AI source code or architecture documentation.
4. **Produce** the Strategic Review Document per section 14. Wait for founder approval.
5. **Propose** any adjustments to the PRD based on review findings. Wait for founder approval.
6. **Output** the final scaffold tree (refining section 5.3). Wait for founder approval.
7. **Output** the LingoPure integration approach. Wait for founder approval.
8. **Output** the refined v0.1 acceptance criteria. Wait for founder approval.
9. **Only then:** begin scaffolding. Build in the order described in section 5.3 and 11.

---

## 16. What Claude Code must NOT do

- Skip the strategic review (section 14). This is the founder's most important ask.
- Treat Singify as a consumer product. It is a B2B2C platform product.
- Build features outside v0.1 scope (section 3.5).
- Introduce paid API dependencies without flagging.
- Refactor LingoPure. Read it only.
- Assume any architecture not approved.
- Over-engineer abstractions before the core flow works.
- Suggest direct-to-consumer pricing. End users never pay us.

---

## 17. Existing assets to port from

Founder has a working prototype in `C:\Users\denni\Desktop\voicepolish\`:

- `pipeline.py`: normalize_input, correct_pitch, polish_vocal, mix_with_backing, mux_audio_to_video, separate_vocal, process
- `app.py`: Gradio UI with file upload, scale selector, correction strength, polish presets, video mux

These are tested on Python 3.12 / Windows / CPU. They ran successfully end-to-end on a 4:42 .m4a Zoom recording.

Port these into `core/audio/` and `core/video/` as the starting point. The Singify-specific code (multi-tenancy, distributor flow, vocal baseline, YouTube karaoke search, in-browser recording, coach) is the net-new build.

---

## End of PRD

Claude Code: begin with section 15, step 1. Strategic review (section 14) is mandatory before any code is written. The founder expects honest, sharp, non-hedging analysis — not just compliance with the PRD as written. If Singify changes how the rest of the business should be run, say so plainly.
