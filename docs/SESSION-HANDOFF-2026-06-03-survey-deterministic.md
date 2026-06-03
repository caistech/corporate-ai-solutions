# SESSION HANDOFF — 2026-06-03 (survey variance KILLED — gate is now deterministic)

## TL;DR — the load-bearing problem from last session is solved
- Last session's #1 finding: the survey gate was non-deterministic (deal-findrs scored 12/14 →
  10/14 → 9/14 across three identical runs, with an intra-run P2 self-contradiction). The gate was
  measuring the model's mood, not the product.
- **This session: removed the model from the survey entirely.** The survey is now a deterministic
  DOM-marker grep — no LLM in the path. **Proven: 3 identical runs → TEARDOWN / TEARDOWN / TEARDOWN.**
  The 12/10/9 flip is dead.
- The verdict is TEARDOWN because deal-findrs still carries the OLD lazy marker
  `data-icp-partner-type="reseller"` — `reseller` is now banlisted (generic), so P2 fails
  deterministically. **Correct behaviour, not a regression.** RENOVATION needs one design-build run
  to replant markers with NAMED values (see runway below).

## The architecture (what changed and why)
The old survey was "an LLM that reads the site AND emits the verdict" — it both found evidence and
judged whether it counted, non-deterministically. Two independent LLM judgments over the same DOM
(the 14-field pass and P1–P4) were *allowed* to contradict each other — that's the self-contradiction.

The fix, per "generator owns invariants" + "hard, but legible":
- **Build PLANTS machine-checkable `data-*` markers** for all 14 fields, generated from the product
  card (_spec.json), so marker value and visible copy are two renderings of ONE source — they can't
  drift. A generic/off-enum value THROWS at `next build` (coherence enforced before a PR can open).
- **Survey GREPS the markers and DERIVES the verdict** in plain code. P2/P3 are derived FROM the
  field results (P2 *is* the distributor field check), so they can no longer contradict them. No
  model anywhere. Same DOM ⇒ same verdict, structurally.

## The loop — five files, all committed + live
1. **`SURVEY_MARKER_CONTRACT.md`** — the shared spec both sides implement against (marker table,
   value classes PRESENCE/NAMED/ENUM, banlist, P2/P3 derivation, route manifest, coherence-by-construction).
2. **`cais-build-template-v2/lib/surveyMarkers.ts`** (shared-services, commit `dc2190e`) — build-side
   helper. `markerProps(field, cardValue)` returns spreadable `data-*` props; THROWS on banlisted
   NAMED values or off-enum stage. `surveyManifest(routes)` builds `public/survey-manifest.json`.
3. **`.github/workflows/design-build.yml`** (shared-services, `dc2190e`) — added 4 HARD RULES: plant
   all 14 markers via the helper, named-archetype values only, core_mechanism marker on the live
   working surface, emit the manifest.
4. **`src/lib/methodology/survey-markers.ts`** (cockpit, commit `41052c6`) — pure deriver:
   `deriveSurveyFromDom({doms, rootOk})` → `{evidence, preHard}` in the exact shape `survey.ts`
   consumes. Banlist + enum identical to the build helper (both trace to the contract).
5. **`src/app/api/admin/pipeline/[productId]/survey/route.ts`** (cockpit, `41052c6`) — rewritten:
   fetches `/survey-manifest.json` → fetches each route's DOM → greps markers via the deriver →
   `loadCardSurvey(slug, {evidence, preHard})` (UNCHANGED) → `survey.ts` (UNCHANGED) → records gate.
   The LLM/survey.json dependency is gone.
   **+ kickoff** `…/survey/kickoff/route.ts` (cockpit, commit `daa8ab1`) — now a thin same-origin
   proxy to /survey (no GitHub dispatch). Button → kickoff → deterministic survey, verdict in ~2s.

`survey.ts` and `loadCardSurvey` were NOT changed — only the source of `evidence`+`preHard` changed.

## Retired (dead once the kickoff repointed — now done)
- `survey.yml` (the OpenCode survey workflow) — nothing calls it. Delete when convenient.
- `SURVEY_MODE.md` (naive-tester skill) — obsolete; its DealFindrs calibration was already stale.
- OpenCode survey auth/model wiring in the survey path.
- **Vercel env:** only `SURVEY_WORKFLOW_FILE` is truly dead. **KEEP** `GH_DISPATCH_TOKEN`,
  `GH_SHARED_REPO`, and `SURVEY_WORKFLOW_REF` — design-build/kickoff still uses all three
  (note: design-build reuses the misnamed `SURVEY_WORKFLOW_REF` as its branch ref — rename to a
  neutral `WORKFLOW_REF` someday, not urgent).

## RUNWAY — drive deal-findrs to RENOVATION (next session #1)

**STATUS at session end: a SECOND design-build run is IN FLIGHT** (re-dispatched after fixing the
card — see "What the first dispatch taught us"). First action next session: check the GitHub Actions
run / its PR. If a clean PR exists, verify the diff + merge + re-survey. If it failed, the audit below
is the map.

