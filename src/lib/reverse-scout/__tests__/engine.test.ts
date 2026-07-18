import { describe, it, expect } from 'vitest'
import { parseCapabilityCard, parsePattern } from '../engine'

describe('parseCapabilityCard', () => {
  it('parses a well-formed card, coercing arrays and trimming', () => {
    const raw = JSON.stringify({
      does_what: '  Schedules crews across sites  ',
      primitive: 'constrained resource allocation under time windows',
      inputs: ['jobs', '  crews  ', 42, ''],
      outputs: ['assignments'],
      integration_surface: 'api',
      maturity_level: 'beta',
      dependencies: ['postgres'],
      reasoning: 'the core is allocation, not construction',
    })
    const card = parseCapabilityCard(raw)
    expect(card.does_what).toBe('Schedules crews across sites')
    expect(card.primitive).toBe('constrained resource allocation under time windows')
    expect(card.inputs).toEqual(['jobs', 'crews']) // non-strings + blanks dropped
    expect(card.integration_surface).toBe('api')
  })

  it('tolerates surrounding prose and code fences', () => {
    const raw = 'Here you go:\n```json\n{"does_what":"x","primitive":"y"}\n```\nHope that helps.'
    const card = parseCapabilityCard(raw)
    expect(card.does_what).toBe('x')
    expect(card.primitive).toBe('y')
    expect(card.inputs).toEqual([])
  })

  it('throws when the required primitive is missing', () => {
    expect(() => parseCapabilityCard(JSON.stringify({ does_what: 'x' }))).toThrow(/primitive/)
  })

  it('throws on unparseable output', () => {
    expect(() => parseCapabilityCard('not json at all')).toThrow(/parse JSON/)
  })
})

describe('parsePattern', () => {
  const valid = {
    abstract_problem_shape: 'allocate scarce capacity across competing time-bound demands',
    domain_stripped_desc: 'a set of units must be assigned to time slots under priority rules',
    sectors: [
      { sector: 'Tour operators', adjacency: 'adjacent', rationale: 'guides to tours by window', confidence: 0.8 },
      { sector: 'Clinics', adjacency: 'lateral', rationale: 'rooms to appointments', confidence: 1.4 },
    ],
  }

  it('parses sectors and clamps out-of-range confidence', () => {
    const pattern = parsePattern(JSON.stringify(valid))
    expect(pattern.sectors).toHaveLength(2)
    expect(pattern.sectors[1].confidence).toBe(1) // 1.4 clamped to 1
    expect(pattern.sectors[0].adjacency).toBe('adjacent')
  })

  it('drops sectors with an unknown adjacency or missing rationale', () => {
    const raw = JSON.stringify({
      ...valid,
      sectors: [
        { sector: 'Good', adjacency: 'adjacent', rationale: 'real', confidence: 0.5 },
        { sector: 'BadAdjacency', adjacency: 'sideways', rationale: 'real', confidence: 0.5 },
        { sector: 'NoRationale', adjacency: 'lateral', rationale: '', confidence: 0.5 },
      ],
    })
    const pattern = parsePattern(raw)
    expect(pattern.sectors.map((s) => s.sector)).toEqual(['Good'])
  })

  it('throws when no valid sectors survive', () => {
    const raw = JSON.stringify({ ...valid, sectors: [{ sector: 'x', adjacency: 'nope', rationale: 'y' }] })
    expect(() => parsePattern(raw)).toThrow(/no valid sectors/)
  })

  it('throws when the abstract shape is missing', () => {
    expect(() => parsePattern(JSON.stringify({ sectors: valid.sectors }))).toThrow(/abstract_problem_shape/)
  })
})
