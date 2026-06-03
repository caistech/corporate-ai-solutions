# SESSION HANDOFF — 2026-06-03 (deal-findrs rebuild + survey-variance finding)

## TL;DR — where things stand
- deal-findrs was driven through the full pipeline end-to-end for the first time. The machinery WORKS
  (survey trigger, CI design-build, auth, cache-bust, merge, redeploy all proven live).
- A standards-driven autonomous rebuild (PR #9) genuinely IMPROVED the product (added distribution
  loop, single coherent reseller archetype, evidenced buyer-title/stage/exclusions, data-* markers).
- **BUT the survey gate is too non-deterministic to function.** Same/improving content scored
  12/14 RENOVATION → 10/14 TEARDOWN → 9/14 TEARDOWN across three runs, with an intra-run
  self-contradiction (evidenced "Agency Owner / Principal" as buyer title, then failed PRE-HARD P2
  for "no named archetype"). The gate is measuring the model's mood, not the product.
- **Next session #1: SURVEY VARIANCE REDUCTION.** Everything else is downstream of a reliable gate.

---

## NEXT SESSION #1 — Make the survey verdict deterministic

### Goal (success criterion)
deal-findrs scores **identically on three consecutive runs**. Today it's 12/10/9. Success = same
verdict every time (the number matters less than the stability).