### What the first dispatch taught us (run → error → fix → re-run)
The first dispatch was fired BEFORE inspecting the card spec — and the spec dump exposed two real
problems, one of them a genuine finding:
- **CARD-FIELD DRIFT (the real lesson): the card's `icp_partner_type` literally held `"reseller"`** —
  the generic category word, NOT the named archetype — even though the page COPY said "buyers' agent
  firm". The old LLM survey masked this by reading the nicer copy; the deterministic marker grep
  exposed it, because the build plants the marker from the CARD FIELD, not the copy. **This is exactly
  the drift the marker contract is designed to catch.** Lesson: NAMED card fields must hold the
  archetype, and the gate now surfaces card↔copy disagreement instead of hiding it.
- **`icp_stage` was `"Operating businesses"` (plural)** → slugifies to `operating-businesses` →
  off-enum → `markerProps` throws at `next build` (gotcha #2, confirmed live).
- **FIXED via PATCH** to `…/[productId]/validation` (NOT the base `[productId]` route — that's GET-only
  and 405s on PATCH). The validation route is `export async function PATCH`, partial update, safe for
  individual fields:
  ```powershell
  $body = @{ icp_stage = "operating business"; icp_partner_type = "buyers agent firm" } | ConvertTo-Json
  Invoke-RestMethod -Method PATCH -Uri ".../api/admin/pipeline/deal-findrs/validation" -ContentType "application/json" -Body $body
  ```
  Read back confirmed: `icp_stage="operating business"`, `icp_partner_type="buyers agent firm"`. Both
  now slug clean (`operating-business` on-enum, `buyers-agent-firm` not banlisted). Re-dispatched.
- **`distributor` card field is a LIST** ("Property firms, buyers' agents, real estate agencies, and
  development promoters…") — not banlisted (so won't throw), but a vague multi-audience value. Watch
  whether the planted `data-distributor` reads sensibly; may want to tighten to a single archetype.

A design-build run was DISPATCHED (workflow on main, marker rules live). If it produced a clean PR,
just verify the diff + merge + re-survey. If it failed or regressed, the audit below is the map.

### The audit (deal-findrs page.tsx / partners/page.tsx / reports/page.tsx, as of this session)
- **Only 2 of 14 fields are actually MARKED** today: `data-icp-partner-type="reseller"` and
  `data-exclusions="…"` (on both page.tsx and partners/page.tsx). `reports/page.tsx` has ZERO markers
  even though it IS the `core_mechanism` surface (the RAG→QS→Valuation→Feasibility→Pack pipeline).
- **The other 12 fields exist only as HTML comments or prose** — not grep-visible. That's why the
  deterministic survey scores ~1/14 → TEARDOWN. It's a MARKER gap, not a content gap.
- **KEY: the copy is already RENOVATION-grade.** All 14 are stated coherently in visible text — named
  distributor (buyers' agent firm), named end-user (property developer), distinct surfaces, geography,
  size, stage, exclusions, the pipeline. So a full destructive rebuild RISKS REGRESSING good pages.

### Prompt refinement (add to the design-build run so it doesn't rewrite good copy)
Add to the dispatch/prompt: *"Where a field is ALREADY stated in existing copy, do NOT rewrite it —
spread `markerProps` onto the element that already states it. Only author NEW content for fields
genuinely absent from the page."* This turns a risky full-rebuild into a low-risk marker-pass and
isolates the one true content gap (why-now, below).

### Two gotchas that WILL bite the run if not pre-empted
1. **`why_now` content is genuinely missing.** No "why this problem, why now" statement exists on any
   page. P3 requires `data-why-now`. This is the ONE field needing NEW content, not just a marker —
   without it P3 fails even after perfect marker-planting.
2. **`icp_stage` enum mismatch → build THROWS. (FIXED this session — card patched to "operating
   business".)** Left as a pattern: any NAMED/ENUM card field that slugs off-set throws at build.
   Check card values against the enum/banlist before dispatching.

### Manifest requirement
No `public/survey-manifest.json` exists today, so the survey falls back to `/` ONLY — it never sees the
`/partners` markers (where the distributor copy lives). The run MUST emit the manifest listing
`/`, `/partners`, `/reports`. Without it, distributor/end_user fields stay invisible → P2/P3 fail.

### Steps
1. **Verify the dispatched PR** (or re-run with the refinement above). Diff must show: `markerProps`
   spread onto existing elements, `data-icp-partner-type` = a NAMED value (NOT `reseller`),
   `data-why-now` present (new copy), `public/survey-manifest.json` listing the 3 routes. Don't merge
   on sight — eyeball the diff.
2. **Merge → deploy → re-survey 3×** — expect identical RENOVATION with margin. Calibration fixture #2 green.
3. This also finally exercises the **validation-persist fix** (live in cockpit, commit 3b8cdef, but
   untested because deal-findrs was TEARDOWN-locked).
4. **Only after a RENOVATION run is 10/10** → flip to auto (per #2 staging). TEARDOWN-determinism (proven
   this session) proves the GATE is stable; RENOVATION-determinism proves the whole LOOP is. The latter
   is the real precondition for the auto-flip.

## NEXT SESSION #2 — Card UX: the card IS the cockpit

The card today is only the base scaffold — this is a build-out, not a refactor (no existing card
component to design against). Guiding principle: **a human runs the entire pipeline from the card,
top to bottom, in order, never leaving it, never guessing.** "Hard, but legible" applied to UI.

**a) Linear flow; reruns are SEPARATE buttons.**
   - Stages laid out in execution order top-to-bottom; a human just works down the line.
   - A rerun of any stage is its OWN distinct, named button in the flow — never a button that mutates
     in place. "Run survey" and "Re-run survey" coexist; history stays legible.

**b) Live progress on EVERY action.**
   - Spinner / progress bar + a "running now…" note on every button while it works (survey,
     design-build, merge, deploy-check — all of them). No action ever looks idle while working.

**c) Every dead-end states the exit.**
   - A failed stage never shows bare "failed" — it shows the way out (reset this stage / start again /
     what to fix). No stuck state without an instruction.

**d) Zero-leave.**
   - Everything the human needs to check surfaces ON the card: verdict, per-field evidence, PR link,
     deploy status, marker grep trace. No bouncing to Vercel / GitHub / DB.

