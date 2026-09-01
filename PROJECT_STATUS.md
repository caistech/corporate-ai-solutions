# Project Status — Corporate-AI-Solutions

> Auto-maintained by Claude Code. Read at session start, updated before session end.
> Last updated: 2026-09-01T00:00:00Z

## Current State
<!-- One of: ACTIVE_DEVELOPMENT | MAINTENANCE | BLOCKED | PAUSED | SHIPPED -->
**Status**: ACTIVE_DEVELOPMENT

## What Was Just Done
<!-- Updated at end of each session. Most recent first. -->
- Agentic Workload Compiler market validation pass (2026-09-01):
  - Re-framed the compiler story as: describe network → derive workload → simulate latency/batching scenarios → deliver tokens/mo + recommended harness + $/mo client quote. Story strip (Describe/Compile/Simulate/Report) added to the hero.
  - Added `CompilerWaitlist` modal (posts `/api/waitlist`, platform `agentic-workload-compiler`) and a hero "Not live yet" band at the very top of the page with a plain-language pitch + white Join Waitlist CTA.
  - Page metadata refreshed for LinkedIn link previews; page built static, deployed to Vercel production.
  - 5 LinkedIn launch posts written and saved to `docs/linkedin-posts-agentic-workload-compiler.md` (commit 0fa470e).
  - Verified waitlist end-to-end against prod DB: 2 rows landed in `waitlist` via the modal (both test emails).
- Verified deployed page via /browse: hero band, modal (375 bottom-sheet / 1280 centered 512px card), 44px touch targets, no horizontal overflow at 375/768/1280, zero console errors.

## What's Next
<!-- Prioritised list of pending work. Updated each session. -->
- [ ] Run the 5 LinkedIn posts; monitor waitlist signups as the go/no-go signal
- [ ] Decide pricing after run-cost is known (see Key Decisions); consider prepaid early-bird pledge vs waitlist-only
- [ ] Report engine build (scenario A/B/C token+cost runs, harness recommendation, $/mo) — ONLY if market signals; feed it with real `Observed` workloads from a beta-starter cohort

## Blockers
<!-- Anything preventing progress. Include who/what is needed to unblock. -->
- (none)

## Key Decisions Made
<!-- Important architectural or product decisions, with rationale. -->
- No money taken at validation stage (MONETISATION_RULES Rule 12 — no uncovered cost exposure): waitlist + early-bird invite only; pricing deferred until run cost is known.
- The "profiler" is the compiler in THIS repo; Orchestrator is the dispatch/approval control plane (not a profiler); Kira + cais-shared-services are not ingestion sources. A real ingestion layer (upload/paste manifest → validate → seed Solution) is a build gap, not an existing repo.
- Model-management options mapped to layers for the future report engine: HuggingFace = model source/self-host (TGI/vLLM/Ollama), OpenRouter = market-rate $/token baseline, OmniRoute = recommended on-prem harness (cost-optimized routing + compression).
- Compiler kept deterministic/no-LLM on the metered path so a "run" costs ~$0 and Rule 12 holds by construction.

## Active Branches
<!-- Git branches with in-progress work. -->
- `main` — production

## Environment Notes
<!-- Deployment URLs, env vars needed, external service dependencies. -->
- Vercel: https://corporate-ai-solutions.vercel.app/agentic-workload-compiler (production auto-deploy on push to main)
- Supabase: project `tfgtfhwvrswjvkyeyvsp` (ap-south-1) — `waitlist` table: id, created_at, email, platform, source, UNIQUE(email, platform)

## Session Log
<!-- One line per Claude Code session. Auto-appended. -->
| Date | Duration | Summary |
|------|----------|---------|
| 2026-09-01 | ~1.5h | Compiler market-validation pass: story reframe, waitlist modal + hero "not live yet" band, deployed, verified via /browse, DB-seeded via modal test, 5 LinkedIn posts saved. |
