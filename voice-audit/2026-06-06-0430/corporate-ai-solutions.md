# Voice placement map — Methodology Cockpit (corporate-ai-solutions)

**Branch:** `feat/voice-coach` · **Audited:** 2026-06-06
**Current:** `@caistech/elevenlabs-convai` consumed? **yes (^0.4.0)** · VoiceWidget present? **yes (coach + clarifier)** · manifest `voice_agent_status`: **present**
**Tier:** standard (internal single-operator cockpit). **BYOK nuance:** the operator *is* the user for an internal tool, so the agent running on the operator's ElevenLabs key satisfies BYOK here (not an end-user split).

## Surfaces

| Surface / flow | Verdict | Function | Why | Integration shape |
|---|---|---|---|---|
| `/admin/pipeline/new-ideas` (onboarding coach, Morgan) | **Required** | Guide/clarifier | 7-node product-intake walk; 14 graded fields + feasibility, each needing nuance a label can't carry ("distributor", "proof of demand at tier X") | hub `VoiceWidget` + `useConversation`; client tools `save_field` / `get_intake_progress` → cookie-authed routes. **PRESENT (this PR).** |
| `/admin/methodology` + `/admin/methodology/[slug]` (cockpit clarifier) | **Required** | Guide/clarifier | nuanced, consequential decisions (is Gate-1 ready, what "Launch research" fires, which Gate-2 decision) | hub `VoiceWidget` (floating) + client tools `get_card_state` / `get_methodology_context`. **PRESENT.** |
| `/admin/pipeline/[productId]` (card detail) | Could-add-value | Guide/clarifier | dense per-card state; a clarifier would help but the methodology clarifier already covers the conceptual load | reuse the cockpit clarifier pattern, card-scoped |
| `/admin/methodology/readiness` | Could-add-value | Guide/clarifier | the 45-check readiness rubric is dense; "why is this check failing" is a real clarifier use | in-context clarifier, readiness-scoped |
| `/admin/ops`, `/admin/cockpit/requests`, `/admin/pipeline/factory`, `/admin/reviews`, `/admin` (dashboard) | Not-needed | — | operational dashboards; tables + filters self-serve | — |
| `/admin/settings` | Not-needed | — | standard settings form | — |
| `/admin/login`, `/admin/pipeline/login`, `/pipeline/welcome` | Not-needed | — | auth/marketing; static | — |

**No coaching-function surfaces** — the cockpit is an internal operator tool, so every voice surface is guide/clarifier. (Correct; over-calling "Required" or inventing a coaching surface here would be a defect.)

## Recommended `voice_agent_status`: **present**

## Voice readiness verdicts (repo-scan checks; live-pass checks pending — §Phase 2 blocked)

| Code | Check | Verdict | Evidence |
|---|---|---|---|
| 11 | Consumes hub `/react` VoiceWidget, BYOK, canonical persona | **pass** | `@caistech/elevenlabs-convai@^0.4.0`; `VoiceCoach`/`CockpitClarifier` use `/react` VoiceWidget; persona = canonical voice-config.json (Sarah voice) |
| 15 | Memory pull-not-push, works off results | **pass** | agent PULLS via `get_intake_progress`/`save_field` (client tools); never reads state into the prompt |
| 16 | Identity server-derived (never client `user_id`) | **pass** | `requireOperator()` derives operator from the cookie session; client tools send `productSlug`, never an identity |
| 17 | convai webhook verifies HMAC, unverified→401 | **pass** | `coach-post-call/route.ts` verifies `ELEVENLABS_WEBHOOK_SECRET`, 401 on miss |
| 18 | Allowlist on the public agent | **pass** | `standardAllowlist(prodHost)` set at provision (prod + *.vercel.app + localhost) |
| 19 | Workspace-bound webhook (not per-agent shape) | **pass** | `bindWorkspaceWebhook` (post_call_webhook_id), not the deprecated `platform_settings.webhook` |
| 20 | Cross-session authed-only | **pass** | cockpit is auth-gated; operator id from session, not a hardcoded/pre-auth id |
| 14 | Memory welcome-back recall fires | **n/a (by design)** | coach is a **guide/clarifier**, not coaching → pull-only memory is permitted (VOICE_MEMORY_STANDARD: "pull-only OK for a transient clarifier"). Field-RESUME works via `card-state` pull, not conversational recall. The convai memory loop is deliberately unwired. |
| 10 | Voice reachable from chrome ≤3 clicks | **pending live** | VoiceWidget mounts inline on the surface; confirm render on the live pass |
| 12 | Proactive + stage-aware | **pending live** | system prompt is proactive (greets, one-question-at-a-time, verbal pushback) and pulls progress per turn; confirm behaviour on the live pass |
| 13 | Every Required surface voiced | **pass** | both Required surfaces (new-ideas, methodology) have a VoiceWidget |

## Wiring checklist (Required + scheduled could-add-value)
- [x] `/admin/pipeline/new-ideas` → hub VoiceWidget + client tools (cookie-authed) — **done this PR**
- [x] `/admin/methodology` → hub VoiceWidget clarifier — already present
- [ ] `/admin/pipeline/[productId]` → card-scoped clarifier (could-add-value; schedule)
- [ ] `/admin/methodology/readiness` → readiness-scoped clarifier (could-add-value; schedule)

## Live validation delta (Phase 2)
**BLOCKED — preview returns `401` (Vercel deployment protection / SSO wall).** The behavioural checks (10 reachability, 12 proactive/stage-aware) and a render confirmation could not run against `https://corporate-ai-solutions-mmc5rb7tj-corporate-ai-solutions.vercel.app`.

To complete Phase 2, either:
1. Provision a **Protection-Bypass-for-Automation** token for the preview (PRODUCT_STANDARDS §9.5) and re-run the live pass, OR
2. Run locally: `npm run dev` → log in as the operator → `/admin/pipeline/new-ideas` → confirm Morgan's launcher renders, opens, connects (WebRTC) or shows the text fallback (degrade-don't-fake), and that `save_field` advances the X/14 strip.

**Memory-loop pass/fail:** **N/A by design** — the onboarding coach is a guide/clarifier with pull-only state (resume via `card-state`), not a coaching agent with conversational cross-session memory. No welcome-back recall to verify; this is a deliberate, standards-permitted scope (not a gap).
