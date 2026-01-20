// =============================================================================
// PLATFORM CONSTANTS UPDATES - COMPLETE
// Add/update these entries in your /lib/constants.ts file
// =============================================================================

// -----------------------------------------------------------------------------
// 1. UPDATE: Connexions - Enhanced description highlighting AI analysis
// -----------------------------------------------------------------------------
// FIND the existing Connexions entry and REPLACE with this:
{
  id: 'connexions',
  name: 'Connexions',
  tagline: 'AI-powered survey and interview analysis',
  problem: 'Qualitative research is time-consuming and insights get lost',
  description: 'Generator platform for white-label AI voice interviewers with enhanced AI analysis. Conduct customer research, user feedback, exit interviews, and compliance audits - then let AI extract themes, sentiment, and actionable insights from your surveys and research interviews automatically.',
  url: 'https://connexions-silk.vercel.app',
  status: 'live',
  hasVoiceAI: true,
  isGenerator: true,
  category: 'research',
  children: ['universal-interviews'],
}

// -----------------------------------------------------------------------------
// 2. NEW: Kira - Personalized AI Thinking Partner
// -----------------------------------------------------------------------------
// ADD this as a new STANDALONE parent platform
{
  id: 'kira',
  name: 'Kira',
  tagline: 'Your personalized AI thinking partner',
  problem: 'Generic AI assistants don\'t know your context and make you repeat yourself',
  description: 'Not one AI for everyone — a unique thinking partner built around YOUR specific goal. Whether it\'s career decisions, financial planning, business strategy, or life changes, Kira learns your context through voice conversation and remembers everything. She asks questions before jumping to answers, pushes back when something\'s unclear, and thinks WITH you instead of just answering. Personal journeys or business challenges — each Kira is built specifically for you.',
  url: 'https://kira-ai.vercel.app', // UPDATE: confirm actual URL
  status: 'live',
  hasVoiceAI: true,
  isGenerator: false, // Standalone product, not a generator
  category: 'voice-coaching',
  children: [],
}

// -----------------------------------------------------------------------------
// 3. NEW: ConferenceLingo - Based on TourLingo
// -----------------------------------------------------------------------------
// ADD this as a new parent platform (Building status)
{
  id: 'conferencelingo',
  name: 'ConferenceLingo',
  tagline: 'Multi-language AI for conference attendees',
  problem: 'International conference attendees struggle with language barriers',
  description: 'AI-powered multilingual assistant for conferences and events. Based on the TourLingo platform, ConferenceLingo helps conference organizers deliver real-time translation, session guidance, networking facilitation, and venue navigation in any language. Voice AI support for hands-free assistance.',
  url: 'https://tourlingo-operator.vercel.app', // Update when dedicated URL is ready
  status: 'building',
  hasVoiceAI: true,
  isGenerator: false,
  category: 'business-tools',
  children: [],
}

// -----------------------------------------------------------------------------
// 4. UPDATE: Marketplace Stats
// -----------------------------------------------------------------------------
// After adding Kira and ConferenceLingo, update the stats section:
// 
// File: /app/marketplace/page.tsx (or wherever stats are hardcoded)
// 
// BEFORE:
//   "9 Parent Platforms" | "3 Generators" | "9 White-Label Examples" | "6 With Voice AI"
// 
// AFTER:
//   "11 Parent Platforms" | "3 Generators" | "9 White-Label Examples" | "8 With Voice AI"
//        (+Kira, +ConferenceLingo)                                      (+Kira, +ConferenceLingo)

// OR better yet, make these dynamic:
const stats = [
  { value: getParentPlatformCount(), label: 'Parent Platforms' },
  { value: getGeneratorCount(), label: 'Generators' },
  { value: getWhiteLabelCount(), label: 'White-Label Examples' },
  { value: getVoiceAIPlatformCount(), label: 'With Voice AI' },
];

// -----------------------------------------------------------------------------
// 5. Voice AI Page Updates
// -----------------------------------------------------------------------------
// File: /app/voice-ai/page.tsx
// 
// Add Kira to the Voice AI showcase section with description:
// 
// "Kira — Your personalized AI thinking partner that learns your context 
// through voice conversation. Whether you're navigating career decisions, 
// financial planning, or business strategy, Kira asks the right questions 
// and thinks WITH you."

// -----------------------------------------------------------------------------
// 6. Helper Functions (add to constants.ts if not present)
// -----------------------------------------------------------------------------
export function getParentPlatformCount(): number {
  return PLATFORMS.filter(p => !p.parentId).length;
}

export function getGeneratorCount(): number {
  return PLATFORMS.filter(p => p.isGenerator).length;
}

export function getVoiceAIPlatformCount(): number {
  return PLATFORMS.filter(p => p.hasVoiceAI && !p.parentId).length;
}

export function getWhiteLabelCount(): number {
  return PLATFORMS.filter(p => p.parentId).length;
}

// -----------------------------------------------------------------------------
// 7. SUMMARY OF CHANGES
// -----------------------------------------------------------------------------
/*
| Platform        | Action  | Key Changes                                        |
|-----------------|---------|---------------------------------------------------|
| Connexions      | UPDATE  | Added "enhanced AI analysis" + "extract themes,   |
|                 |         | sentiment, actionable insights from surveys and   |
|                 |         | research interviews"                              |
|-----------------|---------|---------------------------------------------------|
| Kira            | NEW     | Standalone personalized AI thinking partner       |
|                 |         | - Voice AI: Yes                                   |
|                 |         | - Generator: No (standalone product)              |
|                 |         | - Category: voice-coaching                        |
|                 |         | - Status: live                                    |
|-----------------|---------|---------------------------------------------------|
| ConferenceLingo | NEW     | Multi-language AI for conferences (from TourLingo)|
|                 |         | - Voice AI: Yes                                   |
|                 |         | - Generator: No                                   |
|                 |         | - Category: business-tools                        |
|                 |         | - Status: building                                |
|-----------------|---------|---------------------------------------------------|

Stats Update:
- Parent Platforms: 9 → 11
- With Voice AI: 6 → 8
- Generators: 3 (unchanged)
- White-Label Examples: 9 (unchanged)
*/
