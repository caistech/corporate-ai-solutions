// src/lib/methodology/features.ts
//
// SINGLE SOURCE OF TRUTH for the conditional feature tags a Hypothesis Card can carry.
// The scorer (score.ts) marks a CONDITIONAL-* readiness check N/A when its `applies_when`
// tag is absent from a card's `features` set; the cockpit checkbox UI, the PATCH validator,
// and auto-enrollment all read THIS list. Previously the same set was hand-duplicated across
// route.ts (z.enum), CockpitControls.tsx (FEATURES), and enroll-card.ts (KNOWN_FEATURES) and
// drifted (address-or-abn-fields, public-web). Now they all derive from here.
//
// CANON: the keys of cais-shared-services/gate-readiness/applicability.json `features`.
// Keep in lockstep with that file — enforced by __tests__/features.canon.test.ts.

/** Tokens score.ts matches via applies_when -> features.includes(token). */
export const KNOWN_FEATURES = [
  'voice',
  'auth',
  'supabase',
  'third-party-content',
  'address-or-abn-fields',
  'email',
  'public-web',
] as const

export type KnownFeature = (typeof KNOWN_FEATURES)[number]

/** Human labels for the cockpit feature checkboxes (CockpitControls). */
export const FEATURE_LABEL: Record<KnownFeature, string> = {
  voice: 'Voice agent',
  auth: 'Auth',
  supabase: 'Supabase',
  'third-party-content': '3rd-party content',
  'address-or-abn-fields': 'Address / ABN fields',
  email: 'Sends email',
  'public-web': 'Public web (agent-discoverable)',
}
