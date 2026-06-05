# Claude Code handoff — build the settled intake architecture

Paste the block below into Claude Code at `C:\Users\denni\PycharmProjects\`.
All design decisions are locked (see riders). Report STEP 0 + cherry-pick decisions
before the structural changes; build-check at the end.

> **STAGED — this handoff is PR1 only.** PR1 = determinism core (~6 files): one door,
> coach two-mode, the gate (re-derive pinned to a deployment + presence checks + atomic
> membership), drop the selector. **PR2 (separate, later)** = KB-upload subsystem
> (Supabase Storage bucket + doc/URL ingest) and the post-gate audit-button fork in
> ProductDetailView, plus the expert-analyst persona prompt.
>
> **Honest-scope rule (do not over-claim):** PR1's gate enforces **URL-derived build
> markers + field presence**. It does **NOT** yet enforce "bare assertion → fail" for
> NO-URL products — that needs the KB evidence source, which is PR2. So in PR1, no-URL
> products still pass on coach-typed answers (same as today). Do NOT label the
> "evidence-teeth" invariant as met in PR1 commit messages/docs — it lands in PR2.
> PR1's honest invariants: (#1) membership-follows-gate, (#2) gate determinism **for
> URL products, pinned to a deployment**.

---

```
Build PR1 of the reshaped product-intake architecture (determinism core only — KB
uploads + post-gate fork + persona are PR2). This SUPERSEDES the
review/repurpose-selector model currently on branch
feat/entry-mode-intake-and-rescore-trigger. Read STEP 0, report cherry-picks, then
build in the stated order. Apply any migration VIA CLI and VERIFY the link == app DB
first (supabase/.temp/project-ref vs NEXT_PUBLIC_SUPABASE_URL; correct prod ref is
tfgtfhwvrswjvkyeyvsp; re-link if stale — PRODUCT_STANDARDS §9).

