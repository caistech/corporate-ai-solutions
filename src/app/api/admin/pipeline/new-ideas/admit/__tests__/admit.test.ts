import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mutable holder so the hoisted mocks read per-test fixtures.
const h = vi.hoisted(() => ({
  row: null as any,
  rpcError: null as any,
  updateError: null as any,
  calls: { rpc: [] as any[], update: [] as any[] },
  resolve: null as any, // resolveProdDeployment return
  derive: null as any, // deriveFieldsFromLiveUrl return
  identifierBlockers: [] as string[],
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: h.row, error: null }) }) }),
      update: (payload: any) => {
        h.calls.update.push(payload)
        return { eq: async () => ({ error: h.updateError }) }
      },
    }),
    rpc: async (name: string, args: any) => {
      h.calls.rpc.push({ name, args })
      return { error: h.rpcError }
    },
  }),
}))

vi.mock('@/lib/methodology/vercel-deployment', () => ({
  resolveProdDeployment: async () => h.resolve,
}))
vi.mock('@/lib/methodology/live-derive', () => ({
  deriveFieldsFromLiveUrl: async () => h.derive,
}))
vi.mock('@/lib/methodology/identifier-validation', () => ({
  validateIdentifiers: async () => h.identifierBlockers,
}))

import { POST as admitPOST } from '../route'

const GRADED = [
  'promise', 'distributor', 'end_user', 'friction', 'distributor_outcomes', 'end_user_outcomes',
  'core_mechanism', 'icp_geography', 'icp_partner_type', 'icp_buyer_title', 'icp_verticals',
  'icp_company_size', 'icp_stage', 'exclusions',
]
const fullFields = (over: Record<string, any> = {}) => ({ ...Object.fromEntries(GRADED.map((f) => [f, 'x'])), ...over })
const feas = { proof_of_demand: 'real demand', demand_tier: 'data', distributor_benefit_mode: 'paid' }
const req = (body: any) => ({ json: async () => body }) as any
const preHard = (p2: 'pass' | 'fail') => [
  { code: 'P1', status: 'pass' }, { code: 'P2', status: p2 },
  { code: 'P3', status: 'pass' }, { code: 'P4', status: 'unknown' },
]
const fullIdentifierRow = (over: Record<string, any> = {}) => ({
  product_slug: 'demo', mvp_url: 'https://demo.vercel.app', vercel_project: 'demo',
  supabase_ref: 'abcdefghij1234567890', github_repo: 'owner/demo',
  ecc_project_id: '07c7743c-3120-4e26-af23-e6580b2260cf', display_name: 'Demo', ...over,
})

beforeEach(() => {
  h.row = null; h.rpcError = null; h.updateError = null
  h.calls = { rpc: [], update: [] }
  h.resolve = null; h.derive = null; h.identifierBlockers = []
})
afterEach(() => vi.restoreAllMocks())

describe('THE GATE — admit (deterministic, atomic membership)', () => {
  it('no-URL product, presence OK → PASS → admit_product RPC called (membership granted)', async () => {
    h.row = { product_slug: 'demo', mvp_url: null, vercel_project: null, supabase_ref: null, github_repo: null, ecc_project_id: null, display_name: 'Demo' }
    const res = await admitPOST(req({ productSlug: 'demo', fields: fullFields(), feasibility: feas }))
    const json = await res.json()
    expect(json.admitted).toBe(true)
    expect(h.calls.rpc).toHaveLength(1)
    expect(h.calls.rpc[0].name).toBe('admit_product')
    expect(h.calls.rpc[0].args.p_slug).toBe('demo')
  })

  it('presence FAIL (a missing field) → 422, ZERO writes (invariant #1: fail ⇒ no membership)', async () => {
    h.row = fullIdentifierRow()
    const res = await admitPOST(req({ productSlug: 'demo', fields: fullFields({ promise: '' }), feasibility: feas }))
    expect(res.status).toBe(422)
    expect(h.calls.rpc).toHaveLength(0)
    expect(h.calls.update).toHaveLength(0)
  })

  it('URL product, reseller → P2 fail → 422, ZERO membership writes (invariants #1 + #2)', async () => {
    h.row = fullIdentifierRow()
    h.resolve = { deploymentId: 'dpl_abc', immutableUrl: 'https://demo-abc.vercel.app' }
    h.derive = { preHard: preHard('fail') }
    const res = await admitPOST(req({ productSlug: 'demo', fields: fullFields(), feasibility: feas }))
    const json = await res.json()
    expect(res.status).toBe(422)
    expect(json.blockers.join(' ')).toMatch(/P2/)
    expect(h.calls.rpc).toHaveLength(0) // no card, no manifest
  })

  it('URL product, clean markers, pinned → PASS, RPC called, pinned=true + deploymentId stamped', async () => {
    h.row = fullIdentifierRow()
    h.resolve = { deploymentId: 'dpl_abc', immutableUrl: 'https://demo-abc.vercel.app' }
    h.derive = { preHard: preHard('pass') }
    const res = await admitPOST(req({ productSlug: 'demo', fields: fullFields(), feasibility: feas }))
    const json = await res.json()
    expect(json.admitted).toBe(true)
    expect(json.pinned).toBe(true)
    expect(json.deploymentId).toBe('dpl_abc')
    expect(h.calls.rpc[0].args.p_vercel_project).toBe('demo')
  })

  it('URL product, NOT pinnable (no vercel resolve) → unpinned, NO marker gating, still admits', async () => {
    h.row = fullIdentifierRow({ vercel_project: '' })
    h.resolve = null // resolve fails / no project
    const res = await admitPOST(req({ productSlug: 'demo', fields: fullFields(), feasibility: feas }))
    const json = await res.json()
    expect(json.admitted).toBe(true)
    expect(json.pinned).toBe(false)
  })

  it('404 when the idea row does not exist', async () => {
    h.row = null
    const res = await admitPOST(req({ productSlug: 'ghost', fields: fullFields(), feasibility: feas }))
    expect(res.status).toBe(404)
    expect(h.calls.rpc).toHaveLength(0)
  })

  it('determinism: same answers + same deployment → same verdict across two runs', async () => {
    const run = async () => {
      h.calls = { rpc: [], update: [] }
      h.row = fullIdentifierRow()
      h.resolve = { deploymentId: 'dpl_abc', immutableUrl: 'https://demo-abc.vercel.app' }
      h.derive = { preHard: preHard('pass') }
      const res = await admitPOST(req({ productSlug: 'demo', fields: fullFields(), feasibility: feas }))
      return res.json()
    }
    const a = await run()
    const b = await run()
    expect(a.admitted).toBe(b.admitted)
    expect(a.pinned).toBe(b.pinned)
    expect(a.deploymentId).toBe(b.deploymentId)
  })
})
