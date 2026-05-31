import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Shared mutable holder so the hoisted vi.mock factory can read a per-test client.
const h = vi.hoisted(() => ({
  client: null as any,
  captured: [] as { table: string; op: 'insert' | 'update'; payload: any }[],
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => h.client,
  supabase: h.client,
}))

import { POST as surveyPOST } from '../survey/route'
import { POST as recalcPOST } from '../recalculate-score/route'
import { SURVEY_FIELDS, type SurveyField } from '@/lib/methodology/survey'

// ── A chainable Supabase mock ────────────────────────────────────────────────
// from(table) → builder; chainable no-ops return the builder; terminals
// (maybeSingle/single/await) resolve to responses[table]; insert/update capture
// their payload so we can assert what the route wrote.
function makeClient(responses: Record<string, { data?: any; error?: any }>) {
  const builder = (table: string) => {
    const result = responses[table] ?? { data: null, error: null }
    const b: any = {
      select: () => b,
      eq: () => b,
      order: () => b,
      limit: () => b,
      update: (payload: any) => {
        h.captured.push({ table, op: 'update', payload })
        return b
      },
      insert: (payload: any) => {
        h.captured.push({ table, op: 'insert', payload })
        return Promise.resolve(responses[table] ?? { error: null })
      },
      maybeSingle: () => Promise.resolve(result),
      single: () => Promise.resolve(result),
      then: (res: any, rej: any) => Promise.resolve(result).then(res, rej),
    }
    return b
  }
  return { from: (t: string) => builder(t) }
}

const ALL_FIELDS = SURVEY_FIELDS.map((f) => f.field)
const filledRow = (over: Partial<Record<string, any>> = {}) => ({
  mvp_url: 'https://build.example',
  ...Object.fromEntries(ALL_FIELDS.map((f) => [f, 'value'])),
  ...over,
})
const evidenceFields = (n = ALL_FIELDS.length) =>
  ALL_FIELDS.map((f, i) => ({ field: f, evidenced: i < n, evidence: i < n ? `dom:${i}` : null }))
const allPreHardPass = { P1: { status: 'pass' }, P2: { status: 'pass' }, P3: { status: 'pass' }, P4: { status: 'pass' } }

const mockFetchStatus = (status: number) => {
  global.fetch = vi.fn().mockResolvedValue({ status }) as any
}
const req = (body: any) => ({ json: async () => body }) as any
const ctx = (slug = 'demo') => ({ params: { productId: slug } })

beforeEach(() => {
  h.captured = []
  h.client = null
})
afterEach(() => {
  vi.restoreAllMocks()
})

// ── Survey route ─────────────────────────────────────────────────────────────
describe('POST /survey — handler', () => {
  it('RENOVATION: full spec + 14/14 evidenced + live + P1-3 → 201 pass, gate bound', async () => {
    h.client = makeClient({ product_validation_status: { data: filledRow() }, pipeline_gates: { error: null } })
    mockFetchStatus(200)

    const res = await surveyPOST(
      req({ fields: evidenceFields(), pre_hard: allPreHardPass, deployment_id: 'dep_123' }),
      ctx(),
    )
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.verdict).toBe('RENOVATION')
    expect(json.gate_status).toBe('pass')

    const gate = h.captured.find((c) => c.table === 'pipeline_gates')!
    expect(gate.payload).toMatchObject({
      product_slug: 'demo',
      gate: 'survey',
      status: 'pass',
      deployment_id: 'dep_123', // bound — the §3 edit-#2 Option-1 path
      artifact_ref: 'https://build.example',
    })
  })

  it('TEARDOWN: site not 200 → 201 fail, even with full spec + full evidence', async () => {
    h.client = makeClient({ product_validation_status: { data: filledRow() }, pipeline_gates: { error: null } })
    mockFetchStatus(404)

    const res = await surveyPOST(req({ fields: evidenceFields(), pre_hard: allPreHardPass }), ctx())
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.verdict).toBe('TEARDOWN')
    expect(json.gate_status).toBe('fail')
    // deployment_id omitted → unbound/provisional
    expect(h.captured.find((c) => c.table === 'pipeline_gates')!.payload.deployment_id).toBeNull()
  })

  it('INCOMPLETE-SPEC: a null column → 201 fail (spec short-circuits)', async () => {
    h.client = makeClient({ product_validation_status: { data: filledRow({ promise: null }) }, pipeline_gates: { error: null } })
    mockFetchStatus(200)

    const res = await surveyPOST(req({ fields: evidenceFields(), pre_hard: allPreHardPass }), ctx())
    const json = await res.json()

    expect(json.verdict).toBe('INCOMPLETE-SPEC')
    expect(json.gate_status).toBe('fail')
    expect(json.result.spec.missing.map((m: any) => m.field)).toContain('promise')
  })

  it('404 when there is no product_validation_status row', async () => {
    h.client = makeClient({ product_validation_status: { data: null }, pipeline_gates: { error: null } })
    mockFetchStatus(200)
    const res = await surveyPOST(req({ fields: evidenceFields(), pre_hard: allPreHardPass }), ctx('ghost'))
    expect(res.status).toBe(404)
    expect(h.captured.find((c) => c.table === 'pipeline_gates')).toBeUndefined() // nothing recorded
  })

  it('400 on an invalid payload (missing fields[])', async () => {
    h.client = makeClient({})
    const res = await surveyPOST(req({ pre_hard: allPreHardPass }), ctx())
    expect(res.status).toBe(400)
  })

  it('400 on an unknown field code', async () => {
    h.client = makeClient({})
    const res = await surveyPOST(req({ fields: [{ field: 'not_a_field', evidenced: true }], pre_hard: {} }), ctx())
    expect(res.status).toBe(400)
  })
})

