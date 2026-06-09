import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

// Mock the two write seams so the producer tests never touch a real DB.
vi.mock('../readiness-results', () => ({ upsertReadinessResult: vi.fn(async () => {}) }))
vi.mock('../enroll-card', () => ({ addFeatures: vi.fn(async () => ['public-web']) }))

import {
  probeAgentReadiness,
  runAgentReadinessProducer,
  AGENT_READY_FEATURE,
  AGENT_READY_CHECK_CODE,
} from '../agent-ready-probe'
import { upsertReadinessResult } from '../readiness-results'
import { addFeatures } from '../enroll-card'

// ── fetch mock: route by URL path suffix (longest match first) ───────────────
type RouteSpec = { ok?: boolean; body?: string; contentType?: string } | 'reject'

function mockFetch(routes: Record<string, RouteSpec>) {
  const keys = Object.keys(routes).sort((a, b) => b.length - a.length)
  return vi.fn(async (url: Parameters<typeof fetch>[0]) => {
    const u = String(url)
    const key = keys.find((k) => u.endsWith(k))
    const r = key ? routes[key] : undefined
    if (!r || r === 'reject') throw new Error('network')
    return {
      ok: r.ok ?? true,
      text: async () => r.body ?? '',
      headers: { get: (h: string) => (h.toLowerCase() === 'content-type' ? r.contentType ?? '' : null) },
    } as unknown as Response
  })
}

const JSONLD_HTML = '<html><head><script type="application/ld+json">{"@type":"WebSite"}</script></head><body>x</body></html>'
const PLAIN_HTML = '<html><head><title>X</title></head><body>x</body></html>'

beforeEach(() => {
  vi.clearAllMocks()
})

// ── probeAgentReadiness — pure HTTP marker detection ─────────────────────────
describe('probeAgentReadiness — the three Layer-1 markers', () => {
  it('all three present → pass, detected, evidence all ✓', async () => {
    global.fetch = mockFetch({
      '/': { body: JSONLD_HTML, contentType: 'text/html' },
      '/llms.txt': { body: '# Product\nWhat it is.', contentType: 'text/plain' },
      '/.well-known/agent.json': { body: '{"name":"x"}', contentType: 'application/json' },
      '/.well-known/ai-plugin.json': 'reject',
    })
    const r = await probeAgentReadiness('https://build.example')
    expect(r.status).toBe('pass')
    expect(r.detected).toBe(true)
    expect(r.markers).toMatchObject({ llmsTxt: true, jsonLd: true, wellKnown: true })
    expect(r.markers.wellKnownPath).toBe('/.well-known/agent.json')
    expect(r.evidence).toMatch(/llms\.txt ✓ · json-ld ✓ · well-known ✓/)
    expect(r.unreachable).toBe(false)
  })

  it('only JSON-LD present → fail, but still detected (drives promotion)', async () => {
    global.fetch = mockFetch({
      '/': { body: JSONLD_HTML, contentType: 'text/html' },
      '/llms.txt': { ok: false, body: 'Not found', contentType: 'text/plain' },
      '/.well-known/agent.json': { ok: false, body: '', contentType: '' },
      '/.well-known/ai-plugin.json': { ok: false, body: '', contentType: '' },
    })
    const r = await probeAgentReadiness('https://build.example')
    expect(r.status).toBe('fail')
    expect(r.detected).toBe(true)
    expect(r.markers).toMatchObject({ llmsTxt: false, jsonLd: true, wellKnown: false })
  })

  it('SPA HTML fallback at /llms.txt and /.well-known is NOT counted (not-faked)', async () => {
    // A SPA 200s the index for unknown paths — must not read as a real artifact.
    global.fetch = mockFetch({
      '/': { body: PLAIN_HTML, contentType: 'text/html' },
      '/llms.txt': { body: PLAIN_HTML, contentType: 'text/html' },
      '/.well-known/agent.json': { body: PLAIN_HTML, contentType: 'text/html' },
      '/.well-known/ai-plugin.json': { body: PLAIN_HTML, contentType: 'text/html' },
    })
    const r = await probeAgentReadiness('https://build.example')
    expect(r.markers).toMatchObject({ llmsTxt: false, jsonLd: false, wellKnown: false })
    expect(r.detected).toBe(false)
    expect(r.status).toBe('fail')
  })

  it('empty-but-OK /llms.txt does not count', async () => {
    global.fetch = mockFetch({
      '/': { body: PLAIN_HTML, contentType: 'text/html' },
      '/llms.txt': { body: '   ', contentType: 'text/plain' },
      '/.well-known/agent.json': 'reject',
      '/.well-known/ai-plugin.json': 'reject',
    })
    const r = await probeAgentReadiness('https://build.example')
    expect(r.markers.llmsTxt).toBe(false)
  })

  it('well-known falls back to ai-plugin.json when agent.json is absent', async () => {
    global.fetch = mockFetch({
      '/': { body: PLAIN_HTML, contentType: 'text/html' },
      '/llms.txt': 'reject',
      '/.well-known/agent.json': { ok: false, body: '', contentType: '' },
      '/.well-known/ai-plugin.json': { body: '{"schema_version":"v1"}', contentType: 'application/json' },
    })
    const r = await probeAgentReadiness('https://build.example')
    expect(r.markers.wellKnown).toBe(true)
    expect(r.markers.wellKnownPath).toBe('/.well-known/ai-plugin.json')
  })

  it('landing unreachable → unreachable flag, no false detection', async () => {
    global.fetch = mockFetch({
      '/': 'reject',
      '/llms.txt': { body: '# real', contentType: 'text/plain' },
      '/.well-known/agent.json': { body: '{}', contentType: 'application/json' },
      '/.well-known/ai-plugin.json': 'reject',
    })
    const r = await probeAgentReadiness('https://build.example')
    expect(r.unreachable).toBe(true)
    expect(r.detected).toBe(false)
    expect(r.status).toBe('fail')
    expect(r.evidence).toMatch(/unreachable/)
  })

  it('bare host (no scheme) is normalized to https', async () => {
    const f = mockFetch({
      '/': { body: PLAIN_HTML, contentType: 'text/html' },
      '/llms.txt': 'reject',
      '/.well-known/agent.json': 'reject',
      '/.well-known/ai-plugin.json': 'reject',
    })
    global.fetch = f
    await probeAgentReadiness('build.example')
    expect(f).toHaveBeenCalledWith('https://build.example/', expect.anything())
  })
})

