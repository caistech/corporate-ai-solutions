// Evidence-proposed triage + decision — Build #3 (HARNESS_BUILD_WORKLIST.md #3).
//
// Today the Gate-0 triage state and the Gate-2 go/no-go are 100% operator gut. This module makes
// the harness PROPOSE both from evidence; the operator confirms (human-in-the-loop) or overrides
// with a logged reason. It is the BRIDGE that was missing: the §5 scorer (demand-score.ts) is pure
// and takes five 0–10 dimensions — but interview evidence isn't five numbers. An LLM judge reads
// the evidence and emits the dimensions; scoreDemand() then produces GO/REDESIGN/NO-GO.
//
// One proposer, two modes (covers both halves of #3):
//   - 'hypothesis' (Gate 0) — judge desk research (idea card + demand notes) → all five dimensions,
//     confidence-flagged. Proposes the TRIAGE action (move to research / redesign-to-fit / kill).
//   - 'evidence'   (Gate 2) — judge the two interview streams → the four interview-derivable
//     dimensions (pain/gap from the end-user stream, onsell/reach from the distributor stream);
//     build_fit is factory-internal (not an interview question) so it's carried in from the desk
//     pass. Proposes the GO/NO-GO decision.
//
// Compose, don't rebuild: this calls the existing pure scoreDemand(); it adds only the judge bridge
// + the proposal framing. The LLM call follows the in-repo classify.ts / pool-discovery direct-fetch
// pattern (the cockpit deliberately avoids the SDK). Pure helpers (prompt/parse/map) are exported +
// unit-tested; orchestration takes an injectable {judge} dep so it's testable without network or keys.

import {
  scoreDemand,
  type DemandScoreResult,
  type DimensionInput,
  type DimensionKey,
  type Confidence,
} from './demand-score'

export type ProposerMode = 'hypothesis' | 'evidence'

/** The judge's verdict for one §5 dimension. */
export interface JudgedDimension {
  score: number // 0–10
  confidence: Confidence
  rationale: string
}

export type JudgedDimensions = Partial<Record<DimensionKey, JudgedDimension>>

/** Aggregated evidence for one validation stream (assembled from the roll-up + return-leg summaries). */
export interface StreamEvidence {
  campaign_type: 'distributor-candidate' | 'target-user'
  interview_count: number
  signal_counts: { confirms: number; contradicts: number; refines: number }
  /** Structured feedback summaries from completed interviews (the Connexions return leg). */
  summaries: string[]
}

/** Gate-2 input — the two interview streams + the carried-in build_fit (not interview-derivable). */
export interface EvidenceProposalInput {
  mode: 'evidence'
  product_slug: string
  what_it_is: string
  distributor: StreamEvidence
  endUser: StreamEvidence
  /** Factory-internal dimension carried from the desk/hypothesis pass. 0–10. */
  buildFit: { score: number; rationale?: string }
  /** §5 personal-interest override lane — bypasses the onsell gate with a logged reason. */
  personalInterestOverride?: { reason: string } | null
}

/** Gate-0 input — desk research only (no interviews yet). */
export interface HypothesisProposalInput {
  mode: 'hypothesis'
  product_slug: string
  what_it_is: string
  /** demand_evidence + idea-card desk research the ideation agent recorded. */
  desk_notes: string
  personalInterestOverride?: { reason: string } | null
}

export type ProposerInput = EvidenceProposalInput | HypothesisProposalInput

/** What the operator is being asked to confirm — the band mapped to a pipeline action. */
export interface SuggestedAction {
  gate: 'gate-0' | 'gate-2'
  action: 'move-to-research' | 'redesign-to-fit' | 'kill' | 'go-full-build' | 'no-go'
  label: string
}

export interface DecisionProposal {
  mode: ProposerMode
  product_slug: string
  /** The §5 score the proposal is built on (gate state, band, per-dimension breakdown). */
  score: DemandScoreResult
  /** The judge's per-dimension reads (score + confidence + rationale), for the cockpit to show WHY. */
  judged: JudgedDimensions
  suggested: SuggestedAction
  /** Always true — this is a proposal, never an auto-decision (engine policy: human-in-the-loop). */
  requiresConfirm: true
}

/** Injectable dependency — production default calls Anthropic; tests pass a mock. */
export interface ProposerDeps {
  judge?: (prompt: string) => Promise<string>
}

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-5'

