// One place for the Anthropic model id and the two things every caller here gets wrong.
//
// WHY THIS FILE EXISTS: `claude-sonnet-4-20250514` retired on 2026-06-15 and was hardcoded in FOUR
// separate call sites (new-ideas, generate-icp, distil-coach-memory, extract-from-transcript). Every
// one of them started returning 404 on the same day, and because all four degrade to "[]" or "" on
// error, nothing surfaced it — the coach silently distilled 0 memories from 7 real conversations for
// six weeks. A retirement date passing should break one line, not four, and it should be findable.
//
// When the next retirement lands, change ANTHROPIC_MODEL here.

/**
 * Current model for this repo's LLM calls.
 *
 * Successor to the retired `claude-sonnet-4-20250514`, keeping the Sonnet tier these calls were
 * written for rather than silently changing cost profile. Note Sonnet 5 uses a new tokenizer — the
 * same text counts ~30% more tokens than on Sonnet 4 — so `max_tokens` values inherited from the old
 * model have less headroom than they look like they do.
 */
export const ANTHROPIC_MODEL = 'claude-sonnet-5'

export const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

/**
 * The request fields that keep a bounded extraction call from silently returning nothing.
 *
 * On Sonnet 5, adaptive thinking is ON when the `thinking` field is omitted — a change from Sonnet 4,
 * where omitting it meant no thinking. `max_tokens` caps thinking PLUS response text together, so a
 * call sized for its answer alone (1024, 2000, 2048…) can spend the budget thinking and truncate the
 * JSON it was supposed to return. Every caller here parses that JSON and degrades quietly to empty,
 * so the failure would look exactly like "the model found nothing worth extracting."
 *
 * `effort` is the token-spend dial: 'low' for extraction and classification, 'medium' where the call
 * is genuinely generative.
 */
export function noThinking(effort: 'low' | 'medium' | 'high' = 'low') {
  return { thinking: { type: 'disabled' as const }, output_config: { effort } }
}

/**
 * Pull the assistant's text out of a Messages API response.
 *
 * Every call site read `data.content?.[0]?.text`, which assumes the first block is text. It is not
 * guaranteed to be: with thinking enabled the first block is a `thinking` block, `.text` is
 * undefined, and the caller sees an empty extraction rather than an error. Find the text block
 * instead of trusting its position.
 *
 * Returns '' when the response carries no text at all — which is also what a safety refusal looks
 * like (HTTP 200, `stop_reason: 'refusal'`, no text), so callers keep their existing degrade path.
 */
export function firstText(data: unknown): string {
  const blocks = (data as { content?: unknown })?.content
  if (!Array.isArray(blocks)) return ''
  for (const block of blocks) {
    if (block && typeof block === 'object' && (block as { type?: unknown }).type === 'text') {
      const text = (block as { text?: unknown }).text
      if (typeof text === 'string') return text
    }
  }
  return ''
}
