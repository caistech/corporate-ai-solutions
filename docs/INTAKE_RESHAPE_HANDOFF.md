# Claude Code handoff — build the settled intake architecture

Paste the block below into Claude Code at `C:\Users\denni\PycharmProjects\`.
All design decisions are locked (see riders). Report STEP 0 + cherry-pick decisions
before the structural changes; build-check at the end.

---

```
Build the reshaped product-intake architecture. This SUPERSEDES the
review/repurpose-selector model currently on branch
feat/entry-mode-intake-and-rescore-trigger. Read STEP 0, report cherry-picks, then
build in the stated order. Apply any migration VIA CLI and VERIFY the link == app DB
first (supabase/.temp/project-ref vs NEXT_PUBLIC_SUPABASE_URL; correct prod ref is
tfgtfhwvrswjvkyeyvsp; re-link if stale — PRODUCT_STANDARDS §9).

═══ THE MODEL (what we're building) ═══
One door, coach-for-all, deterministic gate, post-gate fork.
- ONE Product Setup page for new ideas AND deployed products. No mode selector.
  Mandatory: name + coach questions. Optional: asset fields (URL/Vercel/Supabase/
  GitHub + details) AND KB attachments (docs + URLs) to justify the market read.
  Deployed-vs-new is DERIVED from live-URL presence, never chosen.
- ONE coach = expert marketing/GTM analyst (prompt it as such). It INGESTS evidence:
  (i) live build markers when a URL is present, (ii) the operator's KB uploads. With
  a URL it audits the build into spec; with no URL it does clean-sheet elicitation.
- ONE HARD gate, DETERMINISTIC, identical for all. Fails on ABSENCE of justifying
  evidence (bare assertion → fail) and on failed build markers (reseller → P2 fail).
  The gate checks evidence PRESENCE/verifiability, NEVER quality — same finished
  answers must always yield the same verdict.
- Membership (card + manifest) granted AT THE GATE: pass → both rows; fail → neither,
  bounced to coaching.
- Post-gate fork on LIVE-URL presence: URL → audit-&-remediate (operator-fired
  naive-tester/gtm/voice buttons, NOT auto-run); no URL → design-&-build.

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

═══ RIDER 2 — GATE IS DETERMINISTIC + IDENTICAL FOR ALL ═══
HARD-fail BLOCKS — no leniency for deployed products, no "audit lane for failures."
The gate measures evidence PRESENCE deterministically: every gate-claim needs a
verifiable backing source (user-uploaded KB OR a referenceable source) — bare
assertion fails. Build markers read deterministically (deal-findrs reseller → P2
fail → product fails the gate, bounced to coaching). The coach (expert analyst) may
JUDGE quality to GUIDE the operator, but that judgment must NEVER be the gate verdict
— re-running the gate on identical inputs must not disagree. (This is the anti-flake
invariant; do not re-introduce LLM-judge scoring at the gate.)

═══ RIDER 3 — ONE SHARED LIVE-DERIVE HELPER ═══
Factor deriveFieldsFromLiveUrl(baseUrl) → { evidence(14), preHard(P1/P2/P3), report }
from survey/route.ts:92-141, wrapping deriveSurveyFromDom. BOTH the coach (pre-gate,
live-URL intake) AND the existing post-gate survey route call the SAME helper — not
two copies. Refactor must be behaviour-preserving for the survey route (verify before
coach wiring).

═══ BUILD ORDER ═══
a. Factor deriveFieldsFromLiveUrl; repoint survey/route.ts at it; verify unchanged.
b. Coach two-mode input (new-ideas/route.ts): live URL present → call the helper,
   inject derived 14 + P1/P2/P3 as evidence the coach assesses; also ingest KB
   (read uploaded docs / fetch URL refs) as evidence for the market-read claims.
   No URL → clean-sheet elicitation.
c. onboarding-coach/SKILL.md: (i) prompt as expert marketing/GTM analyst guiding a
   high-probability success process; (ii) live-surface branch — audit the build's
   markers into spec, flag comply-vs-fail; (iii) demand evidence for market claims,
   pushing the operator until each gate-claim has a verifiable source. The coach
   guides via judgment; the gate verdict stays presence-deterministic.
d. Product Setup page (OnboardingCoach.tsx): drop the selector; render name + coach
   questions + optional asset fields (URL/Vercel/Supabase/GitHub) + KB attachments
   (doc upload → Supabase Storage; URL refs → strings). Derive deployed-vs-new from
   URL-presence.
e. Move membership (card Z + manifest Y) to the gate (admit/route.ts): granted ONLY
   on gate-pass, for new AND deployed. Gate-fail → no card, no manifest. (Remove the
   at-review-submit Z+Y that's being dropped with the selector.)
f. Post-gate card fork (ProductDetailView): live URL present → expose audit buttons
   (naive-tester/gtm/voice over the live URL → gap list); no URL → design-&-build.

═══ KB SPECIFICS ═══
- Docs → Supabase Storage (reuse existing bucket/pattern if STEP 0 found one; else
  create one, RLS-appropriate). URLs → reference strings on the product row.
- Coach INGESTS them (reads docs / fetches URLs) as evidence for the gate-claims —
  not store-only.
- KB backs the PRESENCE check: a market claim with an attached/referenced source can
  pass the presence-gate; the same claim with nothing fails. Quality of the evidence
  is the coach's guidance concern, not the gate's verdict.

═══ OUTPUT ═══
STEP 0 findings + cherry-pick list first. Then build a→f. Report files touched, any
migration/bucket added, and CONFIRM: (1) membership-follows-gate (fail → no card/
manifest), (2) the gate verdict is presence-deterministic (identical inputs → identical
verdict), (3) one shared deriveFieldsFromLiveUrl with two callers. Build-check before done.
```

---

## After CC reports, verify these three (they're the invariants that matter)

1. **Membership-follows-gate** — a gate-*fail* leaves NO card and NO manifest row
   (product not in portfolio); a gate-*pass* creates both. This is the heart of
   "comply or stay out."
2. **Gate determinism** — could two runs of the gate on the *same finished answers*
   ever disagree? Must be no. If CC wired any LLM-judgment into the verdict, that's
   the regression — it belongs in the coach, not the gate.
3. **One helper, two callers** — the coach's live-derive and the post-gate survey
   read the same `deriveFieldsFromLiveUrl`, so they can't drift on what the build emits.

## Known follow-on (not this build)
- deal-findrs fails P2 at the gate today (`data-distributor="reseller"`). Fixing its
  distributor marker is real product work, separate from this wiring.
- The C6 re-score trigger (track two, in `CYCLE_CLOSE_BUILD_SPEC.md`) is still the
  next loop-closing build after intake is reshaped. Its STEP 0 question — is P2/P3's
  marker-grep headless-re-runnable — decides whether deal-findrs reaches GO autonomously.
