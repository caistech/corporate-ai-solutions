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
// A DOM carrying all 14 markers (NAMED values ∉ banlist) + data-why-now → 14/14 evidenced,
// P1 (root 200) / P2 (named distributor) / P3 (distributor + outcomes + why-now) all pass.
const MARKER_DOM = `<!doctype html><html><body
  data-promise="p" data-friction="f" data-core-mechanism="cm"
  data-icp-geography="au" data-icp-partner-type="accountants"
  data-icp-buyer-title="principal" data-icp-verticals="dental"
  data-icp-company-size="2-50" data-icp-stage="growth" data-exclusions="none"
  data-distributor="academies" data-distributor-outcomes="more-students"
  data-end-user="students" data-end-user-outcomes="confidence"
  data-why-now="ai-now"></body></html>`

// Same DOM but the distributor archetype is the banlist value 'reseller' → P2 fails.
// The deal-findrs determinism case: same DOM in ⇒ same P2 fail out, no model in the loop.
const RESELLER_DOM = MARKER_DOM.replace('data-distributor="academies"', 'data-distributor="reseller"')

// Route-aware fetch mock for the deterministic DOM-fetch survey contract. Differentiates:
//   …/survey-manifest.json   → the build route manifest
//   the build base (demo.vercel.app/*) → the page DOM (ok drives P1/rootOk)
//   anything else (the mvp_url live HEAD/GET check) → bare { status }
function mockFetch({ dom = MARKER_DOM, rootOk = true, mvpStatus = 200 }: { dom?: string; rootOk?: boolean; mvpStatus?: number } = {}) {
  global.fetch = vi.fn(async (input: any) => {
    const u = String(input)
    if (u.endsWith('/survey-manifest.json')) {
      return { ok: true, status: 200, text: async () => JSON.stringify({ routes: ['/'] }) } as any
    }
    if (u.startsWith('https://demo.vercel.app')) {
      return { ok: rootOk, status: rootOk ? 200 : 404, text: async () => (rootOk ? dom : '') } as any
    }
    return { status: mvpStatus } as any // mvp_url live check
  }) as any
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
describe('POST /survey — handler (deterministic DOM-fetch contract)', () => {
  it('RENOVATION: full DB spec + 14/14 markers + live mvp → 201 pass, gate bound', async () => {
    h.client = makeClient({ product_validation_status: { data: filledRow() }, pipeline_gates: { error: null } })
    mockFetch({ dom: MARKER_DOM, rootOk: true, mvpStatus: 200 })

    const res = await surveyPOST(req({ deployment_id: 'dep_123' }), ctx())
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.verdict).toBe('RENOVATION')
    expect(json.gate_status).toBe('pass')

    const gate = h.captured.find((c) => c.table === 'pipeline_gates')!
    expect(gate.payload).toMatchObject({
      product_slug: 'demo',
      gate: 'survey',
      status: 'pass',
      deployment_id: 'dep_123', // bound when supplied
    })
  })

  it('TEARDOWN: markers present but mvp_url not 200 → 201 fail', async () => {
    h.client = makeClient({ product_validation_status: { data: filledRow() }, pipeline_gates: { error: null } })
    mockFetch({ dom: MARKER_DOM, rootOk: true, mvpStatus: 404 })

    const res = await surveyPOST(req({}), ctx())
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.verdict).toBe('TEARDOWN')
    expect(json.gate_status).toBe('fail')
    // deployment_id omitted → unbound/provisional
    expect(h.captured.find((c) => c.table === 'pipeline_gates')!.payload.deployment_id).toBeNull()
  })

  it('TEARDOWN: distributor marker = "reseller" (banlist) → P2 fail (the deal-findrs case)', async () => {
    h.client = makeClient({ product_validation_status: { data: filledRow() }, pipeline_gates: { error: null } })
    mockFetch({ dom: RESELLER_DOM, rootOk: true, mvpStatus: 200 })

    const res = await surveyPOST(req({}), ctx())
    const json = await res.json()

    expect(json.verdict).toBe('TEARDOWN')
    expect(json.gate_status).toBe('fail')
    // P2 (named-distributor) is the failing pre-hard, DERIVED from the marker — not re-judged.
    const p2 = json.result.preHard.failing.find((p: any) => p.code === 'P2')
    expect(p2).toBeTruthy()
  })

  it('INCOMPLETE-SPEC: a null DB column short-circuits → 201 fail', async () => {
    h.client = makeClient({ product_validation_status: { data: filledRow({ promise: null }) }, pipeline_gates: { error: null } })
    mockFetch({ dom: MARKER_DOM, rootOk: true, mvpStatus: 200 })

    const res = await surveyPOST(req({}), ctx())
    const json = await res.json()

    expect(json.verdict).toBe('INCOMPLETE-SPEC')
    expect(json.gate_status).toBe('fail')
    expect(json.result.spec.missing.map((m: any) => m.field)).toContain('promise')
  })

  it('404 when there is no product_validation_status row', async () => {
    h.client = makeClient({ product_validation_status: { data: null }, pipeline_gates: { error: null } })
    mockFetch({})
    const res = await surveyPOST(req({}), ctx('ghost'))
    expect(res.status).toBe(404)
    expect(h.captured.find((c) => c.table === 'pipeline_gates')).toBeUndefined() // nothing recorded
  })

  it('400 on an invalid payload (url is not a URL)', async () => {
    h.client = makeClient({})
    const res = await surveyPOST(req({ url: 'not-a-url' }), ctx())
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
