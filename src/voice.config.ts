// Voice agent configuration (canonical source for agent IDs in this app).
//
// Per the VOICE AI rule, agent IDs live here — not hand-set NEXT_PUBLIC_* scattered through
// components. Each ID resolves from its env var with a baked default filled in once the agent
// is provisioned (scripts/provision-cockpit-clarifier.ts). The ID is public by design (it ships
// in the client bundle; the ElevenLabs Security allowlist is what protects the workspace key),
// so baking the provisioned default here is safe and keeps the widget working without a Vercel
// env round-trip.

/**
 * The methodology-cockpit in-context clarifier agent (the /admin/methodology card detail).
 * Provisioned via `npm run provision:clarifier`; that script prints the agent ID to paste in
 * as the fallback below (or set NEXT_PUBLIC_ELEVENLABS_AGENT_COCKPIT_CLARIFIER on Vercel).
 */
export const COCKPIT_CLARIFIER_AGENT_ID =
  process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_COCKPIT_CLARIFIER ||
  // Provisioned 2026-05-25 (scripts/provision-cockpit-clarifier.ts). Public by design — the
  // ElevenLabs Security allowlist (prod + *.vercel.app + localhost) is what guards the key.
  'agent_4401kse5r5xnf1camkn8w30qftym'

/** True once an agent ID is available, so surfaces can hide the voice affordance until then. */
export const hasCockpitClarifier = (): boolean => COCKPIT_CLARIFIER_AGENT_ID.trim().length > 0
