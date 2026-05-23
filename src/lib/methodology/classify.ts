/**
 * LLM classification of methodology validation responses.
 *
 * Direct Anthropic Messages API call (no SDK — keeps deps minimal). Follows
 * the same "one-shot call, never streaming, never tool_use" discipline that
 * InvestorPilot uses for its scoring + drafting calls. Single Sonnet request
 * per response classified.
 *
 * Input: the raw response text + the campaign's question list + the parent
 * card's hypothesis rows. Output: per-question signal + overall classification
 * + brief reasoning.
 */

export type ClassificationSignal =
  | 'confirms'
  | 'contradicts'
  | 'refines'
  | 'off-topic'
  | 'wants-more-info'

export interface HypothesisRow {
  field: string
  hypothesis_text: string
  validation_status?: string
  notes?: string
}

export interface ClassifyInput {
  response_text: string
  questions: string[]
  hypothesis_rows: HypothesisRow[]
}

export interface ClassifyOutput {
  per_question_signal: Record<string, ClassificationSignal>
  overall_classification: ClassificationSignal
  reasoning: string
}

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-5'

function buildPrompt(input: ClassifyInput): string {
  const questionsBlock = input.questions
    .map((q, i) => `${i}. ${q}`)
    .join('\n')

  const hypothesesBlock = input.hypothesis_rows.length > 0
    ? input.hypothesis_rows
        .map((h) => `- ${h.field}: ${h.hypothesis_text}`)
        .join('\n')
    : '(no hypotheses on file)'

  return `You are classifying a research-outreach response for a methodology validation campaign.

The campaign asked the following questions of the respondent:
${questionsBlock}

The methodology team has hypothesised:
${hypothesesBlock}

The respondent sent this reply:
"""
${input.response_text}
"""

Classify the response per question. Return JSON only — no prose before or after. Schema:

{
  "per_question_signal": {
    "0": "confirms" | "contradicts" | "refines" | "off-topic" | "wants-more-info",
    "1": "confirms" | "contradicts" | "refines" | "off-topic" | "wants-more-info",
    ...
  },
  "overall_classification": "confirms" | "contradicts" | "refines" | "off-topic" | "wants-more-info",
  "reasoning": "one-paragraph explanation grounded in the response text"
}

Signal definitions:
- "confirms" — the response supports the hypothesis behind this question (or supports the assumption the question is testing)
- "contradicts" — the response invalidates / falsifies the hypothesis
- "refines" — the response is on-topic and adds nuance the hypothesis didn't capture (could be partial confirmation, partial contradiction, or a useful third-way answer)
- "off-topic" — the response doesn't address the question
- "wants-more-info" — the respondent asks clarifying questions instead of answering

Pick "overall_classification" as the strongest signal across the per-question results. If responses are mixed, prefer "refines" over averaging.`
}

function isValidSignal(s: unknown): s is ClassificationSignal {
  return (
    s === 'confirms' ||
    s === 'contradicts' ||
    s === 'refines' ||
    s === 'off-topic' ||
    s === 'wants-more-info'
  )
}

function parseClassification(rawText: string, questionCount: number): ClassifyOutput | null {
  // Strip any leading/trailing prose around the JSON object
  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    return null
  }

  if (typeof parsed !== 'object' || parsed === null) return null
  const obj = parsed as Record<string, unknown>

  if (!isValidSignal(obj.overall_classification)) return null
  if (typeof obj.reasoning !== 'string') return null

  const pqs = obj.per_question_signal
  if (typeof pqs !== 'object' || pqs === null) return null

  const validatedPqs: Record<string, ClassificationSignal> = {}
  for (let i = 0; i < questionCount; i++) {
    const sig = (pqs as Record<string, unknown>)[String(i)]
    if (!isValidSignal(sig)) return null
    validatedPqs[String(i)] = sig
  }

  return {
    per_question_signal: validatedPqs,
    overall_classification: obj.overall_classification,
    reasoning: obj.reasoning,
  }
}

export async function classifyResponse(input: ClassifyInput): Promise<ClassifyOutput> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set on server')
  }

  const prompt = buildPrompt(input)

  const r = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(45_000),
  })

  if (!r.ok) {
    const text = await r.text()
    throw new Error(`Anthropic API failed (HTTP ${r.status}): ${text.slice(0, 300)}`)
  }

  const json = (await r.json()) as {
    content?: Array<{ type: string; text?: string }>
  }

  const rawText = json.content?.find((c) => c.type === 'text')?.text ?? ''
  if (!rawText) {
    throw new Error('Anthropic returned empty content')
  }

  const parsed = parseClassification(rawText, input.questions.length)
  if (!parsed) {
    throw new Error(`Failed to parse classification JSON. Raw: ${rawText.slice(0, 500)}`)
  }

  return parsed
}