// pain/gap come from the end-user stream; onsell/reach from the distributor stream.
const EVIDENCE_KEYS: DimensionKey[] = ['pain', 'gap', 'onsell', 'reach']
const ALL_KEYS: DimensionKey[] = ['pain', 'gap', 'onsell', 'reach', 'build_fit']

const DIMENSION_BRIEF: Record<DimensionKey, string> = {
  pain: 'pain severity — how acute/frequent/expensive is the end-user problem today (from the END-USER stream).',
  gap: 'market gap strength — how poorly served is this need by current alternatives (from the END-USER stream).',
  onsell:
    'distributor onsell opportunity — would an operator with a book of customers actually put this in front of them, and what would make them (from the DISTRIBUTOR stream). This is the §5 HARD GATE.',
  reach:
    'reachable market size — how large + addressable is the population (Σ distributors × book size), evidenced by the DISTRIBUTOR stream.',
  build_fit: 'factory build-fit — can we ship this cheap/fast on the existing @caistech substrate (factory-internal; not an interview question).',
}

// ── pure helpers (exported for unit tests) ──────────────────────────────────

function streamBlock(s: StreamEvidence): string {
  const { confirms, contradicts, refines } = s.signal_counts
  const summaries = s.summaries.length
    ? s.summaries.map((t, i) => `  ${i + 1}. ${t}`).join('\n')
    : '  (no interview summaries recorded)'
  return [
    `${s.campaign_type} — ${s.interview_count} interview(s); signals: ${confirms} confirm / ${contradicts} contradict / ${refines} refine`,
    summaries,
  ].join('\n')
}

/** The judge prompt. Evidence mode scores the 4 interview-derivable dims; hypothesis mode scores all 5. */
export function buildJudgePrompt(input: ProposerInput): string {
  const keys = input.mode === 'evidence' ? EVIDENCE_KEYS : ALL_KEYS
  const dimSpec = keys.map((k) => `- "${k}": ${DIMENSION_BRIEF[k]}`).join('\n')

  const evidenceBlock =
    input.mode === 'evidence'
      ? `TWO-STREAM INTERVIEW EVIDENCE:\n\nDISTRIBUTOR STREAM:\n${streamBlock(input.distributor)}\n\nEND-USER STREAM:\n${streamBlock(input.endUser)}`
      : `DESK RESEARCH (no interviews yet — score as HYPOTHESES, and set confidence honestly low where the evidence is thin):\n"""\n${input.desk_notes || '(no desk notes recorded)'}\n"""`

  return `You are scoring a product's demand for a validation pipeline, applying a fixed rubric uniformly (not gut feel).

PRODUCT: ${input.product_slug}
WHAT IT IS: ${input.what_it_is || '(not described)'}

${evidenceBlock}

Score EACH of these dimensions 0–10 (0 = no support, 10 = overwhelming), grounded ONLY in the material above:
${dimSpec}

For each dimension give: "score" (0–10), "confidence" ("high" | "medium" | "low"), "rationale" (one sentence citing the evidence).
${input.mode === 'evidence' ? 'Score ONLY the four dimensions listed (build_fit is supplied separately).' : 'Score ALL five dimensions.'}

Return JSON only — no prose before or after. Schema:
{
${keys.map((k) => `  "${k}": { "score": 0, "confidence": "low", "rationale": "..." }`).join(',\n')}
}`
}

const isConfidence = (s: unknown): s is Confidence => s === 'high' || s === 'medium' || s === 'low'
const clamp10 = (n: unknown): number =>
  typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.min(10, n)) : 0

/** Extract + validate the judge JSON. Returns only the keys present + well-formed (caller decides on gaps). */
export function parseJudgedDimensions(raw: string, mode: ProposerMode): JudgedDimensions | null {
  const m = raw.match(/\{[\s\S]*\}/)
  if (!m) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(m[0])
  } catch {
    return null
  }
  if (typeof parsed !== 'object' || parsed === null) return null
  const o = parsed as Record<string, unknown>
  const keys = mode === 'evidence' ? EVIDENCE_KEYS : ALL_KEYS
  const out: JudgedDimensions = {}
  for (const k of keys) {
    const d = o[k]
    if (!d || typeof d !== 'object') continue
    const dd = d as Record<string, unknown>
    out[k] = {
      score: clamp10(dd.score),
      confidence: isConfidence(dd.confidence) ? dd.confidence : 'low',
      rationale: typeof dd.rationale === 'string' ? dd.rationale : '',
    }
  }
  // Need at least one parsed dimension to be a usable read.
  return Object.keys(out).length > 0 ? out : null
}

