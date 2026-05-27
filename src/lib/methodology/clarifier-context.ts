// Methodology cockpit clarifier — shared context.
//
// Single source of truth for (a) the static methodology reference the in-context voice
// clarifier returns via its `get_methodology_context` client tool, and (b) the agent's
// system prompt used at provision time. Keeping both here means the agent's baked-in
// understanding and the runtime tool can never drift apart.
//
// Per VOICE_MEMORY_STANDARD.md the clarifier PULLS authoritative card values via
// `get_card_state` (never has them pushed into the prompt). The system prompt therefore
// carries only the methodology *definitions* + the instruction to pull — not any card data.

/**
 * The methodology reference text. Returned verbatim by the `get_methodology_context`
 * client tool when the operator asks "what does Gate 1 mean / what does Launch do /
 * when REDESIGN vs KILL / which lane". Definitions only — no per-card values.
 */
export const METHODOLOGY_CONTEXT = `PRODUCT-DEVELOPMENT PIPELINE — definitions for the cockpit.

THE TWO GATES
- Gate 1 — "is the thin MVP ready?" The kick-off outreach embeds the link to the thin MVP,
  so there must be a working thin-MVP link or there is nothing to send. A thin MVP carries
  the WHOLE experience (the viewer must feel the promise) but ZERO scale infrastructure
  (no multi-tenant, auth, billing). Gate 1 releases the *research*, not the build.
- Gate 2 — the demand go/no-go. Needs validated signal from BOTH streams: the distributor
  stream ("will someone onsell this?") AND the end-user stream ("does the end user want it?").
  Gate 2 releases the *full build* and assigns the monetisation lane.

WHAT "LAUNCH REAL RESEARCH" DOES (the consequence to understand before clicking)
- It fires InvestorPilot dual-stream discovery: it sources two real contact streams — (a)
  distributor-candidates who could onsell, and (b) target end-users — and queues real
  outbound to a Connexions voice-interview agent. This spends API budget and engages real
  people. Outbound messages are human-approved before send while the flow is being polished.
  Do not launch until Gate 1 is genuinely YES — a dead MVP link returns a false NO-GO.

THE DECISIONS (Gate 2 outcomes)
- GO / VALIDATED: both streams positive — a credible distributor will onsell AND end-users
  want it. Advance to build and assign a lane.
- REDESIGN-TO-FIT: the evidence says this exact shape is wrong, but there is a viable adjacent
  product the same audience would take. Reshape the offer and re-validate — do not kill.
- PERSONAL-INTEREST-OVERRIDE: there is no credible distributor (the distributor gate fails),
  but the operator greenlights it as a passion / strategic bet (the kira/storyverse lane).
  Use sparingly — it bypasses the gate on purpose.
- KILL: no credible distributor and no override. Archive it.
- KEEP-VALIDATING: not enough signal yet — let more interview evidence land before deciding.

POOL DISCOVERY — the office-hours forcing questions (run BEFORE a card can validate)
Every product card carries TWO research-pool hypotheses that the dual-stream outreach sources
against: the DISTRIBUTOR pool (operators who already have a book of customers and would onsell)
and the END-USER pool (who would actually use it). A card cannot advance to validation until both
are captured. When get_card_state shows a pool "(not captured)", walk the operator through the six
forcing questions to articulate it, then have them save it onto the idea card:
1. Demand reality — who feels this pain acutely enough to pay/switch today (a named cohort, not "a market")?
2. Status quo — what do they use instead right now, and why is it not good enough?
3. Desperate specificity — name the most specific group that has this problem worst.
4. Narrowest wedge — the single smallest group worth serving first.
5. Observation — where do these people already congregate (associations, directories, marketplaces) — i.e. are they REACHABLE?
6. Future-fit — who onsells to them already, and would that operator put this in front of their book?
The distributor pool answers Q6; the end-user pool answers Q1–Q5. Keep it conversational; when the
operator has a crisp, reachable cohort for each, suggest they save it and run pool assessment.

THE DISTRIBUTOR GATE (the hard one)
- We sell to DISTRIBUTORS who already have a book of customers (a singing school, a VC
  accelerator, an accountancy firm), never to end users. CAS clips ~$10-20 per active
  end-user/month, billed to the distributor; the distributor prices their own clients.
- "Distributor onsell opportunity" is a HARD GATE: no credible, named distributor →
  default NO-GO (unless personal-interest override). "SMBs" is not a distributor answer.

THE FOUR MONETISATION LANES (assigned on a GO)
1. Paid distributor SaaS (Singify-style, multi-tenant, white-label) — the PRIMARY revenue
   engine. The distributor pays recurring.
2. Studio-in-residence — embed with a dev shop / accelerator. Networking + some revenue,
   capacity-capped. Not the primary engine.
3. Contract / bespoke build — custom engagements; some revenue; partly fed by the BYOK funnel.
4. BYOK-free product — free, bring-your-own-keys, self-hosted open release. AWARENESS /
   MARKETING ONLY, not revenue; it is the top of the funnel into lanes 2 and 3.`

/** Compact, serialisable snapshot of one card, passed from the (gated) server page to the
 *  clarifier and returned by the `get_card_state` tool. No secrets — methodology metadata
 *  the operator is already viewing. */
