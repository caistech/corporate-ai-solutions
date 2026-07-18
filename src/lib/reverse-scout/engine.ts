/**
 * Reverse Scout LLM engine — Stage 1 (Capability Card) + Stage 2 (Pattern Abstraction).
 *
 * Direct Anthropic Messages API calls (no SDK), following the repo's classify.ts idiom:
 * one-shot request, JSON-only output, defensive parse. Stage 1 runs on Sonnet 5; Stage 2 —
 * the moat, the hardest reasoning — runs on Opus 4.8 (BUILD_SPEC §3, §5).
 *
 * The parse functions are exported for unit testing: LLM output is untrusted and every field
 * is validated before it reaches the DB.
 */

import type { CapabilityCard, CapabilityCardDraft, PatternDraft, SectorMapDraft, Adjacency } from './types'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const STAGE1_MODEL = 'claude-sonnet-5'
const STAGE2_MODEL = 'claude-opus-4-8'

/** Minimum number of non-obvious (adjacent/lateral) sectors Stage 2 must produce. */
export const MIN_NON_OBVIOUS_ADJACENCIES = 3

// ---------------------------------------------------------------------------
// Shared Anthropic call + JSON extraction
// ---------------------------------------------------------------------------

async function callAnthropic(model: string, prompt: string, maxTokens: number): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set on server')
  }

  const r = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(90_000),
  })

  if (!r.ok) {
    const text = await r.text()
    throw new Error(`Anthropic API failed (HTTP ${r.status}): ${text.slice(0, 300)}`)
  }

  const json = (await r.json()) as { content?: Array<{ type: string; text?: string }> }
  const rawText = json.content?.find((c) => c.type === 'text')?.text ?? ''
  if (!rawText) {
    throw new Error('Anthropic returned empty content')
  }
  return rawText
}

/** Pull the first balanced JSON object out of a model response (tolerates stray prose/fences). */
function extractJsonObject(rawText: string): unknown {
  const match = rawText.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0).map((v) => v.trim())
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

// ---------------------------------------------------------------------------
// Stage 1 — Capability Card
// ---------------------------------------------------------------------------

function buildStage1Prompt(assetName: string, sourceType: string, sourceText: string): string {
  return `You are analysing a software asset to produce a factual Capability Card. This is Stage 1
of a licensing-match pipeline — keep it strictly factual, with NO market claims, NO sector
speculation, and NO outreach language. That comes later.

Asset name: ${assetName}
Source type: ${sourceType}

Asset material:
"""
${sourceText}
"""

Return JSON only — no prose before or after, no code fences. Schema:

{
  "does_what": "one or two plain-language sentences: what the asset does",
  "primitive": "the reusable capability underneath the feature set, stated as a general mechanism (e.g. 'constrained resource allocation under time windows' rather than 'crew scheduling')",
  "inputs": ["the inputs it consumes"],
  "outputs": ["the outputs it produces"],
  "integration_surface": "api | embeddable | standalone (pick the closest, add a short qualifier if useful)",
  "maturity_level": "prototype | beta | production (best estimate from the material)",
  "dependencies": ["hard external dependencies — services, data, models it needs to run"],
  "reasoning": "one short paragraph: how you identified the underlying primitive"
}

The "primitive" is the most important field — it is what the next stage abstracts. Resist restating
the feature; name the general problem the code actually solves.`
}

export function parseCapabilityCard(rawText: string): CapabilityCardDraft {
  const obj = extractJsonObject(rawText)
  if (typeof obj !== 'object' || obj === null) {
    throw new Error(`Stage 1: could not parse JSON. Raw: ${rawText.slice(0, 400)}`)
  }
  const o = obj as Record<string, unknown>

  if (!nonEmptyString(o.does_what)) throw new Error('Stage 1: missing "does_what"')
  if (!nonEmptyString(o.primitive)) throw new Error('Stage 1: missing "primitive"')

  return {
    does_what: o.does_what.trim(),
    primitive: o.primitive.trim(),
    inputs: asStringArray(o.inputs),
    outputs: asStringArray(o.outputs),
    integration_surface: nonEmptyString(o.integration_surface) ? o.integration_surface.trim() : null,
    maturity_level: nonEmptyString(o.maturity_level) ? o.maturity_level.trim() : null,
    dependencies: asStringArray(o.dependencies),
    reasoning: nonEmptyString(o.reasoning) ? o.reasoning.trim() : '',
  }
}

