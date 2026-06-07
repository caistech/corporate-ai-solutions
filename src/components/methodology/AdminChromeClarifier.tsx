'use client'

// Chrome-level methodology clarifier — the VOICE AI in-context guide on EVERY operator surface
// in the cockpit (board, pipeline, reviews, settings, the methodology list). Reuses the
// provisioned cockpit clarifier agent + the methodology context (gates, what Launch fires,
// decision lanes). It is a guide/clarifier, not a coaching agent (no cross-session memory loop).
//
// The per-card detail page (/admin/methodology/<slug>) mounts its own CockpitClarifier, which
// ALSO pulls that card's live state — so we suppress this chrome-level one there to avoid two
// floating widgets fighting for the same corner.

import { usePathname } from 'next/navigation'
import { VoiceWidget } from '@caistech/elevenlabs-convai/react'
import { COCKPIT_CLARIFIER_AGENT_ID } from '@/voice.config'
import { METHODOLOGY_CONTEXT, CLARIFIER_FIRST_MESSAGE } from '@/lib/methodology/clarifier-context'

export function AdminChromeClarifier() {
  const pathname = usePathname() || ''

  // No provisioned agent → render nothing (the widget would have no agent to connect to).
  if (!COCKPIT_CLARIFIER_AGENT_ID) return null

  // Card-detail route (/admin/methodology/<slug>) ships its own card-aware clarifier.
  const segs = pathname.split('/').filter(Boolean) // e.g. ['admin','methodology','<slug>']
  const isCardDetail = segs[0] === 'admin' && segs[1] === 'methodology' && segs.length >= 3
  if (isCardDetail) return null

  const clientTools: Record<string, (params: Record<string, unknown>) => Promise<string>> = {
    // The agent pulls the methodology definitions (gates, launch consequence, decisions, lanes)
    // on demand rather than having them pushed into the prompt (VOICE_MEMORY_STANDARD §B).
    get_methodology_context: async () => METHODOLOGY_CONTEXT,
  }

  return (
    <VoiceWidget
      agentId={COCKPIT_CLARIFIER_AGENT_ID}
      mode="clarifier"
      placement="floating"
      title="Methodology clarifier — ask about the pipeline, the gates, or what an action fires."
      textFallback
      clientTools={clientTools}
      overrides={{ agent: { firstMessage: CLARIFIER_FIRST_MESSAGE } }}
    />
  )
}

export default AdminChromeClarifier
