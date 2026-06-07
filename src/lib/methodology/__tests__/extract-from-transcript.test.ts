import { describe, it, expect } from 'vitest'
import { parseExtraction, renderTranscript, buildExtractionPrompt } from '../extract-from-transcript'

describe('parseExtraction — extraction + the anti-fabrication boundary', () => {
  it('extracts allowed fields + feasibility from clean JSON', () => {
    const out = parseExtraction(
      JSON.stringify({
        fields: { promise: 'sing-along karaoke that polishes your voice', distributor: 'singing teachers' },
        feasibility: { proof_of_demand: 'a 40-school waitlist', demand_tier: 'data', distributor_benefit_mode: 'paid' },
      }),
    )
    expect(out.fields).toEqual({ promise: 'sing-along karaoke that polishes your voice', distributor: 'singing teachers' })
    expect(out.feasibility).toEqual({ proof_of_demand: 'a 40-school waitlist', demand_tier: 'data', distributor_benefit_mode: 'paid' })
  })

  it('extracts JSON even when the model wraps it in prose', () => {
    const out = parseExtraction('Here is what I found:\n{"fields":{"promise":"x"},"feasibility":{}}\nThat is all.')
    expect(out.fields).toEqual({ promise: 'x' })
  })

  it('NEVER fabricates: drops empty / null / whitespace values', () => {
    const out = parseExtraction(
      JSON.stringify({ fields: { promise: 'real', distributor: '', end_user: '   ' }, feasibility: { proof_of_demand: null } }),
    )
    expect(out.fields).toEqual({ promise: 'real' })
    expect(out.feasibility).toEqual({})
  })

  it('drops unknown keys (security — only allowlisted field names survive)', () => {
    const out = parseExtraction(JSON.stringify({ fields: { is_draft: 'false', promise: 'ok', evil: 'x' }, feasibility: { admitted: 'true' } }))
    expect(out.fields).toEqual({ promise: 'ok' })
    expect(out.feasibility).toEqual({})
  })

  it('drops invalid enum values rather than guessing', () => {
    const out = parseExtraction(
      JSON.stringify({ fields: {}, feasibility: { demand_tier: 'vibes', distributor_benefit_mode: 'free', proof_of_demand: 'kept' } }),
    )
    expect(out.feasibility).toEqual({ proof_of_demand: 'kept' }) // bad enums dropped, valid free-text kept
  })

  it('accepts a valid enum', () => {
    const out = parseExtraction(JSON.stringify({ feasibility: { demand_tier: 'traction', distributor_benefit_mode: 'value-add' } }))
    expect(out.feasibility).toEqual({ demand_tier: 'traction', distributor_benefit_mode: 'value-add' })
  })

  it('degrades-don\'t-fake on malformed output (empty buckets, no throw)', () => {
    expect(parseExtraction('the model said no json at all')).toEqual({ fields: {}, feasibility: {} })
    expect(parseExtraction('{ not valid json }')).toEqual({ fields: {}, feasibility: {} })
  })
})

describe('renderTranscript + prompt', () => {
  it('labels turns Operator / Coach', () => {
    expect(renderTranscript([{ role: 'user', text: 'hi' }, { role: 'assistant', text: 'hello' }])).toBe('Operator: hi\nCoach: hello')
  })
  it('the extraction prompt forbids fabrication and lists the allowed keys', () => {
    const p = buildExtractionPrompt()
    expect(p).toMatch(/NEVER invent/)
    expect(p).toContain('promise')
    expect(p).toContain('distributor_benefit_mode')
  })
})