export async function generateCapabilityCard(input: {
  name: string
  source_type: string
  source_text: string
}): Promise<CapabilityCardDraft> {
  if (!input.source_text.trim()) {
    throw new Error('Cannot generate a Capability Card from empty asset material')
  }
  const prompt = buildStage1Prompt(input.name, input.source_type, input.source_text)
  const rawText = await callAnthropic(STAGE1_MODEL, prompt, 1500)
  return parseCapabilityCard(rawText)
}

// ---------------------------------------------------------------------------
// Stage 2 — Pattern Abstraction (the moat)
// ---------------------------------------------------------------------------

function buildStage2Prompt(card: Pick<CapabilityCard, 'does_what' | 'primitive' | 'inputs' | 'outputs'>): string {
  return `You are performing cross-sector pattern abstraction — the defensible core of this product.
You are given a software capability. Do TWO moves, in order.

MOVE 1 — Strip the domain. Restate the capability as a domain-neutral problem-shape, with no
industry vocabulary at all (e.g. "constrained resource allocation under time windows with priority
rules", never "crew scheduling for construction").

MOVE 2 — Re-project. Enumerate sectors where that EXACT shape recurs. You MUST include at least
${MIN_NON_OBVIOUS_ADJACENCIES} genuinely NON-OBVIOUS sectors (adjacency "adjacent" or "lateral") —
reject lazy same-vertical answers. Every sector needs a CONCRETE rationale naming the specific
workflow in that sector where the shape appears. A sector without a real, specific rationale is worse
than no sector — omit it.

The capability:
- does_what: ${card.does_what}
- primitive: ${card.primitive}
- inputs: ${card.inputs.join(', ') || '(none listed)'}
- outputs: ${card.outputs.join(', ') || '(none listed)'}

Return JSON only — no prose before or after, no code fences. Schema:

{
  "abstract_problem_shape": "the domain-neutral shape in one precise sentence",
  "domain_stripped_desc": "a short paragraph describing the shape with zero industry vocabulary",
  "sectors": [
    {
      "sector": "the sector / industry",
      "adjacency": "core" | "adjacent" | "lateral",
      "rationale": "the SPECIFIC workflow in this sector where the shape recurs — concrete, not generic",
      "confidence": 0.0-1.0
    }
  ]
}

adjacency definitions:
- "core": the asset's own home domain or an obvious same-vertical neighbour
- "adjacent": a different industry that shares the workflow shape
- "lateral": a surprising, distant industry where the same shape unexpectedly recurs

Bias toward precision: a short list of defensible re-projections beats a long list of stretches.`
}

function coerceAdjacency(value: unknown): Adjacency | null {
  if (value === 'core' || value === 'adjacent' || value === 'lateral') return value
  return null
}

function coerceConfidence(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return 0.5
  return Math.min(1, Math.max(0, n))
}

export function parsePattern(rawText: string): PatternDraft {
  const obj = extractJsonObject(rawText)
  if (typeof obj !== 'object' || obj === null) {
    throw new Error(`Stage 2: could not parse JSON. Raw: ${rawText.slice(0, 400)}`)
  }
  const o = obj as Record<string, unknown>

  if (!nonEmptyString(o.abstract_problem_shape)) throw new Error('Stage 2: missing "abstract_problem_shape"')
  if (!nonEmptyString(o.domain_stripped_desc)) throw new Error('Stage 2: missing "domain_stripped_desc"')

  const rawSectors = Array.isArray(o.sectors) ? o.sectors : []
  const sectors: SectorMapDraft[] = []
  for (const raw of rawSectors) {
    if (typeof raw !== 'object' || raw === null) continue
    const s = raw as Record<string, unknown>
    const adjacency = coerceAdjacency(s.adjacency)
    // A sector is only useful with a real sector name, a concrete rationale, and a known adjacency.
    if (!nonEmptyString(s.sector) || !nonEmptyString(s.rationale) || !adjacency) continue
    sectors.push({
      sector: s.sector.trim(),
      adjacency,
      rationale: s.rationale.trim(),
      confidence: coerceConfidence(s.confidence),
    })
  }

  if (sectors.length === 0) {
    throw new Error('Stage 2: no valid sectors returned (each needs sector + concrete rationale + adjacency)')
  }

  return {
    abstract_problem_shape: o.abstract_problem_shape.trim(),
    domain_stripped_desc: o.domain_stripped_desc.trim(),
    sectors,
  }
}

export async function abstractPattern(
  card: Pick<CapabilityCard, 'does_what' | 'primitive' | 'inputs' | 'outputs'>,
): Promise<PatternDraft> {
  const prompt = buildStage2Prompt(card)
  const rawText = await callAnthropic(STAGE2_MODEL, prompt, 2500)
  return parsePattern(rawText)
}
