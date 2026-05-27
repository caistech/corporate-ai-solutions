// Pool discovery + assessment — Build #4 (HARNESS_BUILD_WORKLIST.md #4), phases 2 & 3.
//
// The "is this pool real?" + "derive the streams" half of hybrid pool-discovery. A card
// carries two pool HYPOTHESES at ingestion (idea_card.distributor + idea_card.end_user_pool,
// produced by the phase-1 office-hours dialogue). This module:
//   phase 2 — gathers evidence (Brave) that each pool is a real, reachable population, then has
//             an LLM ASSESS it (real-reachable / weak / reject) and PROPOSE a better-fit pool when
//             weak/reject — a back-and-forth the operator drives, not one-shot.
//   phase 3 — derives, per stream, an ICP description + interview questions from the AGREED pool
//             (replacing the operator-typed ICP + InvestorPilot's 180-char raw-query truncation).
//
// Compose, don't build bespoke (decision locked 2026-05-27): evidence = @caistech/brave-search
// (the hub primitive IP already uses — never a local fork); the LLM call follows the in-repo
// classify.ts direct-fetch pattern (the cockpit deliberately avoids the SDK), NOT @caistech/ai-client.
//
// Pure helpers (queries / prompts / parsers) are exported + unit-tested; the orchestration takes
// injectable {search, complete} deps so it's testable without network or keys.

import { braveWebSearch, type BraveSearchResult } from '@caistech/brave-search'

export type PoolKind = 'distributor' | 'end-user'
export type PoolVerdict = 'real-reachable' | 'weak' | 'reject'
export type CampaignType = 'target-user' | 'distributor-candidate'

export interface ProposedPool {
  description: string
  rationale: string
}

export interface PoolAssessment {
  kind: PoolKind
  hypothesis: string
  verdict: PoolVerdict
  rationale: string
  /** A better-fit pool the LLM proposes when the hypothesis is weak/reject (else null). */
  proposed_pool: ProposedPool | null
  evidence: BraveSearchResult[]
  evidence_count: number
}

export interface StreamSpec {
  campaign_type: CampaignType
  icp_description: string
  questions: string[]
}

/** Injectable dependencies — production defaults call Brave + Anthropic; tests pass mocks. */
export interface PoolDiscoveryDeps {
  search?: (query: string) => Promise<BraveSearchResult[]>
  complete?: (prompt: string) => Promise<string>
}

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-5'

const KIND_LABEL: Record<PoolKind, string> = {
  distributor:
    'DISTRIBUTOR pool — operators who ALREADY have a book of customers and would ONSELL this to them (e.g. a singing school, a VC accelerator, an accountancy firm). NOT end users. "SMBs" is not an answer.',
  'end-user': 'END-USER pool — the specific people who would actually USE this product day to day.',
}

const POOL_TO_CAMPAIGN: Record<PoolKind, CampaignType> = {
  distributor: 'distributor-candidate',
  'end-user': 'target-user',
}

const STREAM_GOAL: Record<PoolKind, string> = {
  distributor: 'tests "will someone ONSELL this?" — would this operator put it in front of their book of customers, and what would make them.',
  'end-user': 'tests "does the end user WANT this?" — the pain, the status quo they use today, and whether they\'d switch.',
}

// ── pure helpers (exported for unit tests) ──────────────────────────────────

/** Two web queries per pool: who they are, and whether they're a reachable population. */
export function buildPoolQueries(hypothesis: string): string[] {
  const h = hypothesis.trim().replace(/\s+/g, ' ').slice(0, 160)
  return [h, `${h} association OR directory OR marketplace`]
}

export function buildAssessPrompt(kind: PoolKind, hypothesis: string, evidence: BraveSearchResult[]): string {
  const evidenceBlock = evidence.length
    ? evidence.map((r, i) => `${i + 1}. ${r.title}\n   ${r.url}\n   ${r.description}`).join('\n')
    : '(no web evidence found — treat the existence of a reachable population as UNSUPPORTED)'

  return `You are pressure-testing a research-pool hypothesis for a product-validation pipeline.

POOL TYPE: ${KIND_LABEL[kind]}

THE HYPOTHESISED POOL:
"""
${hypothesis}
"""

WEB EVIDENCE gathered for this pool:
${evidenceBlock}

Decide whether this is a REAL, REACHABLE population we could source contacts from for outreach.
- "real-reachable" — the evidence shows a concrete, identifiable, contactable population (directories, associations, marketplaces, named cohorts).
- "weak" — plausibly exists but is vague, tiny, or hard to reach as described; needs sharpening.
- "reject" — not a coherent reachable population (e.g. "everyone", "SMBs", a category not a cohort).

If "weak" or "reject", PROPOSE a sharper, better-fit pool of the SAME type that the evidence supports.

Return JSON only — no prose before or after. Schema:
{
  "verdict": "real-reachable" | "weak" | "reject",
  "rationale": "one or two sentences grounded in the evidence",
  "proposed_pool": { "description": "...", "rationale": "..." } | null
}
"proposed_pool" must be null when verdict is "real-reachable".`
}

function isVerdict(s: unknown): s is PoolVerdict {
  return s === 'real-reachable' || s === 'weak' || s === 'reject'
}