### The core reframe
Today the survey is "an LLM that reads a site AND emits a verdict" — the model does both *find the
evidence* and *judge whether it counts*. Job 2 is the killer (it found the archetype, then judged it
didn't count). **Split the jobs: the LLM OBSERVES, deterministic code DECIDES.** Move the pass/fail
decision OUT of the LLM and into presence-based rules the LLM feeds.

### Concrete work (in SURVEY_MODE.md + the survey harness / survey.yml, NOT in any product)
1. **Presence-based field checks.** A field is evidenced iff a required machine-checkable marker is
   present (DOM string, a `data-*` attribute, or a repo path:line pattern) — NOT iff the model is
   convinced. The build ALREADY emits these markers (`data-icp-partner-type="reseller"`,
   `data-exclusions="..."`). Score on those. Define, per field, what counts as evidence.
2. **PRE-HARD P2/P3 as explicit presence rules, not judgments.** P2 = any string from a defined set
   (`agency owner`, `principal`, `buyers' agent firm`, ...) present → pass. Remove the model's
   discretion over "category vs named archetype" (that's what flip-flopped). P3 = each of its 4
   questions passes if a corresponding marker/section exists.
3. **Pin the model** (temperature 0) and/or **consensus-over-N** (run 3×, take worst-case/majority;
   flag borderline products as unstable instead of silently picking one roll).
4. **Architectural endpoint:** survey becomes a deterministic HARNESS — fetch DOM + repo, run presence
   checks in plain code, use the LLM only for genuinely fuzzy classification, and feed that into
   deterministic scoring. The LLM never returns the verdict directly.

### The nice convergence
The build side already plants `data-*` markers precisely so a survey COULD check presence
deterministically — the survey just doesn't consume them yet. Next phase wires them together:
**build plants machine-checkable evidence; survey checks for it.** Variance collapses because both
sides agree mechanically on what "evidenced" means.

### Validate it the way bugs were validated today
Run the same product N times; require identical verdict. Test data already exists: deal-findrs at
12/10/9 across three runs (in bug-knowledge `cais-survey-verdict-nondeterministic-variance`).

---

## deal-findrs current state (do NOT lose)
- Merged to main (commit 3e556e9), live in production (deal-findrs.vercel.app). Rebuilt site is GOOD.
- Current survey verdict: TEARDOWN 9/14 — but this is a VARIANCE artifact, not a true regression.
  Do NOT rebuild again to "fix" it; rebuilding can't reliably beat a flaky gate. Fix the gate first,
  THEN re-survey deal-findrs (it should land RENOVATION with margin once checks are presence-based).
- Open follow-ups on deal-findrs (post-gate-fix, not urgent):
  - share_tokens TABLE must be created in deal-findrs Supabase (obakurzlpzisflnnjzzo) before the Share
    button works for real (migration 008_share_tokens.sql is in the merged code; applying it is separate).
  - SUPABASE_SERVICE_ROLE_KEY shows "Needs Attention" in deal-findrs Vercel env — verify it's set.
  - Rotate the QA Supabase test user password (qa@corporateaisolutions.com / was committed in
    session.config.json, now removed + gitignored, but touched git history). Low stakes (test user).
  - CodeRabbit non-blockers to revisit: share_tokens RLS should be company-scoped (get_user_company_id),
    public-read policy too broad, share-state-not-reset-on-route-change, clipboard-success-without-await.

---

## UPSTREAM PROMOTE-PASS (the level-2 twins of today's instance fixes — none committed yet)
These are CAPTURED (staged in /mnt/user-data/outputs) but NOT yet in the repos. Commit in one batch.
Ordered by leverage:

1. **[#1 — see above] Survey variance reduction** → SURVEY_MODE.md + survey.yml. Gate-breaking; do first.

2. **eslint devDeps (PINNED) + .eslintrc.json into the template** → cais-build-template-v2.
   - Add `eslint@^8.57.0` + `eslint-config-next@<template-next-version>` to template package.json devDeps.
   - PINNED: unpinned pulls eslint 9, which removed config options `next lint` (Next 14) still uses →
     "Unknown options: useEslintrc..." failure. Eslint 8 is the safe pairing for Next 14.
   - Add `.eslintrc.json` with `react/no-unescaped-entities: off` (staged: template-eslintrc.json).
   - WHY: today the template shipped without eslint → lint silently skipped in builds → latent lint
     errors accumulated AND the portfolio-gate (which runs lint) failed with "ESLint must be installed".

3. **Lazy Supabase client init as a template standard + design-build rule.**
   - NEVER call createClient at module scope; use a lazy getter (getAdmin()/getSupabaseAdmin()).
   - Eager module-scope `const x = createClient(URL!, KEY!)` throws "supabaseUrl is required" during
     `next build` page-data collection when env is absent (env-less gates, fork PRs). deal-findrs had
     multiple eager routes (create-user, then company/create via evidence) — whack-a-mole.
   - Add to design-build.yml HARD RULES; add a codemod/standard to the template.

4. **Supabase NEW-TABLE typing rule — extend to READS.** design-build.yml currently says cast the
   INSERT/UPDATE payload `as never`. It does NOT cover READS from a new table, which type as `never`
   and fail (`Property X does not exist on type never`). Extend the rule: reads use `.single<RowType>()`
   (define the row type). The agent hit exactly this gap on share_tokens GET.

5. **bug-knowledge.json (27 entries) → overwrite repo file (do NOT hand-paste).** Includes:
   - cais-survey-verdict-nondeterministic-variance (now carries all THREE runs + the self-contradiction)
   - cais-validation-run-test-not-aggregated-to-validation-test (staged: bug-knowledge-validation-wiring-entry.json)
   - plus the 26 carried + survey-variance. New entries worth ADDING next session:
     * eslint-9-incompatible-with-next-14-lint (pin eslint 8)
     * eager-supabase-init-breaks-envless-build (lazy-init everywhere)
     * latent-errors-accumulate-when-gate-doesnt-run (broken lint pipeline hid build breakers)
     * committed-test-credentials-via-git-add-all (session.config.json plaintext password leak)

6. **ARCHITECTURE-downstream-vs-standards.md → docs/pipeline/.** The 4 structural defects +
   the "downstream confirms, not finds" principle.

7. **design-build.yml** (already has cache-bust + bug-knowledge-first rules committed today). Add
   rules #3 and #4 above when doing the upstream pass.

8. **Validation-persist fix is LIVE** in the cockpit (committed 3b8cdef) — but UNTESTED because
   deal-findrs is TEARDOWN-locked (downstream gated). Test it the moment a product reaches RENOVATION.

9. **The on-card Merge button (Track B).** Today proved the manual merge loop (checkout branch, fix
   build errors, read CI logs, override-merge) is slow + error-prone (misplaced edit, git-add-all leak).
   The Fix-button-cell spec's on-card "build → progress → review → merge (green-gated)" flow is the
   real fix. Downstream of the gate fix, but high-value.

---

## What today actually accomplished (so it doesn't feel like only the TEARDOWN)
- Proved the pipeline mechanically works end-to-end (trigger → CI build → auth → cache → merge → redeploy).
- Ran a real autonomous standards-driven rebuild that genuinely improved the product.
- Fixed the validation-persist race + removed fake "Fix Now" (live in cockpit).
- Rotated OpenCode + sk-ant keys (long-standing carryover — DONE).
- Flushed + fixed a stack of latent build breakers in deal-findrs (eslint, missing module, orphan
  component, eager-init, lint noise) — exposing that a broken gate lets errors accumulate.
- **Proved, with hard 3-run evidence, that survey non-determinism is THE load-bearing problem.**
  That reframes the whole roadmap: a reliable gate is the precondition for the pipeline being a pipeline.

## The one-line frame for next session
"Stop asking the model to render the verdict. Make the survey OBSERVE; make deterministic rules DECIDE,
consuming the machine-checkable evidence the build already plants. Success = same input, same verdict."
