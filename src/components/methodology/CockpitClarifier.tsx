'use client'

// In-context voice clarifier for the methodology cockpit card detail.
//
// This is the VOICE AI rule's "in-context clarifier" (point 8) for the cockpit's nuanced,
// consequential decisions: is Gate 1 ready, what does "Launch real research" actually fire,
// and which Gate-2 decision the evidence supports. It consumes the hub VoiceWidget
// (@caistech/elevenlabs-convai/react) — no per-project voice client — and gives the agent two
// PULL tools so it reads authoritative state on demand rather than having it pushed into the
// prompt (VOICE_MEMORY_STANDARD §B). It is a guide/clarifier, not a coaching agent, so no
// cross-session memory loop is wired (rule A.1: that is could-add for a clarifier).
//
// Identity: the widget runs only inside the auth-gated, allowlisted /admin surface, and the
// card state it exposes is the server-rendered snapshot passed as a prop — the client never
// supplies an identity the agent relays. BYOK: the agent runs on the operator's ElevenLabs key.

import { VoiceWidget } from '@caistech/elevenlabs-convai/react'
import { COCKPIT_CLARIFIER_AGENT_ID } from '@/voice.config'
import {
  METHODOLOGY_CONTEXT,
  CLARIFIER_FIRST_MESSAGE,
  formatCardState,
  type CardClarifierState,
} from '@/lib/methodology/clarifier-context'

interface CockpitClarifierProps {
  card: CardClarifierState
}

export function CockpitClarifier({ card }: CockpitClarifierProps) {
  // No provisioned agent yet → render nothing (the widget would have no agent to connect to).
  if (!COCKPIT_CLARIFIER_AGENT_ID) return null

  const clientTools: Record<string, (params: Record<string, unknown>) => Promise<string>> = {
    // The agent pulls the current card's authoritative state on demand.
    get_card_state: async () => formatCardState(card),
    // The agent pulls the methodology definitions (gates, launch consequence, decisions, lanes).
    get_methodology_context: async () => METHODOLOGY_CONTEXT,
  }

  return (
    <VoiceWidget
      agentId={COCKPIT_CLARIFIER_AGENT_ID}
      mode="clarifier"
      placement="floating"
      title="Methodology clarifier — ask about Gate 1, what Launch fires, or which decision fits this card."
      textFallback
      clientTools={clientTools}
      overrides={{ agent: { firstMessage: CLARIFIER_FIRST_MESSAGE } }}
    />
  )
}

export default CockpitClarifier