// ── runAgentReadinessProducer — applicability + promotion + verdict write ─────
function fakeSupabase(features: string[]): SupabaseClient {
  return {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { features } }) }) }),
    }),
  } as unknown as SupabaseClient
}

describe('runAgentReadinessProducer — applicability gate', () => {
  it('markers detected → promotes to public-web + writes the verdict', async () => {
    global.fetch = mockFetch({
      '/': { body: JSONLD_HTML, contentType: 'text/html' },
      '/llms.txt': { body: '# real', contentType: 'text/plain' },
      '/.well-known/agent.json': { body: '{}', contentType: 'application/json' },
      '/.well-known/ai-plugin.json': 'reject',
    })
    const sb = fakeSupabase([]) // not yet tagged → this run promotes it
    const r = await runAgentReadinessProducer(sb, 'demo', 'https://build.example', 'dpl_1')
    expect(addFeatures).toHaveBeenCalledWith(sb, 'demo', [AGENT_READY_FEATURE])
    expect(r.promoted).toBe(true)
    expect(r.applicable).toBe(true)
    expect(r.status).toBe('pass')
    expect(upsertReadinessResult).toHaveBeenCalledWith(
      expect.objectContaining({ checkCode: AGENT_READY_CHECK_CODE, status: 'pass', source: 'auto', deploymentId: 'dpl_1' }),
    )
  })

  it('no markers + card NOT public-web → not applicable, writes nothing', async () => {
    global.fetch = mockFetch({
      '/': { body: PLAIN_HTML, contentType: 'text/html' },
      '/llms.txt': 'reject',
      '/.well-known/agent.json': 'reject',
      '/.well-known/ai-plugin.json': 'reject',
    })
    const r = await runAgentReadinessProducer(fakeSupabase([]), 'demo', 'https://build.example', null)
    expect(r.applicable).toBe(false)
    expect(r.status).toBeNull()
    expect(addFeatures).not.toHaveBeenCalled()
    expect(upsertReadinessResult).not.toHaveBeenCalled()
  })

  it('no markers but card IS public-web → applicable, writes a fail (claims it, lacks it)', async () => {
    global.fetch = mockFetch({
      '/': { body: PLAIN_HTML, contentType: 'text/html' },
      '/llms.txt': 'reject',
      '/.well-known/agent.json': 'reject',
      '/.well-known/ai-plugin.json': 'reject',
    })
    const r = await runAgentReadinessProducer(fakeSupabase(['public-web']), 'demo', 'https://build.example', null)
    expect(r.applicable).toBe(true)
    expect(r.promoted).toBe(false)
    expect(addFeatures).not.toHaveBeenCalled()
    expect(upsertReadinessResult).toHaveBeenCalledWith(
      expect.objectContaining({ checkCode: AGENT_READY_CHECK_CODE, status: 'fail', source: 'auto' }),
    )
  })

  it('unreachable surface → writes nothing, mutates nothing (degrade-don\'t-fake)', async () => {
    global.fetch = mockFetch({
      '/': 'reject',
      '/llms.txt': 'reject',
      '/.well-known/agent.json': 'reject',
      '/.well-known/ai-plugin.json': 'reject',
    })
    const r = await runAgentReadinessProducer(fakeSupabase(['public-web']), 'demo', 'https://build.example', 'dpl_1')
    expect(r.unreachable).toBe(true)
    expect(addFeatures).not.toHaveBeenCalled()
    expect(upsertReadinessResult).not.toHaveBeenCalled()
  })
})
