// distil-coach-memory — the cockpit's MemoryExtractor for the voice-memory loop's PERSIST+DISTIL
// leg (VOICE_MEMORY_STANDARD §F). The hub's distillConversationToMemory orchestrates (read messages
// → this fn → handleSaveMemory); this supplies the product-specific "what's worth remembering".
//
// For the intake coach (Morgan), durable memory = who the operator is, what product they're shaping,
// and any standing preference/decision — so a NEXT session recalls them instead of starting cold.
// This is the recall layer (free-form), distinct from the 14 captured card FIELDS (domain data).

import type { DistilledMemory, MemoryExtractor } from '@caistech/elevenlabs-convai'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'
const VALID_TYPES = new Set(['preference', 'context', 'goal', 'decision', 'followup', 'correction', 'insight'])

function buildPrompt(): string {
  return [
    'You read a completed product-intake voice conversation and extract the DURABLE memories worth',
    'recalling when this operator returns in a future session. Output ONLY a JSON array of objects:',
    '[{"content": "...", "memoryType": "...", "importance": 1-10, "tags": ["..."]}]',
    '',
    'memoryType is one of: preference, context, goal, decision, followup, correction, insight.',
    '',
    'HARD RULES:',
    '- Keep ONLY durable, recall-worthy facts: who the operator is, the product being shaped and its',
    '  shape, standing preferences, decisions made, and open follow-ups. 3-8 items is typical.',
    '- OMIT transient conversational chatter, pleasantries, and anything already obvious from a single',
    '  field. Each memory is a standalone sentence in the operator\'s framing.',
    '- NEVER invent. If nothing durable was said, return [].',
    '- importance: 8-10 = identity/product-defining, 4-7 = useful context, 1-3 = minor.',
  ].join('\n')
}

function parseMemories(text: string): DistilledMemory[] {
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) return []
  let arr: unknown
  try {
    arr = JSON.parse(match[0])
  } catch {
    return []
  }
  if (!Array.isArray(arr)) return []
  const out: DistilledMemory[] = []
  for (const it of arr) {
    if (!it || typeof it !== 'object') continue
    const o = it as Record<string, unknown>
    const content = typeof o.content === 'string' ? o.content.trim() : ''
    const memoryType = typeof o.memoryType === 'string' ? o.memoryType : ''
    if (!content || !VALID_TYPES.has(memoryType)) continue
    const importance = typeof o.importance === 'number' ? Math.min(10, Math.max(1, Math.round(o.importance))) : 5
    const tags = Array.isArray(o.tags) ? o.tags.filter((t): t is string => typeof t === 'string') : []
    out.push({ content, memoryType: memoryType as DistilledMemory['memoryType'], importance, tags })
  }
  return out
}

/** The MemoryExtractor handed to distillConversationToMemory. Degrades to [] on missing key/error. */
export const coachMemoryExtractor: MemoryExtractor = async (turns) => {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || turns.length === 0) return []
  const transcript = turns.map((t) => `${t.role === 'user' ? 'Operator' : 'Morgan'}: ${t.content}`).join('\n')
  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        system: buildPrompt(),
        messages: [{ role: 'user', content: transcript }],
      }),
    })
    if (!res.ok) {
      console.error('[distil-coach-memory] Anthropic error', res.status)
      return []
    }
    const data = await res.json()
    return parseMemories(data.content?.[0]?.text ?? '')
  } catch (e) {
    console.error('[distil-coach-memory] failed', e instanceof Error ? e.message : e)
    return []
  }
}
