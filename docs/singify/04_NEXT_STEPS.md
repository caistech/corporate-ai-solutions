# Next Steps — Ordered Action List for Claude Code

**Purpose:** This is the exact sequence Claude Code follows from cold start to v0.1 ship. Each step has an approval gate. Do NOT skip steps.

---

## Phase 0 — Orientation (Day 1, ~2 hours)

### Step 0.1 — Read the full handoff package

In this order:

1. `README_HANDOFF.md` (master document)
2. `SINGIFY_PLATFORM_PRD_v0.2.md` (the PRD)
3. `VALIDATION_LOG.md` (what tonight taught us)
4. `STRATEGIC_REVIEW_DIRECTIVE.md` (the mandatory pre-code deliverable)
5. `pipeline.py` (v3 working code)
6. `app.py` (v3 working code)

**Output:** A short written confirmation that all six documents have been read. Note any contradictions found between them. No work proceeds until this is complete.

### Step 0.2 — Request founder context

Ask the founder for:

1. Current business model documentation (pitch deck, OKRs, revenue plan)
2. LingoPure AI architecture overview and/or source code
3. Existing customer / distributor relationships
4. Current revenue structure
5. 12-month strategic roadmap
6. Team composition and bandwidth
7. Any partner or distribution agreements in place
8. Geographic priorities (Singapore-first or global)
9. Existing brand/positioning materials

**Output:** A specific request to the founder. Wait for materials before proceeding.

---

## Phase 1 — Strategic Review (Day 2-3, ~4 hours)

### Step 1.1 — Produce the Strategic Review Document

Per `STRATEGIC_REVIEW_DIRECTIVE.md`. 2-4 pages, sections A-F.

**Approval gate:** Founder reads, approves, or requests revisions. NO CODE until approved.

### Step 1.2 — Surface contradictions or strategy adjustments

If the review reveals that the PRD or existing strategy needs adjustment, propose specific changes. Do not silently work around contradictions.

**Approval gate:** Founder approves any PRD or strategy adjustments before scaffold proposal.

---

## Phase 2 — Architecture Proposal (Day 4-5, ~4 hours)

### Step 2.1 — LingoPure integration assessment

Investigate LingoPure's voice agent architecture. Answer:

- Can `core/coach/voice_agent.py` be a thin wrapper around LingoPure's existing voice agent?
- If yes, what interface does it expose?
- If no, what's the cleanest adapter pattern?
- What's the risk to LingoPure's existing functionality if we share infrastructure?

**Output:** 1-2 page integration approach document.

**Approval gate:** Founder approves the integration approach.

### Step 2.2 — Scaffold tree proposal

Refine the tree from PRD section 5.3 based on:

- Strategic review findings
- LingoPure integration approach
- Founder feedback

**Output:** Full directory tree as ASCII art, with one-line purpose for each folder/file.

**Approval gate:** Founder approves the scaffold structure.

### Step 2.3 — Refined v0.1 acceptance criteria

Update the checklist from PRD section 11. Make each item measurable.

Bad: "User can record a song"
Good: "Browser MediaRecorder captures user's video+audio for up to 10 minutes, saves to indexedDB during recording, uploads to Supabase storage on completion, no recordings lost on tab close mid-record."

**Approval gate:** Founder approves the refined criteria.

---

## Phase 3 — Scaffolding (Week 2, ~16 hours)

Build in this order. Each substep should compile and have basic tests before moving to the next.

### Step 3.1 — Create the repository structure

- Create all folders from the approved scaffold tree
- Add empty `__init__.py` files
- Add a top-level `README.md` documenting the architecture
- Add `pyproject.toml` with dependencies (mirror v3 venv)
- Add `.gitignore`, `.env.example`
- Add basic test directory structure

**Verify:** Repository structure matches the approved tree. `pip install -e .` succeeds.

### Step 3.2 — Port core/audio/ and core/video/ from v3

Move and refactor:

- `pipeline.py::normalize_input` → `core/audio/io.py`
- `pipeline.py::correct_pitch` → `core/audio/pitch_correction.py`
- `pipeline.py::polish_vocal` → `core/audio/polish_chain.py`
- `pipeline.py::separate_vocal` → `core/audio/separation.py`
- `pipeline.py::mix_with_backing` → `core/audio/mixing.py`
- `pipeline.py::loudness_normalize` → `core/audio/mastering.py`
- `pipeline.py::mux_audio_to_video` → `core/video/mux.py`
- `pipeline.py::download_youtube_backing` → `core/search/youtube.py`