/** Extract + validate the assessment JSON. Returns null on any malformation (caller decides). */
export function parsePoolAssessment(raw: string): {
  verdict: PoolVerdict
  rationale: string
  proposed_pool: ProposedPool | null
} | null {
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
  if (!isVerdict(o.verdict)) return null
  if (typeof o.rationale !== 'string') return null

  let proposed: ProposedPool | null = null
  if (o.proposed_pool && typeof o.proposed_pool === 'object') {
    const p = o.proposed_pool as Record<string, unknown>
    if (typeof p.description === 'string' && typeof p.rationale === 'string') {
      proposed = { description: p.description, rationale: p.rationale }
    }
  }
  // A real-reachable pool never carries a proposal; a weak/reject one keeps whatever was given.
  if (o.verdict === 'real-reachable') proposed = null
  return { verdict: o.verdict, rationale: o.rationale, proposed_pool: proposed }
}

export function buildStreamSpecPrompt(kind: PoolKind, hypothesis: string): string {
  return `You are preparing a validation outreach stream for a product-development pipeline.

This stream targets the ${KIND_LABEL[kind]}

The agreed, evidence-checked pool is:
"""
${hypothesis}
"""

This stream ${STREAM_GOAL[kind]}

Produce:
1. "icp_description" — a rich, specific ideal-customer-profile paragraph for sourcing real contacts in this pool (roles, where they congregate, signals that identify them). Do NOT truncate — be specific; downstream tooling derives its own search query from this.
2. "questions" — 4 to 6 short interview questions a voice agent will ask members of this pool to ${kind === 'distributor' ? 'establish onsell intent' : 'establish demand'}.

Return JSON only — no prose before or after. Schema:
{ "icp_description": "...", "questions": ["...", "..."] }`
}

/** Extract + validate the stream spec JSON. */
export function parseStreamSpec(raw: string): { icp_description: string; questions: string[] } | null {
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
  if (typeof o.icp_description !== 'string' || o.icp_description.trim().length < 10) return null
  if (!Array.isArray(o.questions)) return null
  const questions = o.questions.filter((q): q is string => typeof q === 'string' && q.trim().length > 0)
  if (questions.length < 1) return null
  return { icp_description: o.icp_description.trim(), questions: questions.slice(0, 20) }
}

// ── network wrappers (production defaults) ──────────────────────────────────

function requireBraveKey(): string {
  const key = process.env.BRAVE_API_KEY
  if (!key) throw new Error('BRAVE_API_KEY not set on server')
  return key
}

async function defaultSearch(query: string): Promise<BraveSearchResult[]> {
  return braveWebSearch(query, requireBraveKey(), { count: 8, country: 'AU', signal: AbortSignal.timeout(20_000) })
}

async function defaultComplete(prompt: string): Promise<string> {
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

// ── orchestration ───────────────────────────────────────────────────────────

/** Gather web evidence for a pool hypothesis (deduped by URL). */
export async function gatherPoolEvidence(hypothesis: string, deps?: PoolDiscoveryDeps): Promise<BraveSearchResult[]> {
  const search = deps?.search ?? defaultSearch
  const queries = buildPoolQueries(hypothesis)
  const batches = await Promise.all(queries.map((q) => search(q).catch(() => [] as BraveSearchResult[])))
  const seen = new Set<string>()
  const out: BraveSearchResult[] = []
  for (const r of batches.flat()) {
    if (seen.has(r.url)) continue
    seen.add(r.url)
    out.push(r)
  }
  return out.slice(0, 12)
}

/** Phase 2 — evidence-gather + LLM-assess a single pool hypothesis. */
export async function assessPool(kind: PoolKind, hypothesis: string, deps?: PoolDiscoveryDeps): Promise<PoolAssessment> {
  const complete = deps?.complete ?? defaultComplete
  const evidence = await gatherPoolEvidence(hypothesis, deps)
  const raw = await complete(buildAssessPrompt(kind, hypothesis, evidence))
  const parsed = parsePoolAssessment(raw)
  if (!parsed) throw new Error(`Failed to parse pool assessment. Raw: ${raw.slice(0, 400)}`)
  return { kind, hypothesis, ...parsed, evidence, evidence_count: evidence.length }
}

/** Phase 2 — assess both pools in parallel. */
export async function assessBothPools(
  pools: { distributor: string; endUser: string },
  deps?: PoolDiscoveryDeps
): Promise<{ distributor: PoolAssessment; endUser: PoolAssessment }> {
  const [distributor, endUser] = await Promise.all([
    assessPool('distributor', pools.distributor, deps),
    assessPool('end-user', pools.endUser, deps),
  ])
  return { distributor, endUser }
}

/** Phase 3 — derive an InvestorPilot stream spec (ICP + questions) from an agreed pool. */
export async function deriveStreamSpec(kind: PoolKind, hypothesis: string, deps?: PoolDiscoveryDeps): Promise<StreamSpec> {
  const complete = deps?.complete ?? defaultComplete
  const raw = await complete(buildStreamSpecPrompt(kind, hypothesis))
  const parsed = parseStreamSpec(raw)
  if (!parsed) throw new Error(`Failed to parse stream spec. Raw: ${raw.slice(0, 400)}`)
  return { campaign_type: POOL_TO_CAMPAIGN[kind], ...parsed }
}

/** A compact, human-readable summary of an assessment for persisting on the card (idea_card values are strings). */
export function summariseAssessment(a: PoolAssessment): string {
  const lines = [`[${a.verdict}] ${a.kind}: ${a.rationale} (evidence: ${a.evidence_count} results)`]
  if (a.proposed_pool) lines.push(`  proposed: ${a.proposed_pool.description} — ${a.proposed_pool.rationale}`)
  return lines.join('\n')
}
