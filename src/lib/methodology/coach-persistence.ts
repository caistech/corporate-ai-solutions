// coach-persistence — wires the onboarding coach (Morgan) into the hub's persistent-memory loop
// (@caistech/elevenlabs-convai — the SAME loop Kira rides). The 20260606 migration vendored the
// convai_* schema (+ a product_slug binding on convai_conversations) but nothing populated it:
// convai_agents was empty, so handleStartConversation refused ("Agent not found") and no
// conversation/messages were ever written. These helpers close that — driven CLIENT-side from the
// authed operator browser (no webhook), consistent with the coach's existing client-tool design.

import type { SupabaseClient } from '@supabase/supabase-js'

/** Table names for the hub handlers — this repo uses the canonical convai_* names. */
export const COACH_TABLES = {
  agents: 'convai_agents',
  conversations: 'convai_conversations',
  messages: 'convai_messages',
  memory: 'convai_memory',
  anonSessions: 'convai_anon_sessions',
} as const

/**
 * Ensure a convai_agents registry row exists for the coach agent. The hub handlers resolve the
 * agent by elevenlabs_agent_id and refuse to run without it. Self-healing + idempotent (the table
 * has a UNIQUE constraint on elevenlabs_agent_id), so the first /coach/start after deploy registers
 * Morgan without a separate provisioning step. user_id = the operator who first connects (owner of
 * the registry row only; each conversation binds to its own operator's id for recall scoping).
 */
export async function ensureCoachAgent(
  supabase: SupabaseClient,
  params: { elevenlabsAgentId: string; ownerUserId: string; agentName?: string },
): Promise<{ ok: boolean; error?: string }> {
  const { data: existing, error: readErr } = await supabase
    .from(COACH_TABLES.agents)
    .select('id')
    .eq('elevenlabs_agent_id', params.elevenlabsAgentId)
    .maybeSingle()
  if (readErr) return { ok: false, error: readErr.message }
  if (existing) return { ok: true }

  const { error: insErr } = await supabase.from(COACH_TABLES.agents).insert({
    user_id: params.ownerUserId,
    agent_name: params.agentName ?? 'Morgan (onboarding coach)',
    elevenlabs_agent_id: params.elevenlabsAgentId,
    status: 'active',
  })
  // A concurrent first-connect may have inserted it between our read and insert — the UNIQUE
  // constraint then trips; treat that as success (the row exists, which is all we need).
  if (insErr && !/duplicate key|unique/i.test(insErr.message)) return { ok: false, error: insErr.message }
  return { ok: true }
}