export interface CardClarifierState {
  product_slug: string
  status: string
  pipeline_stage: string | null
  monetisation_lane: string | null
  engine_cluster: string | null
  build_status: string | null
  mvp_url: string | null
  mvp_ready: boolean | null
  origin_summary: string | null
  original_end_user: string | null
  /** The two research-pool hypotheses (build #4). Null/blank → the office-hours dialogue is owed. */
  distributor_pool: string | null
  end_user_pool: string | null
  hypotheses: { field: string; status: string }[]
  campaigns: { type: string; status: string; responses: number; expected: number }[]
  response_counts: Record<string, number>
}

/** Render a card snapshot as the readable string the clarifier tool returns to the agent. */
export function formatCardState(state: CardClarifierState): string {
  const lines: string[] = []
  lines.push(`Card: ${state.product_slug}`)
  lines.push(`Status: ${state.status}`)
  lines.push(`Pipeline stage: ${state.pipeline_stage ?? '(unset)'}`)
  lines.push(`Monetisation lane: ${state.monetisation_lane ?? '(unset)'}`)
  lines.push(`Engine cluster: ${state.engine_cluster ?? '(unset)'}`)
  lines.push(
    `Build status: ${state.build_status ?? '(unset)'} · thin-MVP link: ${
      state.mvp_url ? state.mvp_url : '(none)'
    } · marked MVP-ready: ${state.mvp_ready ? 'yes' : 'no'}`
  )
  lines.push(
    `Gate 1 readiness: ${
      state.mvp_url && state.mvp_ready
        ? 'has an MVP link AND is marked ready — Gate 1 can pass'
        : 'NOT ready (needs a working thin-MVP link and the ready flag before Launch)'
    }`
  )
  if (state.origin_summary) lines.push(`Origin: ${state.origin_summary}`)
  if (state.original_end_user) lines.push(`Original end-user: ${state.original_end_user}`)
  const distSet = (state.distributor_pool ?? '').trim().length >= 12
  const euSet = (state.end_user_pool ?? '').trim().length >= 12
  lines.push(
    `Research pools — Distributor pool: ${distSet ? state.distributor_pool : '(not captured)'} · End-user pool: ${
      euSet ? state.end_user_pool : '(not captured)'
    }`
  )
  if (!distSet || !euSet) {
    lines.push(
      'POOLS INCOMPLETE — run the office-hours forcing questions with the operator to capture the missing pool(s) before this card can validate.'
    )
  }
  if (state.hypotheses.length) {
    lines.push(
      `Hypotheses (${state.hypotheses.length}): ` +
        state.hypotheses.map((h) => `${h.field}=${h.status}`).join(', ')
    )
  }
  if (state.campaigns.length) {
    lines.push('Validation streams:')
    for (const c of state.campaigns) {
      lines.push(`  - ${c.type}: ${c.status}, ${c.responses}/${c.expected} responses`)
    }
    const counts = Object.entries(state.response_counts)
    if (counts.length) {
      lines.push(
        'Response classifications so far: ' + counts.map(([k, v]) => `${v} ${k}`).join(', ')
      )
    }
  } else {
    lines.push('No validation streams launched yet.')
  }
  return lines.join('\n')
}

/** The agent's first spoken line (used as the per-session firstMessage override). */
export const CLARIFIER_FIRST_MESSAGE =
  "I can help you think through this card — whether the MVP is ready to launch research, " +
  'what launching actually fires, or which go/no-go decision the evidence supports. ' +
  'What are you weighing up?'

/** The agent system prompt baked in at provision time. Definitions + the pull instruction
 *  only — never any card values (those are pulled at runtime via get_card_state). */
export function buildClarifierSystemPrompt(): string {
  return `You are the methodology cockpit clarifier for Corporate AI Solutions' product-development pipeline.

The operator is moving a product (a "hypothesis card") through a five-stage validation pipeline in the cockpit at /admin/methodology. Your job is to clarify the nuanced, consequential decisions on the card they are currently viewing — in real-time, discussion-style (they can ask follow-ups), not single-shot Q&A.

YOU HAVE TWO TOOLS — ALWAYS USE THEM, NEVER GUESS:
- get_card_state: returns the CURRENT card's authoritative state (status, Gate-1 readiness, MVP link, hypotheses, validation streams + responses, lane). Call this whenever the operator's question depends on where this specific card stands. Never invent or assume card values.
- get_methodology_context: returns the definitions of the two gates, what "Launch real research" actually does, the Gate-2 decision options, the distributor gate, and the four monetisation lanes. Call this to ground any methodology question.

The places operators hesitate, and what to help with:
1. Pool discovery (at ingestion) — pull get_card_state; if either research pool is "(not captured)", run the six office-hours forcing questions (in get_methodology_context) to help the operator articulate the DISTRIBUTOR pool + END-USER pool, then have them save each onto the idea card. Both pools must be captured before the card can validate.
2. Gate 1 — "is the thin MVP ready?" Pull get_card_state; if there's no MVP link or it isn't marked ready, explain that launch embeds that link and a dead link returns a false NO-GO.
3. "Launch real research" — explain it fires real dual-stream discovery + outbound + API cost BEFORE they click, using get_methodology_context.
4. The decision (GO / REDESIGN-TO-FIT / PERSONAL-INTEREST-OVERRIDE / KILL / KEEP-VALIDATING) — pull both tools, weigh this card's actual evidence against the definitions, and talk through which fits. The distributor gate is hard: no credible distributor defaults to NO-GO unless they consciously override.

Be concise and conversational. When the operator has what they need, suggest they close the assistant and act ("sounds like you're ready to set Gate 1 / record the decision"). Do not claim to remember past sessions — you are a fresh clarifier each time.`
}