═══ THE MODEL (what we're building) ═══
One door, coach-for-all, deterministic gate, post-gate fork.
- ONE Product Setup page for new ideas AND deployed products. No mode selector.
  Mandatory: name + coach questions. Optional: asset fields (URL/Vercel/Supabase/
  GitHub + details). [KB attachments = PR2.] Deployed-vs-new is DERIVED from live-URL
  presence, never chosen.
- ONE coach = two-mode. URL present → audit the build into spec: AUTO-PREFILL the 14
  fields from the derive, then have the operator CONFIRM/correct — do NOT re-elicit
  from blank (re-asking what the build already answers is a UX regression, finding #8).
  No URL → clean-sheet conversational elicitation. [Expert-analyst persona prompt = PR2.]
- ONE HARD gate, DETERMINISTIC, identical for all. PR1 enforces: field presence +
  URL-derived build markers (reseller → P2 fail). The gate's build-marker derivation
  is PINNED TO A DEPLOYMENT (see Rider 2) so the verdict can't drift as the live DOM
  changes. [NO-URL "bare assertion → fail" evidence-teeth = PR2/KB — do NOT claim it
  in PR1.]
- Membership (card + manifest) granted AT THE GATE, ATOMICALLY: pass → both rows;
  fail → neither, bounced to coaching.
- Post-gate fork on LIVE-URL presence = PR2.

═══ STEP 0 — REPORT BEFORE CODING ═══
Confirm (mostly known from prior recon, verify quickly):
- deriveSurveyFromDom + the survey route's fetch/manifest/derive at
  survey/route.ts:92-141 — confirm it's factorable into a shared helper.
- new-ideas/route.ts is conversational-only (no live-surface mode) — confirm.
- new-ideas/admit/route.ts is the single gate — confirm it's where membership should move.
- Supabase Storage: is there an existing bucket/pattern for doc uploads, or new?
Report findings + the cherry-pick list (next section) before structural changes.

═══ RIDER 1 — CLEAN BRANCH ═══
Cut a NEW branch from main (NOT from feat/entry-mode-intake-and-rescore-trigger).
KEEP (cherry-pick): portfolio_manifest migration (20260605120000) +
src/lib/portfolio-manifest.ts; the identifier COLUMNS migration (columns stay);
src/lib/methodology/upsert-card.ts; the /rescore keystone + freshness.ts.
DROP: the review/repurpose SELECTOR, review-skips-coach routing, Z+Y-at-review-submit,
the repurpose placeholder UI. Report what you kept vs dropped.

═══ RIDER 2 — GATE: DETERMINISTIC, IDENTICAL, DEPLOYMENT-PINNED ═══
HARD-fail BLOCKS — no leniency for deployed products, no "audit lane for failures."
PR1 gate enforces: field PRESENCE (existing presence checks at admit/route.ts:86-113)
+ URL-derived build markers (deal-findrs reseller → P2 fail → bounced to coaching).
**DEPLOYMENT-PINNED (finding #2 — critical):** the live DOM is mutable (survey route
is no-store), so "identical answers → identical verdict" is FALSE across time unless
the gate's marker derivation is pinned to a SPECIFIC deployment. Bind the gate's
re-derive to a deployment_id (the survey route already threads one). Invariant #2 is
then true as "identical DOM/deployment + answers → identical verdict" — NOT "identical
across all time." State it that way; don't over-claim.
The coach may JUDGE quality to GUIDE the operator, but that judgment must NEVER be the
gate verdict (anti-flake; do not re-introduce LLM-judge scoring at the gate).
**SCOPE HONESTY:** PR1 does NOT enforce "bare assertion → fail" for NO-URL products —
that needs the KB evidence source (PR2). In PR1, no-URL products pass on coach-typed
answers, same as today. Do NOT claim the evidence-teeth invariant in PR1.

═══ RIDER 3 — ONE SHARED LIVE-DERIVE HELPER, THREE CALLERS ═══
Factor deriveFieldsFromLiveUrl(baseUrl) → { evidence(14), preHard(P1/P2/P3), report }
from survey/route.ts:92-141, wrapping deriveSurveyFromDom. It has THREE callers, all
reading the SAME helper — not copies:
  1. the coach (pre-gate, live-URL intake — guidance/evidence),
  2. the GATE (admit/route.ts) — for a URL-present product the gate RE-DERIVES from
     the live URL ITSELF and gates on the freshly-derived P1/P2/P3. The gate is
     server-authoritative: it must NOT trust derived markers passed through the
     client/coach payload (client-passed gate inputs can be stale or forged — that
     would route tamperable, LLM-adjacent data into the verdict and break the
     determinism invariant). Re-deriving makes identical live URL → identical verdict
     by construction. (The helper is a few cheap in-process fetches; the cost is
     negligible and worth the tamper-proofing.)
  3. the existing post-gate survey route.
Refactor must be behaviour-preserving for the survey route (verify before coach wiring).
Do NOT collapse the gate's deployed-check into the survey route (that couples admit
timing to the survey route's gate-recording side effects → double-record risk). The
gate re-derives for its OWN verdict; the survey route stays separate.

═══ RIDER 4 — ATOMIC MEMBERSHIP AT THE GATE (invariant #1) ═══
On gate-PASS, admit does three writes: flip is_draft=false + upsertMethodologyCard (Z)
+ upsertPortfolioManifest (Y). Sequential non-transactional writes can tear on a crash
(admitted+card but no manifest → "admitted but invisible"). Wrap the three DB writes in
ONE Postgres function admit_product(slug, ...) (RPC) so they commit-or-rollback together.
**Do NOT duplicate the upsert logic:** the RPC must be the single path for these writes,
OR the existing TS helpers (upsertMethodologyCard/upsertPortfolioManifest) must call the
RPC, so there is still ONE source of truth for what those writes do — not a drifting SQL
copy beside the TS copy. (The RPC wraps the 3 DB writes only; it canNOT wrap the live
fetch — Postgres can't fetch URLs. The re-derive happens in the route BEFORE the RPC;
the RPC takes the verdict + refs as args. — finding #5.)

═══ RIDER 5 — FIX THE TEST HARNESS FIRST (IRON regression rule) ═══
Before factoring anything: the route test suite (routes.test.ts) is RED at import —
readiness-results.ts:13 does module-level createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!)
which throws with no test env → 0 tests collected. Rider 3 requires "behaviour-preserving,
verify unchanged" — but there's NO green baseline to verify against. So STEP 0 of the
build is: (i) make import not crash (stub env via vitest setupFiles, OR lazy-init the
Supabase client in readiness-results.ts), (ii) rewrite the survey tests to the CURRENT
deterministic DOM-fetch contract (route takes {url, deployment_id}, fetches DOM text;
assert derive against known marker DOM). GREEN baseline FIRST, then factor, then confirm
still-green. (Note: survey.test.ts (pure) is green; the RED one is routes.test.ts — finding #7.)
Then add the invariant/regression tests: helper output == old survey:92-141 output;
gate PASS→RPC writes all 3, FAIL→zero writes (invariant #1); gate reseller→P2 fail
(invariant #2); gate determinism (same answers + same deployment_id → same verdict, run twice).

═══ RIDER 6 — SHARED VALIDATOR (DRY) ═══
The identifier-validation logic (urlResolves, repoExists, the regexes,
validateReviewIdentifiers) lives in create/route.ts:37-98 today. In the one-door model,
create STOPS validating (just captures); validation moves to the GATE. Do NOT copy-paste
it into admit — extract to ONE shared module (src/lib/methodology/identifier-validation.ts),
or fold the live-probe parts into deriveFieldsFromLiveUrl (the gate re-derives anyway; a
dead URL shows up as P1 fail). admit imports it; create no longer needs it. One definition
of "is this a valid live build."

═══ RIDER 7 — DELETE DEAD CODE BEFORE FACTORING ═══
survey-markers.ts lines 1-185 are a fully-duplicated commented-out copy of the module
(corrupted /!** markers). CLAUDE.md bans commented-out code; it's in the exact file Rider 3
factors from, in the determinism-critical path. DELETE lines 1-185 as the first step
(make-the-change-easy), so the factor extracts from a clean single-copy file. Zero behaviour
change (it's all inside a comment).

═══ FOLDED FINDINGS — also in PR1 ═══
- **#3 admit must carry identifiers to the manifest write.** admit's payload has no
  identifier fields, but Y (manifest) needs vercel_project/supabase_ref. admit must
  SELECT them from product_validation_status before the RPC, and pass them in. Otherwise
  the manifest row writes nulls.
- **#4 BACKFILL old admissions.** Products admitted under the OLD path have is_draft=false
  but NO card and NO manifest → they'd render broken once membership-follows-gate ships
  (the new admit only grants Z/Y on NEW admissions). Add a one-shot backfill: for every
  already-admitted product lacking a card/manifest row, create them. (This is the same
  "membership was backfilled, not pipeline-produced" pattern hit 3× this session — seed
  cards, hardcoded manifest, now old admissions. Reconcile on any membership-grant change.)
- **#8 deployed products PREFILL, don't re-elicit** (in coach two-mode, build order b):
  a URL-present product auto-prefills its 14 fields from the derive for the operator to
  CONFIRM/correct — it does NOT walk the full 7-node conversational elicitation as if blank.

═══ BUILD ORDER (PR1) ═══
0. FIX THE HARNESS FIRST (Rider 5): make routes.test.ts import without crashing, rewrite
   survey tests to the current DOM-fetch contract → GREEN baseline before any refactor.
1. DELETE survey-markers.ts dead block lines 1-185 (Rider 7).
a. Factor deriveFieldsFromLiveUrl; repoint survey/route.ts at it; verify still-green.
b. Coach two-mode input (new-ideas/route.ts): live URL present → call the helper,
   AUTO-PREFILL the 14 + P1/P2/P3 for operator confirm/correct (do NOT re-elicit from
   blank — finding #8). No URL → clean-sheet conversational elicitation.
   [Expert-analyst PERSONA prompt + KB ingest = PR2 — not now.]
c. Product Setup page (OnboardingCoach.tsx): drop the selector + repurpose UI; render
   name + coach questions + optional asset fields (URL/Vercel/Supabase/GitHub). Derive
   deployed-vs-new from URL-presence. [KB attachment UI = PR2.]
d. Extract the shared identifier-validator (Rider 6); create/route.ts stops validating
   (captures only, entry_mode derived from URL presence, NO Z/Y); admit imports it.
e. The GATE (admit/route.ts): presence checks (existing) + for URL-present products,
   RE-DERIVE markers pinned to a deployment_id (Riders 2, 3) → P2 reseller fails. admit
   SELECTs the identifiers from product_validation_status (finding #3) before writing.
   On PASS → admit_product RPC writes flip+Z+Y atomically (Rider 4). On FAIL → zero writes.
f. BACKFILL (finding #4): one-shot — every already-admitted product lacking card/manifest
   gets them, so existing portfolio doesn't render broken under the new membership rule.

[PR2, separate: KB-upload subsystem (Storage bucket + doc/URL ingest + no-URL evidence
teeth), expert-analyst persona prompt, post-gate audit-button fork in ProductDetailView.]

═══ OUTPUT ═══
STEP 0 findings + cherry-pick list first. Then build 0→f. Report files touched, the
migration(s)/RPC added, the backfill result, and CONFIRM:
(1) membership-follows-gate — gate-FAIL leaves NO card/manifest, gate-PASS writes both
    atomically via the RPC (test: PASS→3 rows, FAIL→zero);
(2) gate determinism — same answers + same deployment_id → same verdict (test: run twice);
    state it as deployment-pinned, NOT "across all time"; do NOT claim no-URL evidence-teeth;
(3) one shared deriveFieldsFromLiveUrl with THREE callers (coach, gate re-derive, survey);
(4) green test baseline restored before the factor, still green after.
Build-check before done.
```

---

## After CC reports, verify these (the invariants + the folded-finding closures)

1. **Membership-follows-gate (atomic)** — a gate-*fail* leaves NO card and NO manifest
   (not in portfolio); a gate-*pass* writes both, **via the RPC so a crash can't tear
   them**. The heart of "comply or stay out."
2. **Gate determinism — deployment-pinned** — same answers + same `deployment_id` →
   same verdict. NOT claimed "across all time" (the DOM is mutable; pinning is what makes
   it true). If any LLM-judgment reached the verdict, that's the regression — it belongs
   in the coach, not the gate.
3. **One helper, THREE callers** — the coach's live-derive, the **gate's
   server-side re-derive** (admit re-derives from the live URL itself; it must NOT
   trust client/coach-passed markers — that's the tamper/flake hole), and the
   post-gate survey all read the same `deriveFieldsFromLiveUrl`. The gate re-deriving
   server-side (not trusting passed markers) + **pinning to a deployment_id** is what
   makes invariant #2 hold — identical deployment + answers → identical verdict.
   (Server-authoritative against forgery; deployment-pinned against DOM drift over time.)

## Known follow-on (not PR1)
- **PR2** (separate): KB-upload subsystem (Supabase Storage bucket + doc/URL ingest +
  the no-URL "bare assertion → fail" evidence-teeth), the expert-analyst persona prompt,
  and the post-gate audit-button fork in ProductDetailView. Until PR2, no-URL products
  pass on coach-typed answers — do not claim otherwise.
- deal-findrs fails P2 at the gate today (`data-distributor="reseller"`). Fixing its
  distributor marker is real product work, separate from this wiring.
- The C6 re-score trigger (track two, in `CYCLE_CLOSE_BUILD_SPEC.md`) is still the
  next loop-closing build after intake is reshaped. Its STEP 0 question — is P2/P3's
  marker-grep headless-re-runnable — decides whether deal-findrs reaches GO autonomously.
