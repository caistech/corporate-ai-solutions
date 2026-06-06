# Voice Coach — Architecture Plan

**Goal:** Replace the typed onboarding coach with a human-coaching experience — an ElevenLabs
conversational voice agent fronted by the `female_avatar.jpeg` "coach", with realtime transcript
scrolling beneath the avatar, persistent cross-session memory via the Kira loop, and the **same
deterministic admit hardgate** at the end. Voice-first; text input stays as the no-mic fallback.

**Non-negotiable invariant:** the admit gate is byte-for-byte unchanged — same 14-field +
feasibility schema, same `admit_product()` RPC, same 422 blockers, same client-passes-`fields`
input contract (`admit/route.ts`). The voice walk must hand admit the *exact same payload* the text
coach produces today.

**Scope (eng-review):** all-in — the persistent-memory loop ships in v1.

> ### ⚠️ Reality correction (adversarial review, 2026-06-06) — read before building
> The first draft assumed seams that do **not** exist in the code. Corrected here:
> 1. **There is no existing field-writer to "refactor."** The turn API (`new-ideas/route.ts`) is
>    conversation-only — it writes nothing. Fields are written **once, only in the admit gate**.
>    `applyCoachFields()` is **net-new** code, and it becomes the **sole live writer** of
>    `product_validation_status`; admit's input contract stays unchanged (it still receives `fields`
>    — we now read them from the row save_field populated, §3). One writer, invariant preserved.
> 2. **`save_field` / `get_card_state` are NOT extensions of `createConvaiWebhookRoutes`.** That
>    factory exposes a fixed 6-handler set; the agent tool catalog is fixed to 5. Our two tools are
>    **hand-built package-external Next.js routes** carrying **their own** HMAC verify + slug
>    binding. The package's `resolveSession`/HMAC covers **only** `startConversation` + `post_call`.
> 3. **The identity token is ours, not the package's.** `mintAnonSessionToken` emits
>    `{sid, agentId, exp}` (no user_id/slug) and rides the **anon path that is TTL-purged at 24h** —
>    fatal to persistent memory. We mint our **own** `{user_id, slug, exp}` token and use the
>    **authed** identity (`user_id = operator auth.uid()`) so memory is non-anon and survives.
> 4. **`extractFromTranscript()` is a net-new free-text extractor**, not a refactor of the
>    fenced-block regex (`extractAdmitPayload`). The regression test guards the *untouched* typed
>    path; the new extractor's risk is carried by the EVAL (§8), not the regression.

---

## 0. What exists today (do NOT rebuild)

- **Text coach** — `src/components/admin/OnboardingCoach.tsx` at `/admin/pipeline/new-ideas`.
  Turn-by-turn LLM driven by `src/skills/onboarding-coach/SKILL.md` (7-node walk). Emits a fenced
  ` ```admit {…} ``` ` block when the walk completes.
- **Coach turn API** — `POST /api/admin/pipeline/new-ideas`. **Conversation ONLY — writes nothing
  to the DB.** Calls the LLM, parses the fenced block via `extractAdmitPayload` (regex), returns
  `{message, state, readiness}`. The readiness in the response is computed from the in-memory
  payload, not the DB.
- **Admit gate** — `POST /api/admin/pipeline/new-ideas/admit`. **The only field-writer today.**
  Receives `fields` from the client, validates 14 graded fields + `proof_of_demand` + `demand_tier`
  + `distributor_benefit_mode`, writes `product_validation_status`, then `admit_product()` RPC
  (atomic is_draft flip + card + manifest). Fail → 422 blockers, zero writes. **GATE LOGIC + RPC +
  input contract UNCHANGED.**
- **Kira voice loop** — `@caistech/elevenlabs-convai`: `provisionVoiceAgent()`,
  `bindWorkspaceWebhook()`, `setAllowlist()`, `createConvaiWebhookRoutes()` (fixed handler set:
  `startConversation, saveMessage, updateTopic, recallMemory, saveMemory, postCall`), `convai_*`
  tables, HMAC, `migration.sql`. Reference UI: `kira/app/chat/[agentId]/page.tsx`
  (`@elevenlabs/react` `useConversation()` + avatar + transcript via `onMessage`).
- **Memory standard** — `cais-shared-services/VOICE_MEMORY_STANDARD.md`.

