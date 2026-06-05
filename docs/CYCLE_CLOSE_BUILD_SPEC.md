# Claude Code instruction block — close the execution↔scoring loop

Paste the block below into Claude Code at `C:\Users\denni\PycharmProjects\`.
It implements the four double-confirmed missing edges so the test→fix→rescore
cycle closes and the card shows the truth. Scoped, ordered, with the contracts
fixed so nothing welds the loop to one vendor.

> Context the block relies on (from two independent recon runs):
> - Execution works: ECC commits/pushes/PRs to the target repo
>   (`easy-claude-code/apps/frontend/lib/github-actions.ts:73, :599-620`),
>   completion callback writes only to ECC's own DB
>   (`easy-claude-code/.../app/api/dispatch/complete/route.ts:41-56`).
> - Scoring works: compute-on-read `loadCardScore`→`scoreCard`
>   (`Corporate-AI-Solutions/src/lib/methodology/readiness.ts:23-55`,
>   `.../score.ts:138-214`). Verdicts in `readiness_results`
>   (schema `supabase/migrations/20260527000000_readiness_scoring.sql:36-46`,
>   `source IN ('auto','naive-tester','voice-auditor','judge')`).
> - Verdict writers exist for auto/naive-tester/judge via
>   `validation-test/route.ts` and `cais-shared-services/scripts/submit-validation-results.mjs:228`.
> - Missing (NEVER-BUILT ×2): post-commit re-score trigger; cockpit↔ECC relay;
>   card run/fix field; (voice-auditor — skip, deal-findrs has no voice).
> - Legacy: `recalculate-score/route.ts:64` persists `weighted_score_percent`;
>   card reads it via `portfolio-scanner.ts:51` → a second score source that can
>   disagree with `loadCardScore`. Retire it.

---

```
Implement the missing edges that close the test→fix→rescore loop between the
execution system (easy-claude-code / ECC) and the scoring system (the cockpit,
Corporate-AI-Solutions). Read-first, then implement in the order below. Do NOT
build a voice-auditor producer (out of scope — deal-findrs has no voice). Do NOT
add an automated /loop driver yet — we wire the trigger and the visibility first,
confirm a real commit moves the score once, THEN consider automation.

ARCHITECTURAL CONSTRAINT (non-negotiable): the cycle's brain stays in the repo,
not in Claude Code. Verdict producers must write readiness_results through the
existing route/CLI contract (validation-test/route.ts /
submit-validation-results.mjs), never by hard-coding a slash-command call. ECC
stays a swappable fixer addressed by an interface, not by name. Keep the seam at
the readiness_results table + a run-outcome contract, so a different runner could
replace ECC or the audit skills with no change to scoring.

STEP 1 — POST-COMMIT RE-SCORE TRIGGER (the keystone).
Today all readiness_results writes are manual. Build the trigger that, after a
commit/PR lands in a target repo from an ECC run, re-runs the APPLICABLE verdict
producers for that product and writes fresh readiness_results rows — so
loadCardScore reflects the post-fix state.
  - Determine "applicable" from readiness_criteria.applies_when vs the product's
    features (same logic scoreCard() already uses for applicability).
  - IMPORTANT timing: the producers (naive-tester etc.) test a LIVE url via
    /browse, so the target repo's deploy must be live before re-running. Gate the
    re-run on deploy-ready (poll the deployment, or accept a deploy webhook), and
    record the commit SHA the verdicts correspond to.
  - Write verdicts through the existing contract; stamp each row's scored_at and
    the commit SHA it was produced against.
  - Expose this as a callable endpoint in the cockpit (e.g.
    POST /api/admin/pipeline/[productId]/rescore) taking { productId, commitSha }.
    This is the surface STEP 2 will call. Idempotent per (productId, commitSha).

STEP 2 — RELAY (ECC → cockpit, one-way report).
Extend ECC's completion callback (app/api/dispatch/complete/route.ts:41-56) so
that, in addition to writing ECC's own DB, it reports the run outcome into the
cockpit:
  - POST to a new cockpit endpoint (e.g. POST /api/ingest/ecc-run) carrying:
    ECC project_id, resolved cockpit product id, run status, commit SHA, PR url
    (if standard tier), task summary, timestamps.
  - Join key (B2): map ECC project_id (deal-findrs = 07c7743c-3120-4e26-af23-
    e6580b2260cf) to the cockpit product. Add an explicit mapping column rather
    than matching on repo-name string.
  - The cockpit endpoint persists the run outcome (STEP 3 field) AND, when the
    run produced a commit, calls STEP 1's rescore endpoint with that commitSha.
  - Auth: cockpit endpoint verifies a shared secret / service token from ECC — do
    not leave it open. ECC→cockpit is server-to-server.

STEP 3 — CARD TRUTH (run/fix visibility + retire the dual score source).
Same edit surface (the card + product_validation_status + portfolio-scanner).
  a) Add the run/fix fields the relay populates (currently only build_status, a
     manual enum, exists): last_run_status, last_run_at, last_commit_sha,
     last_pr_url, last_task_summary. Migration + types + card render.
  b) Retire the second score source: the card must display ONLY the compute-on-
     read score from loadCardScore. Stop surfacing the persisted
     weighted_score_percent (portfolio-scanner.ts:51); either point
     recalculate-score/route.ts:64 at loadCardScore so it can't write a
     conflicting number, or drop the write. One score, one source of truth.
  c) VERDICT FRESHNESS (the actual "truthful visibility" requirement): the card
     must distinguish "this score is current" from "this score predates the last
     commit." Compare the latest readiness_results scored_at / commit SHA against
     last_commit_sha from the relay. If a commit landed but no re-score has been
     written for it, show "verdicts stale — re-score pending" rather than silently
     showing the pre-fix score. The card lies by omission otherwise.
  d) Also surface, from scoreCard output already available: hard-gate pass/fail,
     band, and the toReachGo list — so the card shows WHAT to fix next, not just
     a number.

OUTPUT: implement steps 1→3 in that order. After each step, summarise the files
touched and the migration(s) added. Where a design choice is open (deploy-ready
detection in STEP 1; mapping-column placement in STEP 2), state the choice you
made and why. Do not start STEP 4 (automation) — stop after STEP 3 so we can
dispatch one real fix and confirm the score moves before automating the loop.
```

---

## After it runs — the one manual confirmation before automating

Dispatch a single real fix from `toReachGo`, let the relay + trigger fire, and
watch the card: the score should move and the freshness flag should clear. If it
does, the circuit is closed and `/loop` becomes safe to add (with a max-iteration
guard + human checkpoint). If the score doesn't move, the break is isolated to
STEP 1's re-run (likely deploy-timing) — not the whole loop.
