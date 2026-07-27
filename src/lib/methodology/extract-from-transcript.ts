// extractFromTranscript — the voice coach's COMPLETION BACKSTOP (VOICE_COACH_PLAN §3).
//
// The primary capture path is the agent's save_field tool (one DB write per field as it lands).
// This is the safety net: at call end, read the whole transcript and extract any field the agent
// captured conversationally but failed to save_field, so a missed tool-call can't strand a field.
// It fills GAPS only (applyCoachFields skips empties), and the admit gate re-validates regardless.
//
// NB this is a NET-NEW free-text extractor, NOT a refactor of the typed-turn fenced-block regex
// (extractAdmitPayload, new-ideas/route.ts) — a different, harder problem. Its risk is carried by
// the EVAL (the parser must never FABRICATE an absent field), not by the typed-path regression.

import { GRADED_FIELDS, FEASIBILITY_FIELDS, type CoachFieldInput } from './apply-coach-fields'
import { ANTHROPIC_API_URL, ANTHROPIC_MODEL, firstText, noThinking } from '@/lib/ai/anthropic-model'


export interface TranscriptTurn {
  role: 'user' | 'assistant'
  text: string
}

const GRADED = new Set<string>(GRADED_FIELDS)
const FEASIBILITY = new Set<string>(FEASIBILITY_FIELDS)

function nonEmpty(v: unknown): v is string {
  return typeof v === 'string' && v.trim() !== ''
}

/** The extraction system prompt — instructs the model to extract ONLY what is genuinely present. */
export function buildExtractionPrompt(): string {
  return [
    'You read a completed product-intake coaching transcript and extract the structured spec the',
    'operator confirmed. Output ONLY a single JSON object, no prose, of the form:',
    '{"fields": { ... }, "feasibility": { ... }}',
    '',
    `Allowed "fields" keys (the 14 graded fields): ${GRADED_FIELDS.join(', ')}.`,
    `Allowed "feasibility" keys: ${FEASIBILITY_FIELDS.join(', ')}.`,
    'demand_tier must be one of: intuition, anecdote, article, data, traction.',
    'distributor_benefit_mode must be one of: paid, value-add.',
    '',
    'HARD RULES:',
    '- Include a key ONLY if the operator genuinely answered it to a specific, non-generic degree.',
    '- If a field was not covered, or the answer was vague/placeholder ("SMEs", "it is useful"),',
    '  OMIT the key entirely. NEVER invent or guess a value. A missing field is correct and safe;',
    '  a fabricated one corrupts the spec.',
    '- Use the operator\'s own words, lightly cleaned. Do not summarise away specifics.',
  ].join('\n')
}

/**
 * Parse a model response into a validated CoachFieldInput. Pure + the security/anti-fabrication
 * boundary: tolerates prose-wrapped JSON, drops unknown keys and empty values, and validates the
 * two enums (an invalid enum is dropped, not guessed). Returns empty buckets on any parse failure
 * (degrade-don't-fake — the gate will 422 on the genuinely-missing field, no corruption).
 */
export function parseExtraction(modelText: string): CoachFieldInput {
  const fields: Record<string, string> = {}
  const feasibility: Record<string, string> = {}

  const match = modelText.match(/\{[\s\S]*\}/)
  if (!match) return { fields, feasibility }

  let parsed: { fields?: Record<string, unknown>; feasibility?: Record<string, unknown> }
  try {
    parsed = JSON.parse(match[0])
  } catch {
    return { fields, feasibility }
  }

  for (const [k, v] of Object.entries(parsed.fields ?? {})) {
    if (GRADED.has(k) && nonEmpty(v)) fields[k] = v.trim()
  }
  for (const [k, v] of Object.entries(parsed.feasibility ?? {})) {
    if (!FEASIBILITY.has(k) || !nonEmpty(v)) continue
    const value = v.trim()
    if (k === 'demand_tier' && !['intuition', 'anecdote', 'article', 'data', 'traction'].includes(value)) continue
    if (k === 'distributor_benefit_mode' && !['paid', 'value-add'].includes(value)) continue
    feasibility[k] = value
  }

  return { fields, feasibility }
}

/** Join a transcript into the user/coach text the extractor reads. */
export function renderTranscript(turns: TranscriptTurn[]): string {
  return turns.map((t) => `${t.role === 'user' ? 'Operator' : 'Coach'}: ${t.text}`).join('\n')
}

/**
 * Read a completed transcript and extract the captured 14-field + feasibility spec (backstop).
 * Returns empty buckets (not an error) if the API key is absent or the call fails — the backstop
 * degrades rather than blocks; the primary save_field path already wrote what it captured.
 */
export async function extractFromTranscript(
  turns: TranscriptTurn[],
  opts: { apiKey?: string } = {},
): Promise<CoachFieldInput> {
  const apiKey = opts.apiKey ?? process.env.ANTHROPIC_API_KEY
  if (!apiKey || turns.length === 0) return { fields: {}, feasibility: {} }

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        // 8192, not 1024: a rich 20-min transcript yields a large extraction JSON. At 1024 the JSON
        // was truncated mid-object → JSON.parse failed → the WHOLE extraction was lost (all-or-
        // nothing), which is exactly how the SafeFix backstop silently filled nothing. 8192 leaves
        // ample headroom for all 14 fields + feasibility; we only pay for tokens actually emitted.
        max_tokens: 8192,
        // Thinking off, for the same reason the cap above is 8192: on Sonnet 5 an omitted `thinking`
        // field means thinking is ON, and the cap covers thinking plus the answer — so the budget
        // reasoned about here would be shared with reasoning tokens and truncate the same JSON again.
        ...noThinking('low'),
        system: buildExtractionPrompt(),
        messages: [{ role: 'user', content: renderTranscript(turns) }],
      }),
    })
    if (!res.ok) {
      console.error('[extract-transcript] Anthropic error', res.status)
      return { fields: {}, feasibility: {} }
    }
    const data = await res.json()
    const text: string = firstText(data)
    // Surface truncation explicitly — if the model still hit the cap, the JSON may be partial and
    // the parse will salvage what it can; log it so a future under-extraction isn't silent.
    if (data.stop_reason === 'max_tokens') {
      console.warn('[extract-transcript] hit max_tokens — extraction may be partial', { turns: turns.length })
    }
    return parseExtraction(text)
  } catch (e) {
    console.error('[extract-transcript] failed', e instanceof Error ? e.message : e)
    return { fields: {}, feasibility: {} }
  }
}
