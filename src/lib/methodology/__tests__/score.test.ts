import { describe, it, expect } from 'vitest'
import { scoreCard, latestVerdicts, isMvpReady, type Criterion, type CheckVerdict } from '../score'

// Compact fixture builders.
const C = (code: string, tier: Criterion['tier'], weight: Criterion['weight'], applies_when: string | null = null): Criterion => ({
  code,
  check_label: `check ${code}`,
  tier,
  weight,
  applies_when,
})
const V = (check_code: string, status: CheckVerdict['status'], source: CheckVerdict['source'] = 'auto'): CheckVerdict => ({
  check_code,
  status,
  source,
})

// A representative slice of the catalogue: 2 HARD, a voice + an auth CONDITIONAL-HARD,
// 2 WEIGHTED, a voice CONDITIONAL-WEIGHTED, the TOO-MUCH guard, and a DEFER check.
const criteria: Criterion[] = [
  C('P1', 'HARD', null),
  C('2', 'HARD', null),
  C('10', 'CONDITIONAL-HARD', null, 'voice'),
  C('22', 'CONDITIONAL-HARD', null, 'auth'),
  C('9', 'WEIGHTED', 'High'),
  C('1', 'WEIGHTED', 'Med'),
  C('15', 'CONDITIONAL-WEIGHTED', 'High', 'voice'),
  C('P4', 'TOO-MUCH', null),
  C('8', 'DEFER', null),
]

describe('scoreCard — applicability', () => {
  it('marks a CONDITIONAL check N/A when the card lacks its feature, and excludes it from the HARD gate', () => {
    const r = scoreCard({
      features: [], // no voice, no auth
      criteria,
      verdicts: [V('P1', 'pass'), V('2', 'pass'), V('9', 'pass'), V('1', 'pass')],
    })
    const voice = r.checks.find((c) => c.code === '10')!
    expect(voice.applicable).toBe(false)
    expect(voice.reason).toMatch(/voice/)
    expect(r.hardGate.total).toBe(2) // only the 2 unconditional HARD checks count
    expect(r.gate1Ready).toBe(true)
  })

  it('DEFER checks are never scored at Gate 1', () => {
    const r = scoreCard({ features: [], criteria, verdicts: [] })
    expect(r.checks.find((c) => c.code === '8')!.applicable).toBe(false)
  })
})

describe('scoreCard — HARD gate', () => {
  it('blocks (no score) when an applicable HARD check fails', () => {
    const r = scoreCard({
      features: [],
      criteria,
      verdicts: [V('P1', 'pass'), V('2', 'fail'), V('9', 'pass'), V('1', 'pass')],
    })
    expect(r.gate1Ready).toBe(false)
    expect(r.score).toBeNull()
    expect(r.band).toBeNull()
    expect(r.hardGate.failing.map((f) => f.code)).toContain('2')
  })

  it('blocks when an applicable HARD check has no recorded verdict (unknown)', () => {
    const r = scoreCard({ features: [], criteria, verdicts: [V('2', 'pass')] })
    expect(r.gate1Ready).toBe(false)
    expect(r.hardGate.failing.find((f) => f.code === 'P1')!.status).toBe('unknown')
  })
})

describe('scoreCard — weighted composite + bands', () => {
  it('computes a normalised 0–10 score and REDESIGN band once the HARD gate passes', () => {
    // applicable weighted (no voice): 9 High=3, 1 Med=2 → possible 5; 9 pass, 1 fail → earned 3 → 6.0
    const r = scoreCard({
      features: [],
      criteria,
      verdicts: [V('P1', 'pass'), V('2', 'pass'), V('9', 'pass'), V('1', 'fail')],
    })
    expect(r.weighted).toEqual({ earned: 3, possible: 5 })
    expect(r.score).toBe(6)
    expect(r.band).toBe('REDESIGN')
  })

  it('reaches GO when all applicable (incl. voice) weighted checks pass', () => {
    // voice present → 15 (High=3) joins; possible 3+2+3=8, all pass → 10 → GO
    const r = scoreCard({
      features: ['voice', 'auth'],
      criteria,
      verdicts: [V('P1', 'pass'), V('2', 'pass'), V('10', 'pass'), V('22', 'pass'), V('9', 'pass'), V('1', 'pass'), V('15', 'pass')],
    })
    expect(r.gate1Ready).toBe(true)
    expect(r.weighted.possible).toBe(8)
    expect(r.score).toBe(10)
    expect(r.band).toBe('GO')
  })
})

describe('scoreCard — TOO-MUCH guard + toReachGo', () => {
  it('flags scale-infra present pre-GO and lists what to fix (highest weight first)', () => {
    const r = scoreCard({
      features: [],
      criteria,
      verdicts: [V('P1', 'pass'), V('2', 'pass'), V('P4', 'fail'), V('9', 'fail'), V('1', 'pass')],
    })
    expect(r.tooMuch.flagged).toBe(true)
    expect(r.tooMuch.checks.map((c) => c.code)).toContain('P4')
    expect(r.toReachGo[0].code).toBe('9') // High-weight unmet check surfaces first
  })
})

describe('latestVerdicts', () => {
  it('keeps the first (newest) verdict per code', () => {
    const deduped = latestVerdicts([V('9', 'pass'), V('9', 'fail'), V('1', 'pass')])
    expect(deduped).toHaveLength(2)
    expect(deduped.find((v) => v.check_code === '9')!.status).toBe('pass')
  })
})

describe('isMvpReady (the derived Gate-1 flag)', () => {
  it('is true only when the HARD gate passes AND the band is GO', () => {
    const go = scoreCard({
      features: ['voice', 'auth'],
      criteria,
      verdicts: [V('P1', 'pass'), V('2', 'pass'), V('10', 'pass'), V('22', 'pass'), V('9', 'pass'), V('1', 'pass'), V('15', 'pass')],
    })
    expect(go.band).toBe('GO')
    expect(isMvpReady(go)).toBe(true)

    const redesign = scoreCard({ features: [], criteria, verdicts: [V('P1', 'pass'), V('2', 'pass'), V('9', 'pass'), V('1', 'fail')] })
    expect(redesign.band).toBe('REDESIGN')
    expect(isMvpReady(redesign)).toBe(false)

    const blocked = scoreCard({ features: [], criteria, verdicts: [V('2', 'pass')] }) // HARD gate not passed
    expect(isMvpReady(blocked)).toBe(false)
  })
})