Preserve all engineering patterns:
- `sys.executable` for subprocess Python calls
- Universally compatible video output (AAC stereo 48kHz, +faststart)
- -14 LUFS loudness normalisation
- YouTube URL sanitisation

Add unit tests for each module with synthetic audio fixtures.

**Verify:** All core/audio/ and core/video/ modules have ≥80% test coverage. Tests pass on Python 3.12, Linux, Mac, Windows.

### Step 3.3 — Build core/voice_profile/ (the critical new feature)

Per PRD section 6:

- `core/voice_profile/baseline_test.py` — orchestrates the 2-minute test
- `core/voice_profile/range_detector.py` — pitch + comfort analysis
- `core/voice_profile/key_estimator.py` — comfortable key detection
- `core/voice_profile/stability_analyzer.py` — vibrato + held-note variance
- `core/voice_profile/tonal_profile.py` — spectral character
- `core/voice_profile/profile_storage.py` — save/load per user

This is the single biggest net-new piece of engineering. Test thoroughly.

**Verify:** A user can complete a baseline test and the resulting profile produces correct auto-transposition for at least 5 known songs.

### Step 3.4 — Build core/coach/

Per PRD section 5.3 and the LingoPure integration approach:

- `core/coach/analyzer.py` — performance metrics extraction
- `core/coach/prompts/singing.md` — vertical-specific prompt
- `core/coach/prompts/presenting.md` — stub
- `core/coach/prompts/teaching.md` — stub
- `core/coach/prompts/selling.md` — stub
- `core/coach/prompts/acting.md` — stub (for LingoPure)
- `core/coach/feedback_generator.py` — LLM call orchestrator
- `core/coach/voice_agent.py` — LingoPure adapter OR custom implementation

v0.1 must work without LingoPure if needed, with LingoPure as enhancement.

**Verify:** Given a performance + baseline, the coach produces 3-5 specific timestamped feedback items referencing the baseline.

### Step 3.5 — Build core/auth/ and core/tenancy/

- `core/auth/tos_flow.py` — per CLAUDE.md directive
- `core/auth/distributor_model.py` — tenant entity
- `core/auth/role_model.py` — admin vs end user
- `core/tenancy/distributor_storage.py` — per-distributor data isolation (RLS-backed)
- `core/tenancy/branding.py` — logo, colors, copy customisation
- `core/tenancy/analytics_rollup.py` — per-distributor reporting

Use Supabase for auth + RLS. Postgres tables: `distributors`, `users` (with `distributor_id` FK), `recordings`, `baselines`, `coach_feedback`, `branding`.

**Verify:** A distributor can sign up, invite a user, and the user's data is invisible to other distributors. Row-level security enforced at the database level.

### Step 3.6 — Build core/storage/ and core/search/

- `core/storage/outputs.py` — recording storage abstraction (Supabase storage)
- `core/storage/signed_urls.py` — 7-day shareable links
- `core/search/youtube.py` — YouTube Data API + yt-dlp
- `core/search/lyrics.py` — LRCLIB + WhisperX alignment

**Verify:** A signed URL produces a downloadable video that expires correctly.

---

## Phase 4 — Singify v0.1 (Week 3-4, ~16 hours)

### Step 4.1 — Build products/singify/

- `products/singify/app.py` — Gradio UI for v0.1 (or React if time allows)
- `products/singify/student_flow.py` — the karaoke recording experience
- `products/singify/teacher_dashboard.py` — distributor admin UI
- `products/singify/baseline_questions.py` — singing-specific baseline variant
- `products/singify/config.py` — vertical-specific defaults

Hook into all of `core/` for the underlying engine.

**Verify:** Full user journey from PRD section 3.3 works end-to-end on a hosted instance.

### Step 4.2 — Build the teacher dashboard

- Invite students by email or link
- Set branding (logo upload, primary colour)
- View student baselines and progress
- Configure coach personality (light customisation in v0.1)

**Verify:** A teacher can onboard themselves, invite a student, and see that student's first recording.

### Step 4.3 — Deploy to staging

