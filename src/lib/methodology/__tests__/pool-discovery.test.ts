import { describe, it, expect } from 'vitest'
import {
  buildPoolQueries,
  buildAssessPrompt,
  parsePoolAssessment,
  buildStreamSpecPrompt,
  parseStreamSpec,
  gatherPoolEvidence,
  assessPool,
  assessBothPools,
  deriveStreamSpec,
  summariseAssessment,
  type PoolDiscoveryDeps,
} from '../pool-discovery'
import type { BraveSearchResult } from '@caistech/brave-search'

const RESULT = (url: string, title = 't', description = 'd'): BraveSearchResult => ({ url, title, description })

// Canned deps so the orchestration is deterministic without network/keys.
const deps = (complete: string, searchResults: BraveSearchResult[] = [RESULT('https://a'), RESULT('https://b')]): PoolDiscoveryDeps => ({
  search: async () => searchResults,
  complete: async () => complete,
})

describe('buildPoolQueries', () => {
  it('returns a who-they-are query + a reachability query', () => {
    const q = buildPoolQueries('  singing teachers and academies  ')
    expect(q).toHaveLength(2)
    expect(q[0]).toBe('singing teachers and academies')
    expect(q[1]).toMatch(/association OR directory OR marketplace/)
  })
})

describe('buildAssessPrompt', () => {
  it('embeds the hypothesis + numbered evidence, and flags no-evidence', () => {
    const withEv = buildAssessPrompt('distributor', 'singing schools', [RESULT('https://x', 'X dir', 'a directory')])
    expect(withEv).toMatch(/singing schools/)
    expect(withEv).toMatch(/1\. X dir/)
    expect(withEv).toMatch(/DISTRIBUTOR pool/)
    const noEv = buildAssessPrompt('end-user', 'students', [])
    expect(noEv).toMatch(/UNSUPPORTED/)
  })
})

describe('parsePoolAssessment', () => {
  it('parses a real-reachable verdict and forces proposed_pool null', () => {
    const r = parsePoolAssessment('{"verdict":"real-reachable","rationale":"directories exist","proposed_pool":{"description":"x","rationale":"y"}}')
    expect(r!.verdict).toBe('real-reachable')
    expect(r!.proposed_pool).toBeNull() // a real-reachable pool never carries a proposal
  })

  it('keeps a proposal on weak/reject', () => {
    const r = parsePoolAssessment('{"verdict":"reject","rationale":"too vague","proposed_pool":{"description":"AU vocal coaches","rationale":"reachable via assoc"}}')
    expect(r!.verdict).toBe('reject')
    expect(r!.proposed_pool!.description).toBe('AU vocal coaches')
  })

  it('tolerates prose around the JSON', () => {
    const r = parsePoolAssessment('Here is my call:\n{"verdict":"weak","rationale":"small","proposed_pool":null}\nthanks')
    expect(r!.verdict).toBe('weak')
  })

  it('returns null on an invalid verdict or non-JSON', () => {
    expect(parsePoolAssessment('{"verdict":"maybe","rationale":"x"}')).toBeNull()
    expect(parsePoolAssessment('no json here')).toBeNull()
  })
})

describe('parseStreamSpec', () => {
  it('parses icp + questions, trims, caps at 20', () => {
    const r = parseStreamSpec('{"icp_description":"  Owners of singing academies in AU  ","questions":["a","b","c"]}')
    expect(r!.icp_description).toBe('Owners of singing academies in AU')
    expect(r!.questions).toEqual(['a', 'b', 'c'])
  })

  it('rejects an empty icp or no questions', () => {
    expect(parseStreamSpec('{"icp_description":"x","questions":["a"]}')).toBeNull() // icp too short
    expect(parseStreamSpec('{"icp_description":"a real long description","questions":[]}')).toBeNull()
  })
})

describe('gatherPoolEvidence', () => {
  it('dedupes by url across the two queries', async () => {
    let call = 0
    const ev = await gatherPoolEvidence('x', {
      search: async () => {
        call++
        return call === 1 ? [RESULT('https://a'), RESULT('https://b')] : [RESULT('https://b'), RESULT('https://c')]
      },
    })
    expect(ev.map((r) => r.url)).toEqual(['https://a', 'https://b', 'https://c'])
  })

  it('survives a failing query (returns the other batch)', async () => {
    let call = 0
    const ev = await gatherPoolEvidence('x', {
      search: async () => {
        call++
        if (call === 1) throw new Error('brave 429')
        return [RESULT('https://ok')]
      },
    })
    expect(ev.map((r) => r.url)).toEqual(['https://ok'])
  })
})

describe('assessPool', () => {
  it('returns the parsed verdict + the gathered evidence count', async () => {
    const a = await assessPool('distributor', 'singing schools', deps('{"verdict":"real-reachable","rationale":"ok","proposed_pool":null}'))
    expect(a.kind).toBe('distributor')
    expect(a.verdict).toBe('real-reachable')
    expect(a.evidence_count).toBe(2)
  })

  it('throws on unparseable LLM output (degrade-don\'t-fake)', async () => {
    await expect(assessPool('end-user', 'x', deps('garbage'))).rejects.toThrow(/parse pool assessment/)
  })
})

describe('assessBothPools', () => {
  it('assesses distributor + end-user', async () => {
    const r = await assessBothPools(
      { distributor: 'singing schools', endUser: 'amateur singers' },
      deps('{"verdict":"weak","rationale":"sharpen","proposed_pool":{"description":"p","rationale":"r"}}')
    )
    expect(r.distributor.kind).toBe('distributor')
    expect(r.endUser.kind).toBe('end-user')
    expect(r.endUser.verdict).toBe('weak')
  })
})

describe('deriveStreamSpec', () => {
  it('maps distributor → distributor-candidate, end-user → target-user', async () => {
    const c = deps('{"icp_description":"Owners of singing academies","questions":["q1","q2"]}')
    const dist = await deriveStreamSpec('distributor', 'singing schools', c)
    const end = await deriveStreamSpec('end-user', 'amateur singers', c)
    expect(dist.campaign_type).toBe('distributor-candidate')
    expect(end.campaign_type).toBe('target-user')
    expect(dist.questions).toEqual(['q1', 'q2'])
  })
})

describe('summariseAssessment', () => {
  it('renders a one-line verdict, plus the proposal when present', () => {
    const s = summariseAssessment({
      kind: 'distributor',
      hypothesis: 'h',
      verdict: 'reject',
      rationale: 'too vague',
      proposed_pool: { description: 'AU vocal coaches', rationale: 'reachable' },
      evidence: [],
      evidence_count: 0,
    })
    expect(s).toMatch(/\[reject\] distributor: too vague/)
    expect(s).toMatch(/proposed: AU vocal coaches/)
  })
})