```
ARCHITECTURE (corrected)

  Authed browser (/admin/pipeline/new-ideas)
    │  server component mints OUR HMAC token {user_id=auth.uid(), slug, exp}
    │  + computes minimal resume trigger {returning, last_node}
    ▼
  VoiceCoach.tsx  ──useConversation()──►  ElevenLabs agent (Morgan, SKILL.md + voice preamble)
    │  onMessage → transcript scroll          │ tool calls carry the token (dynamic var)
    │  mic denied/onError → TEXT FALLBACK      │
    ▼                                          ▼
  X/14 strip ◄─ GET /…/card-state ─┐   OUR package-external tool routes (own HMAC + slug)
                                   │     • POST /api/admin/pipeline/coach-tools/save-field
                                   │     • GET  /api/admin/pipeline/coach-tools/card-state
                                   │
        ┌──────────────────────────┴── applyCoachFields(slug, fields) ── SOLE live writer ──┐
        │  (callers: save_field tool · text-fallback extractor · completion backstop)        │
        ▼                                                                                    ▼
  product_validation_status row ──(completion: read row)──► POST …/admit ─ UNCHANGED gate ─► card
        ▲                                                    422 blockers → persist to draft, resume
        │
  convai_* (createConvaiWebhookRoutes): transcript + soft context ONLY, authed identity,
  NEVER the 14 authoritative field values
```

## 1. Surface — voice-first coaching panel

Refit `OnboardingCoach.tsx` to render a new `VoiceCoach.tsx` mirroring Kira's chat surface:

- **Avatar** — `/female_avatar.jpeg` centered with a status ring; `isSpeaking` from
  `useConversation()` drives "Listening…" / "Coach speaking…" / "Connecting…".
- **Transcript** — accumulate `onMessage((source, text) => setTranscript(...))` into a scrolling
  list beneath the avatar; assistant lines render with the avatar thumbnail, user lines
  right-aligned.