// ── Gutted recalculate-score route (score.ts-backed) ─────────────────────────
const crit = (code: string, tier: string, weight: string | null) => ({
  code,
  check_label: `check ${code}`,
  tier,
  weight,
  method: null,
  applies_when: null,
  notes: null,
})
const verdict = (check_code: string, status: string) => ({ check_code, status, source: 'auto', evidence: null, scored_at: '2026-05-31' })

describe('POST /recalculate-score — handler (formula retired)', () => {
  it('writes score.ts result into weighted_score_percent (0–10 ×10) and returns source=score.ts', async () => {
    // 2 HARD (pass) + High+Med WEIGHTED (pass) → earned 5/5 → 10.0/10 → 100%, GO.
    h.client = makeClient({
      methodology_hypothesis_cards: { data: { product_slug: 'demo', features: [] } },
      readiness_criteria: { data: [crit('P1', 'HARD', null), crit('2', 'HARD', null), crit('9', 'WEIGHTED', 'High'), crit('1', 'WEIGHTED', 'Med')] },
      readiness_results: { data: [verdict('P1', 'pass'), verdict('2', 'pass'), verdict('9', 'pass'), verdict('1', 'pass')] },
      product_validation_status: { data: { product_slug: 'demo', weighted_score_percent: 100 } },
    })

    const res = await recalcPOST({} as any, ctx())
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.source).toBe('score.ts')
    expect(json.score).toBe(10)
    expect(json.band).toBe('GO')
    expect(json.gate1_ready).toBe(true)
    expect(json.weighted_score_percent).toBe(100)

    const upd = h.captured.find((c) => c.table === 'product_validation_status' && c.op === 'update')!
    expect(upd.payload.weighted_score_percent).toBe(100) // ×10 of score.ts's 0–10
    expect(upd.payload.hard_gates_total).toBe(2)
    expect(upd.payload.hard_gates_passed).toBe(2)
    expect(upd.payload.gate1_ready).toBe(true)
    expect(typeof upd.payload.last_scoring_run).toBe('string')
  })

  it('a failing HARD check → no GO, weighted_score_percent 0, gate1_ready false', async () => {
    h.client = makeClient({
      methodology_hypothesis_cards: { data: { product_slug: 'demo', features: [] } },
      readiness_criteria: { data: [crit('P1', 'HARD', null), crit('2', 'HARD', null), crit('9', 'WEIGHTED', 'High')] },
      readiness_results: { data: [verdict('P1', 'pass'), verdict('2', 'fail'), verdict('9', 'pass')] },
      product_validation_status: { data: { product_slug: 'demo' } },
    })

    const res = await recalcPOST({} as any, ctx())
    const json = await res.json()

    expect(json.gate1_ready).toBe(false)
    expect(json.weighted_score_percent).toBe(0) // score is null pre-HARD-gate → 0%
    const upd = h.captured.find((c) => c.op === 'update')!
    expect(upd.payload.weighted_score_percent).toBe(0)
    expect(upd.payload.hard_gates_passed).toBe(1) // 1 of 2 HARD passed
  })

  it('404 when the slug has no methodology card (no fabricated number)', async () => {
    h.client = makeClient({
      methodology_hypothesis_cards: { data: null },
      readiness_criteria: { data: [] },
      readiness_results: { data: [] },
    })
    const res = await recalcPOST({} as any, ctx('ghost'))
    expect(res.status).toBe(404)
    expect(h.captured.find((c) => c.op === 'update')).toBeUndefined() // wrote nothing
  })
})
