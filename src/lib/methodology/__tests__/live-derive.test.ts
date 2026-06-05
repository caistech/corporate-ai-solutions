import { describe, it, expect, vi, afterEach } from 'vitest'
import { deriveFieldsFromLiveUrl } from '../live-derive'

// The 14 markers (NAMED ∉ banlist) + data-why-now → 14/14 evidenced, P1/P2/P3 pass.
const MARKER_DOM = `<!doctype html><html><body
  data-promise="p" data-friction="f" data-core-mechanism="cm"
  data-icp-geography="au" data-icp-partner-type="accountants"
  data-icp-buyer-title="principal" data-icp-verticals="dental"
  data-icp-company-size="2-50" data-icp-stage="growth" data-exclusions="none"
  data-distributor="academies" data-distributor-outcomes="more-students"
  data-end-user="students" data-end-user-outcomes="confidence"
  data-why-now="ai-now"></body></html>`

const RESELLER_DOM = MARKER_DOM.replace('data-distributor="academies"', 'data-distributor="reseller"')

// Route-aware fetch mock: manifest → routes[]; base/* → DOM (rootOk); else not used here.
function mockFetch({ dom = MARKER_DOM, rootOk = true, routes = ['/'] }: { dom?: string; rootOk?: boolean; routes?: string[] } = {}) {
  global.fetch = vi.fn(async (input: any) => {
    const u = String(input)
    if (u.endsWith('/survey-manifest.json')) {
      return { ok: true, status: 200, text: async () => JSON.stringify({ routes }) } as any
    }
    return { ok: rootOk, status: rootOk ? 200 : 404, text: async () => (rootOk ? dom : '') } as any
  }) as any
}

afterEach(() => vi.restoreAllMocks())

describe('deriveFieldsFromLiveUrl — the one shared live-derive (Rider 3)', () => {
  it('full marker DOM → 14/14 evidenced + P1/P2/P3 pass', async () => {
    mockFetch({ dom: MARKER_DOM, rootOk: true })
    const d = await deriveFieldsFromLiveUrl('https://demo.vercel.app')

    expect(d.rootOk).toBe(true)
    expect(d.report.filter((r) => r.evidenced).length).toBe(14)
    const byCode = Object.fromEntries(d.preHard.map((p) => [p.code, p.status]))
    expect(byCode.P1).toBe('pass')
    expect(byCode.P2).toBe('pass')
    expect(byCode.P3).toBe('pass')
    expect(d.whyNowPresent).toBe(true)
  })

  it('distributor="reseller" (banlist) → P2 fail, deterministically (no model)', async () => {
    mockFetch({ dom: RESELLER_DOM, rootOk: true })
    const d = await deriveFieldsFromLiveUrl('https://demo.vercel.app')
    const byCode = Object.fromEntries(d.preHard.map((p) => [p.code, p.status]))
    expect(byCode.P2).toBe('fail')
    expect(d.evidence.distributor?.evidenced).toBe(false)
  })

  it('homepage not 200 → P1 fail, rootOk false, nothing evidenced', async () => {
    mockFetch({ rootOk: false })
    const d = await deriveFieldsFromLiveUrl('https://demo.vercel.app')
    expect(d.rootOk).toBe(false)
    const byCode = Object.fromEntries(d.preHard.map((p) => [p.code, p.status]))
    expect(byCode.P1).toBe('fail')
    expect(d.report.filter((r) => r.evidenced).length).toBe(0)
  })

  it('trailing slash on base is normalised', async () => {
    mockFetch({ dom: MARKER_DOM, rootOk: true })
    const d = await deriveFieldsFromLiveUrl('https://demo.vercel.app///')
    expect(d.base).toBe('https://demo.vercel.app')
  })

  it('same DOM in ⇒ same derive out (determinism)', async () => {
    mockFetch({ dom: MARKER_DOM, rootOk: true })
    const a = await deriveFieldsFromLiveUrl('https://demo.vercel.app')
    mockFetch({ dom: MARKER_DOM, rootOk: true })
    const b = await deriveFieldsFromLiveUrl('https://demo.vercel.app')
    expect(a.preHard).toEqual(b.preHard)
    expect(a.report).toEqual(b.report)
  })
})