**Wiring already available (use it):** the survey route returns `survey.report` — the per-field marker
grep (which of 14 evidenced, which failed and WHY, e.g. `reseller — generic value (banlist)`) plus
`manifest_ok` + `routes_fetched`. That block drives (c) and (d) directly — render WHY a TEARDOWN
happened + what to fix, no model, no extra call. Also `result.toReach` (from survey.ts) lists exactly
what's needed to reach RENOVATION — feed it into the card.

**Manual → auto staging (the endpoint):**
   - NOW: manual-first. Every stage a button; human drives the order.
   - WHEN proven 10/10: flip to auto-advance — survey → on TEARDOWN auto-dispatch design-build → on
     merge auto-re-survey → … — with the manual buttons remaining as override.
   - **DECIDED: keep ONE human gate at the final merge.** Everything else chains automatically; the
     merge (the one near-irreversible step) always waits for a human click, even in "automatic" mode.

**Concrete first tasks (observed on the live RENOVATION card 2026-06-03 — start here):**
1. **Step 3 copy is stale.** It still reads "Runs the naive-tester survey headless in CI… Takes ~3–4
   min" and offers "Run it manually (copy into Claude Code / OpenCode)". Both are dead — the survey is
   now in-process (~2s, no CI, no model). Update the copy to reflect the deterministic in-app survey
   and remove the manual-OpenCode affordance. (This is principle (c)/(d): the card must tell the truth
   about what its buttons do.)
2. **Survey-gate vs validation-score legibility.** The card shows RENOVATION (Step 3) at the top while
   Step 7 shows "Weighted score 0%, 2 actions needed". Both are CORRECT — they're different gates
   (Step 3 = does the live build evidence the spec; Steps 5–7 = has the validation pipeline been run +
   scored ≥80%) — but the card doesn't make the relationship legible, so a human sees "RENOVATION!" and
   "0%, not ready" and can't tell which governs. Make the two gates' relationship explicit on the card
   (e.g. "build evidences spec ✓ → now run validation tests to reach outreach readiness"). Not a bug;
   a clarity gap the UX build-out should close.

## Open decision carried forward
- **PR-time presence lint** (offered, not built). `markerProps` guarantees VALUE validity (throws on
  generic/off-enum) but not that the agent CALLED it for all 14. A lazy agent could plant 11 → the
  survey deterministically scores 11/14 → TEARDOWN (correct, but caught post-deploy). A ~30-line
  `scripts/lint-survey-markers.mjs` greppping the built source for all 14 `markerProps('<field>'`
  call-sites + the manifest would fail it at PR instead. Optional — the survey already catches it.

## Still-open from prior sessions (unchanged, lower priority)
- Scorer reconciliation: point `recalculate-score` → `loadCardScore`; shelve SQL `compute_readiness`.
- `icp_partner_type` rename (~57 refs) — still deferred; alias recorded.
- `contracts.ts` in InvestorPilot — dead code, delete/stub.
- On-card Merge button (Track B); deal-findrs cleanup (share_tokens migration 008, SERVICE_ROLE_KEY
  "Needs Attention", rotate QA test-user pw, CodeRabbit RLS non-blockers).
- Upstream promote-pass still staged/uncommitted: eslint 8 (pinned) + .eslintrc into template, lazy
  Supabase init standard, extend new-table typing rule to READS, overwrite bug-knowledge.json (27+4),
  ARCHITECTURE-downstream-vs-standards.md → docs/pipeline/.
- **NEW bug-knowledge entries from this session** (in `bug-knowledge-survey-session-entries.json`,
  merge into the repo `bug-knowledge.json`): `card-named-field-holds-generic-not-archetype`,
  `icp-stage-or-named-value-off-enum-throws-next-build`, `validation-patch-on-base-productId-route-405`,
  `survey-falls-back-to-root-only-without-manifest`.

## One-line frame
"The survey OBSERVES via markers the build plants from the card; deterministic code DECIDES.
Proven: same input, same verdict (3× TEARDOWN). Next: one design-build run → RENOVATION."
