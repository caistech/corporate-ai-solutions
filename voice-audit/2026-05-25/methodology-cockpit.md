# Voice placement map — Methodology Pipeline Cockpit (Corporate-AI-Solutions `/admin/methodology`)

**Scope:** the cockpit surfaces only (board list, card detail, add-idea / add-chosen-product, Gate-1 kick-off, decision controls, `/admin/settings`) + the global `VoiceAgent.tsx` it renders. **Date:** 2026-05-25. Audited against `VOICE_MEMORY_STANDARD.md` + the VOICE AI rule.

**Current state:** `@caistech/elevenlabs-convai` consumed? **NO** (uses local `@/lib/elevenlabs`). · VoiceWidget present? **NO** (a hand-rolled `VoiceAgent.tsx` FAB). · manifest `voice_agent_status`: `unaudited`.

## Headline

The cockpit **renders a voice FAB ("Talk to Morgan"), but it is a non-functional marketing mock, not a voice agent** — and it is **not** the in-context clarifier the VOICE AI rule mandates for a nuanced admin-decision surface. Concretely, `VoiceAgent.tsx`:
- **Doesn't actually do voice** — `toggleListening()` is a `// TODO: Integrate with ElevenLabs Conversational AI SDK`; the mic toggles a UI state and nothing else.
- **Canned, not conversational** — replies are 3 hardcoded strings about marketplace pricing / studio-in-residence; anything else returns a generic fallback.
- **Marketing-scoped, card-blind** — `getAgentForPage(pathname)` picks a marketing persona; on `/admin/methodology` it knows nothing about the current card, its gate, its hypotheses, or the launch consequence.
- **Storage≠memory + §6 violations** — it POSTs transcripts to `/api/voice/conversations` (storage only, no recall loop), doesn't consume the hub package, isn't BYOK, and is a per-project re-implementation. Fails rules 1, 2, 19 outright; rules 7–18 N/A because there's no real agent.

So for the cockpit's *own functions*, there is **no compliant voice agent and no clarifier** — exactly the surface the VOICE AI in-context-clarifier rule (point 8) targets.

## Placement map

| Surface / flow | Verdict | Function | Why | Integration shape |
|---|---|---|---|---|
| **Gate-1 kick-off + Launch real-outreach** (`CockpitControls`) | **Required** | Guide/clarifier | Highest nuance + highest consequence: fires real discovery + API cost. The naive-test showed operators can't tell what "Gate 1 ready" means or what Launch *does* before clicking. | in-context `useConversation` + `sendContextualUpdate`, pulling the card's gate state + the launch consequence + the methodology docs |
| **Decision controls** (REDESIGN-TO-FIT / PERSONAL-INTEREST / KILL / KEEP-VALIDATING) | **Required** | Guide/clarifier | Nuanced, irreversible methodology calls (Rule 15 distributor gate, the rubric). Definitions aren't on-screen; operator needs "when REDESIGN vs KILL, what the distributor gate means" in context of *this* card's hypotheses + responses. | in-context clarifier, card-aware (hypotheses, campaign responses, scores) |
| **Pipeline fields** (stage / monetisation-lane / engine-cluster) | Could-add-value | Guide/clarifier | The 4 lanes + engine clusters carry nuance a dropdown label can't (which is "lane 1" vs "lane 4"?). | clarifier pulling `BUSINESS_MODEL.md` lane defs |
| **Add a new idea / add chosen product** | Could-add-value | Guide/clarifier | "What makes a good idea / which to add" — helpful, not load-bearing (the dedup/slug UX is already good). | clarifier (light) |
| **Board list** | Not-needed | — | A triage table; a clarifier doesn't help (sort/filter does, per the naive-test). | — |
| **`/admin/settings`** | Not-needed | — | Standard account/password surface. | — |

**Function classification:** the cockpit is a **guide/clarifier** surface, **not coaching**. So per rule A.1 the *full* recall→persist cross-session loop is **could-add-value, not Required** — what's Required is that the clarifier **PULLS the current card's state + the methodology context on demand** (rules 3–8), never has it pushed via prompt. A "what did we discuss about this card" memory is a could-add extension.

## Recommended `voice_agent_status`: **absent**

The rendered FAB is a marketing mock that's card-blind and non-functional — it does **not** count as the cockpit's voice agent. The cockpit has **no compliant clarifier** on the surfaces that mandate one.

## Wiring checklist (to make it compliant)

- [ ] **Replace/scope the agent** — stop relying on the marketing `VoiceAgent.tsx` mock for the cockpit; consume **`@caistech/elevenlabs-convai`** + its `/react` VoiceWidget; **BYOK** (operator's ElevenLabs key); agent id via a scaffolded `voice.config.ts`, not `NEXT_PUBLIC_*`.
- [ ] **In-context clarifier on the card detail** — `useConversation` + `sendContextualUpdate`; on open, **pull** (never push): the current card's gate/stage/hypotheses/campaign-responses/lane + the methodology context (Gate-1/Gate-2 definitions, the Launch consequence, REDESIGN-vs-KILL criteria, the 4 lanes). Identity server-derived from the now-gated admin session (`conversation_id`, never `user_id`).
- [ ] **Pull tools (clarifier scope):** `get_card_state(conversation_id)` and `get_methodology_context()` via the `tool → webhook → handler → CAS DB / docs` pattern. (Full conversation-memory + cross-session persistence = could-add, not required for a clarifier.)
- [ ] **Provisioning correct** if any agent is provisioned — `conversation_config_override` enabled, workspace webhook via `bindWorkspaceWebhook`, allowlist; webhook HMAC verified (rule 10).
- [ ] Don't claim "voice present" until a live pass shows the clarifier actually answering a card-specific question (behavioural, not presence — and the current mock would fail that immediately).

## Live pass (Phase 2): DEFERRED

`/admin/*` is now auth-gated (we shipped that), so a live walk needs an authenticated session. But the static scan is already conclusive here — the agent is a non-functional mock with no real ElevenLabs integration, so a live pass would only confirm "the FAB renders and does nothing." Re-run Phase 2 after the clarifier is actually wired (then the behavioural memory/clarifier check is meaningful).

## Corroboration

This matches the 2026-05-25 naive-test (Anneke), which independently recommended *"point the voice agent explicitly at the launch buttons and decision definitions — the two places a first-timer hesitates."* The voice-audit formalises that as **Required**, and reveals the deeper issue: the agent it would point isn't real yet.