/** Map the judge's reads (+ carried build_fit in evidence mode) to the scorer's DimensionInput[]. */
export function judgedToDimensionInputs(
  judged: JudgedDimensions,
  carried?: { build_fit?: { score: number; rationale?: string } }
): DimensionInput[] {
  const inputs: DimensionInput[] = []
  for (const key of ALL_KEYS) {
    if (key === 'build_fit' && carried?.build_fit) {
      inputs.push({ key, score: clamp10(carried.build_fit.score), rationale: carried.build_fit.rationale ?? null })
      continue
    }
    const d = judged[key]
    if (d) inputs.push({ key, score: d.score, confidence: d.confidence, rationale: d.rationale })
    // A key neither judged nor carried is omitted → scoreDemand counts it as 0 (prove, don't assume).
  }
  return inputs
}

/** Band + mode → the pipeline action the operator is being asked to confirm. */
export function suggestedActionFor(mode: ProposerMode, band: DemandScoreResult['band']): SuggestedAction {
  if (mode === 'hypothesis') {
    if (band === 'GO') return { gate: 'gate-0', action: 'move-to-research', label: 'Move to research (validate this)' }
    if (band === 'REDESIGN') return { gate: 'gate-0', action: 'redesign-to-fit', label: 'Redesign-to-fit before research' }
    return { gate: 'gate-0', action: 'kill', label: 'Kill — or apply the personal-interest override' }
  }
  if (band === 'GO') return { gate: 'gate-2', action: 'go-full-build', label: 'GO — release the full build' }
  if (band === 'REDESIGN') return { gate: 'gate-2', action: 'redesign-to-fit', label: 'Redesign-to-fit' }
  return { gate: 'gate-2', action: 'no-go', label: 'No-go' }
}

// ── network wrapper (production default) ─────────────────────────────────────

async function defaultJudge(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set on server')
  const r = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, max_tokens: 1024, messages: [{ role: 'user', content: prompt }] }),
    signal: AbortSignal.timeout(45_000),
  })
  if (!r.ok) {
    const text = await r.text()
    throw new Error(`Anthropic API failed (HTTP ${r.status}): ${text.slice(0, 300)}`)
  }
  const json = (await r.json()) as { content?: Array<{ type: string; text?: string }> }
  const text = json.content?.find((c) => c.type === 'text')?.text ?? ''
  if (!text) throw new Error('Anthropic returned empty content')
  return text
}

// ── orchestration ────────────────────────────────────────────────────────────

/**
 * Propose a triage (Gate 0, hypothesis mode) or go/no-go (Gate 2, evidence mode) decision from
 * evidence. Runs the judge → scores with the pure §5 rubric → frames the band as a pipeline action.
 * Never decides — `requiresConfirm` is always true (the operator confirms or overrides).
 */
export async function proposeDecision(input: ProposerInput, deps?: ProposerDeps): Promise<DecisionProposal> {
  const judge = deps?.judge ?? defaultJudge
  const prompt = buildJudgePrompt(input)

  // Retry the judge call+parse — a single transient hiccup (ECONNRESET on the Anthropic fetch,
  // or a rare unparseable generation) must not fail the proposal. Same resilience pattern as
  // pool-discovery's completeAndParse (measured: ~21% ECONNRESET per call on a home network).
  let judged: JudgedDimensions | null = null
  let lastErr = 'Failed to parse judged dimensions.'
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const raw = await judge(prompt)
      judged = parseJudgedDimensions(raw, input.mode)
      if (judged) break
      lastErr = `Failed to parse judged dimensions. Raw: ${raw.slice(0, 400)}`
    } catch (e) {
      lastErr = (e as Error).message
    }
    if (attempt < 3) await new Promise((r) => setTimeout(r, 250 * attempt)) // brief backoff
  }
  if (!judged) throw new Error(lastErr)

  const carried = input.mode === 'evidence' ? { build_fit: input.buildFit } : undefined
  const dimensions = judgedToDimensionInputs(judged, carried)

  const score = scoreDemand({
    mode: input.mode,
    dimensions,
    personalInterestOverride: input.personalInterestOverride ?? null,
  })

  return {
    mode: input.mode,
    product_slug: input.product_slug,
    score,
    judged,
    suggested: suggestedActionFor(input.mode, score.band),
    requiresConfirm: true,
  }
}