- **Readiness strip** — keep the "X/14 fields at bar". Source corrected: it can no longer read the
  turn-API response (voice doesn't go through it). A **new `GET /api/admin/pipeline/coach-tools/card-state`**
  (cookie-authed, service-role read of `product_validation_status`) feeds it; the strip polls it /
  refreshes on each `save_field` round-trip. (MINOR-8 fix — the client can't service-role-read
  directly.)
- **Text fallback** — no mic / `onError` / accessibility → the current typed input drives the
  *same* turn API, whose extracted block flows through `applyCoachFields`. Degrade-don't-fake
  (VOICE_MEMORY_STANDARD rule 13).
- **Responsive** — full-screen sheet ≤640px; avatar + transcript reflow; 44px targets; 16px text.
- **Explanatory header** retained.

Route stays `/admin/pipeline/new-ideas`; the product-name / asset-identifier create step
(`/create`) is unchanged and precedes the conversation.

## 2. Agent provisioning

One cockpit coach agent (persona **Morgan**, female avatar), provisioned once via
`@caistech/elevenlabs-convai`:

- `provisionVoiceAgent()` + `bindWorkspaceWebhook()` (workspace-create-then-bind, ≥0.3.3) +
  `setAllowlist(standardAllowlist(prodHost))`.
- **Two extra client tools registered on the agent** beyond the package's 5: `save_field` and
  `get_card_state`, pointed at **our** package-external routes (§3). Their ElevenLabs tool JSON is
  hand-authored in the provisioning script; the agent passes our session token + the field
  name/value as tool args.
- **System prompt = SKILL.md (single source) + a thin voice-delivery preamble** composed at
  provision time ("speak one question at a time, conversational, verbal pushback on thin evidence;
  call `save_field` the moment a field reaches bar"). The 7-node walk + robustness bars are NOT
  forked — edit SKILL.md once, text + voice inherit.
- Agent id scaffolded into `src/voice.config.ts` (PRODUCT_STANDARDS §6 — never `NEXT_PUBLIC_*`).
  Provisioning script under `scripts/`.

## 3. Field capture — `applyCoachFields()` is the SOLE live writer (net-new)

There is no existing writer to wrap; this is new code. One function, three callers, one allowlist:

```
applyCoachFields(slug, partialFields):
  - validate keys against the 14-field + feasibility allowlist (reject unknown — security)
  - coerce/grade per the existing score.ts rules
  - upsert product_validation_status row + set the touched has_* flags only
```

- **Caller A — `save_field` tool (voice, during the walk):** the agent calls our package-external
  `POST /api/admin/pipeline/coach-tools/save-field` route as each field reaches bar (Kira's
  `save_memory` pattern). The route **verifies our token + resolves slug** (the package does NOT —
  see §4), then calls `applyCoachFields`. One DB write per field, spread across the call. This makes
  the row the **live source of truth** the X/14 strip reads.
- **Caller B — text-fallback extractor:** the turn API's `extractAdmitPayload` block → `applyCoachFields`.
- **Caller C — completion backstop:** `extractFromTranscript()` (§8) runs once at call end so a
  missed tool-call can't strand a field → `applyCoachFields` (fills gaps only).
- **Completion → admit (gate unchanged):** read the now-complete `product_validation_status` row and
  hand its `fields` to `POST …/admit` exactly as the typed path does. Admit re-validates
  deterministically and runs the RPC. **No second writer, no changed admit contract** — admit's own
  write persists the same values it was handed (BLOCKER-1 resolved: save_field owns the live row,
  admit consumes it).

## 4. Memory / resume + identity (our token, authed path, package-external tools)

- **Our own session token (not `mintAnonSessionToken`):** the authed server component mints an
  HMAC-signed `{user_id: operator auth.uid(), product_slug, exp}` token (its own
  `COACH_SESSION_TOKEN_SECRET`), passed as a `useConversation()` dynamic variable. Every
  **package-external** tool route (`save-field`, `card-state`) verifies signature + expiry + slug on
  **every** call — the package's `resolveSession` does **not** reach these routes. Never
  service-role-for-auth.
- **Authed identity, not anon (BLOCKER-3/MATERIAL-5 fix):** `createConvaiWebhookRoutes`'
  `resolveSession` (called at `startConversation`) verifies our token and returns
  `{ userId: <operator auth.uid()> }` — **no `anonSessionId`**, so convai rows land non-anon under
  `user_id = auth.uid()` (satisfies the migration's RLS) and are **not** swept by the 24h anon TTL.
  Persistent memory therefore survives, as the v1 scope requires.
- **Slug binding:** add a `product_slug` column to `convai_conversations` (the table has none); our
  `start` resolver writes it once from the token (immutable after). `save_field`/`card-state` resolve
  the row by `conversation_id` → slug; the post-call backstop reads slug off the conversation row.
- **Resume source of truth = `product_validation_status` field-state**, not convai_memory. The agent
  PULLS completion via `get_card_state`. To avoid greeting dead air (rule 15) the browser passes a
  **minimal trigger** ({returning, last_node}) as a dynamic var so the coach greets specifically on
  the first line, then pulls authoritative specifics via `get_card_state`. Override carries the
  trigger only; the agent pulls the values (Singify pattern).
- **convai_* tables** store transcript + soft context (objections, tone) for observability —
  **never the authoritative 14 field values**.
- **post_call backstop + 422 (MATERIAL-6 fix):** `onConversationComplete` (HMAC-verified, no operator
  session — admit is service-role anyway) reads slug off the conversation row, runs
  `extractFromTranscript` → `applyCoachFields` → admit. If admit 422s, the user is already gone, so
  **persist the blockers onto the draft** so re-entry resumes at the unmet fields (it does NOT silently
  fail or fabricate).
- Migrate `convai_*` into **this** repo's Supabase (cockpit `tfgtfhwvrswjvkyeyvsp` — print the linked
  ref before push) from `packages/elevenlabs-convai/migration.sql`. **MINOR-7:** the migration creates
  unqualified globals (`update_updated_at_column()`, `purge_expired_anon_sessions()`, trigger
  `update_conversation_on_message`) on an instance shared with cais-shared-services — **grep existing
  migrations for name collisions before push**; namespace ours (`convai_*`) if any collide.

## 5. Env / secrets

- `ELEVENLABS_API_KEY`, `ELEVENLABS_WEBHOOK_SECRET`, `COACH_SESSION_TOKEN_SECRET` → Vercel
  **sensitive**, prod+preview only. Agent id in `voice.config.ts`, not env.
- Internal single-operator admin tool → operator ElevenLabs key is acceptable (operator *is* the
  user); no BYOK end-user split for the cockpit. Browser connects to the public agent + allowlist.

## 6. Standards checklist (pre-ship)

Responsive (avatar surface 375/1440) · explanatory header · degrade-don't-fake text fallback ·
HMAC verify on **every** convai webhook **and every package-external tool route** (401 on miss) ·
RLS on `convai_*` · no committed secrets · Vercel sensitive env · `/voice-auditor` live pass shows
the welcome-back recall **actually firing** (behavioural, not presence-only).

## 7. Explicitly unchanged (de-risks the change)

Admit gate logic + input contract · 14-field + feasibility schema · `admit_product()` RPC ·
readiness scoring (`score.ts`) · the typed-turn extractor `extractAdmitPayload` · the dual-stream
validation-interview flow (`/api/methodology/sync`, `methodology_responses`, rollup, demand score).
The voice coach changes *how the front door feels*, not what the pipeline records or how it scores.

## 8. Test plan

**Unit (Vitest, colocated `__tests__/`):**
- `applyCoachFields.test.ts` — valid field writes row+`has_*`; unknown field rejected (security);
  feasibility enum coercion; partial/resume set touches only its flags.
- `sessionToken.test.ts` — mint→verify roundtrip on **our** `{user_id, slug, exp}` token; tampered
  signature rejected; expired rejected; wrong-slug rejected. (Tests our token, not the package's.)
- `card-state` route — returns N/14 + captured-field set for a valid token.
- package-external tool routes — `save-field` valid token → `applyCoachFields`; **invalid/missing/
  wrong-slug token → 401 (CRITICAL security)**. These routes carry their OWN auth (the package
  doesn't), so the auth test lives here, not "upstream".
- convai post_call wiring — unverified ElevenLabs HMAC → 401.

**EVAL (fixtures — carries the real risk; `extractFromTranscript` is net-new free-text extraction):**
Multiple full transcripts → 14 fields; **per-field** "genuinely absent → must NOT fabricate" cases;
a "present-but-generic must fail the bar" case (SKILL.md robustness + THIN_MVP §3.1). Not one fixture.

**Component:** `VoiceCoach.tsx` — `onMessage` → transcript renders; `isSpeaking` → avatar state;
mic-denied/`onError` → text fallback shows (degrade-don't-fake).

**E2E (Playwright, extend `pipeline-smoke.spec.ts`):** text-fallback walk → admit → card created →
one-door honored. Voice-specific loop (avatar speaks, welcome-back recall fires) verified by the
`/voice-auditor` live pass (PRODUCT_STANDARDS §6), not mic-driven CI.

**REGRESSION (guards the UNTOUCHED path):** the typed-turn flow through `extractAdmitPayload` +
admit still yields the same payload. NB: this proves the typed path is unbroken — it does **not**
cover `extractFromTranscript` (that's the EVAL's job; do not conflate them).

## 9. Build order

1. **Ground + migrate.** Read the real `route.ts` / `admit/route.ts` / `OnboardingCoach.tsx` /
   `score.ts`; copy `packages/elevenlabs-convai/migration.sql` into `supabase/migrations/`; **grep
   existing migrations for the 3 global-name collisions (MINOR-7)**; add the `product_slug` column;
   print the linked ref, confirm `tfgtfhwvrswjvkyeyvsp`, push.
2. `applyCoachFields()` (net-new, sole writer) + our `{user_id, slug, exp}` `sessionToken`
   mint/verify + unit tests.
3. Package-external tool routes (`save-field`, `card-state`) with own HMAC+slug auth + `card-state`
   GET for the strip; wire `createConvaiWebhookRoutes` with the authed `resolveSession` + post_call.
4. Provision the Morgan agent (SKILL.md + voice preamble + the 2 extra tool defs) + `voice.config.ts`
   + script.
5. `extractFromTranscript()` backstop + EVAL + the typed-path regression test.
6. `VoiceCoach.tsx` surface (avatar + transcript + readiness strip + text fallback) + component test.
7. Resume trigger + recall; `/voice-auditor` behavioural pass; standards sweep; text-fallback E2E.

## 10. NOT in scope

- **Mic-driven voice E2E in CI** — flaky + costs ElevenLabs minutes; covered by the voice-auditor
  behavioural pass.
- **convai_memory as authoritative field store** — rejected (two-sources-of-truth drift).
- **Changing the admit gate's logic, RPC, or input contract** — rejected (the invariant).
- **Voice-ifying the dual-stream validation interviews** — Connexions already does that; untouched.
- **Forked voice system prompt** — rejected; one SKILL.md + preamble.
- **Team-admin / multi-operator** — single-operator deferral trigger still applies (PRODUCT_STANDARDS §9).