- Hugging Face Spaces OR Render (founder picks based on cost)
- Connect Supabase project (free tier)
- Configure environment variables
- Set up basic monitoring (uptime ping, error logging)

**Verify:** Staging URL works for founder + one external test user.

---

## Phase 5 — Validation Gate A (Week 5-6)

**Founder uses Singify personally for 2 weeks.** No new feature work during this window.

If gate fails (engine doesn't deliver audible improvement on clean source), pause and diagnose before continuing.

If gate passes:

### Step 5.1 — Recruit 1-3 beta singing teachers

Founder's job. Claude Code's job: provide a polished demo flow + onboarding script.

### Step 5.2 — Closed beta launch

- 10 students from beta teachers
- Track: weekly active use, polish satisfaction (1-5), coach helpfulness (1-5), teacher dashboard usefulness (1-5)
- Weekly retrospective with founder

**Gate B:** 7+ of 10 students say they'd use it weekly. Proceed if pass.

---

## Phase 6 — First Paying Distributor (Week 7-10)

### Step 6.1 — Pricing model decision

Based on beta feedback, propose pricing tiers. Founder approves.

### Step 6.2 — Billing infrastructure (lightweight v0.1)

- Manual Stripe invoices (founder operates)
- No automated billing UI in v0.1
- Distributor account tagged with "paid_through" date

### Step 6.3 — First paying teacher signs up

Founder's job. Likely from beta cohort.

**Gate C:** 1 paying distributor with 5+ active students.

---

## Phase 7 — Second Vertical Validation (Week 11-14)

### Step 7.1 — Pick second vertical

Based on Strategic Review findings + beta learnings. Likely SalesPolish (highest WTP) or PitchPolish (R&D tax accountants — founder mentioned this as adjacency).

### Step 7.2 — Ship second vertical in <2 weeks of core/ engineering

The architecture's test: a new vertical should require only:
- New `products/<vertical>/` folder
- New coach prompt markdown
- New vertical-specific baseline variant
- Optionally new polish presets
- NO changes to `core/`

**Gate D:** Second vertical ships. Validates platform architecture.

---

## Phase 8 — Cross-Product Distribution (Week 15-24)

### Step 8.1 — LingoPure cross-pollination

If Strategic Review recommended integration, ship the integration.

### Step 8.2 — Find a distributor using two products

Drama school using LingoPure + Singify. Or sales org using SalesPolish + Speakify. Or similar.

**Gate E:** Cross-product distributor success. Validates the platform play.

---

## Throughout — non-negotiable engineering rules

1. **Multi-tenancy is core**, enforced at the database level via Row-Level Security
2. **All subprocess calls use `sys.executable`**, never the string `"python"`
3. **All video output uses universally compatible encoding** (AAC stereo 48kHz, +faststart)
4. **Loudness normalisation always applied** before final output
5. **Working folders never inside OneDrive/iCloud/Google Drive synced paths** (for self-hosted setups)
6. **Backing tracks never get pitch-corrected or polished** — only vocals
7. **Voice Coach must reference baseline data**, not generic targets
8. **No paid APIs in v0.1** beyond what the user explicitly provides (BYOK)
9. **Coach prompts in markdown**, not Python source
10. **No core/ imports from products/** — one-way dependency
11. **Headphone presence required** (or strongly nudged) before any recording starts
12. **End users never pay us** — the distributor's billing relationship is sacred

---

## What "v0.1 is done" looks like

- Multi-tenant platform deployed at a stable URL
- Singing teacher can sign up, white-label, invite students
- Student can complete vocal baseline, sing along to YouTube karaoke, get polished output with AI coach feedback
- Teacher dashboard shows student progress
- Architecture is provably capable of a second vertical in <2 weeks
- LingoPure integration path is either implemented OR documented and ready
- $50/month operating cost ceiling respected
- All engineering rules above followed
- Founder has personally validated the experience
- Documentation lets a new engineer onboard in <1 day

---

## When in doubt

**Ask the founder.** This is a platform with strategic implications. Architectural decisions matter. Pricing decisions matter. Vertical sequencing matters. Don't guess.

The founder's bandwidth is limited but the decisions are theirs. Surface trade-offs clearly, recommend a default, wait for confirmation.

---

**End of next steps document.**

Claude Code: begin at Step 0.1.
