import { describe, it, expect } from 'vitest'
import {
  scoreDemand,
  isDemandGo,
  type DemandScoreInput,
  type DimensionInput,
  type Confidence,
} from '../demand-score'

// Compact fixture builders.
const D = (key: DimensionInput['key'], score: number, confidence?: Confidence): DimensionInput => ({
  key,
  score,
  confidence,
})
// All five dimensions at one value (overridable per key) — a convenient baseline.
const all = (
  v: number,
  over: Partial<Record<DimensionInput['key'], number>> = {}
): DimensionInput[] =>
  (['pain', 'gap', 'onsell', 'reach', 'build_fit'] as const).map((k) => D(k, over[k] ?? v))

const input = (dimensions: DimensionInput[], extra: Partial<DemandScoreInput> = {}): DemandScoreInput => ({
  mode: 'evidence',
  dimensions,
  ...extra,
})

describe('scoreDemand — weighted composite (§5 weights: pain 30 / gap 20 / reach 25 / build-fit 25)', () => {
  it('all dimensions 10 → composite 10, GO', () => {
    const r = scoreDemand(input(all(10)))
    expect(r.composite).toBe(10)
    expect(r.band).toBe('GO')
  })

  it('applies the exact §5 weights', () => {
    // pain 8·.30 + gap 7·.20 + reach 6·.25 + build_fit 9·.25 = 2.4+1.4+1.5+2.25 = 7.55 → 7.6
    const r = scoreDemand(input([D('pain', 8), D('gap', 7), D('reach', 6), D('build_fit', 9), D('onsell', 8)]))
    expect(r.composite).toBe(7.6)
    expect(r.band).toBe('GO')
    expect(r.dimensions.find((d) => d.key === 'pain')!.contribution).toBe(2.4)
    expect(r.dimensions.find((d) => d.key === 'reach')!.contribution).toBe(1.5)
  })

  it('clamps out-of-range scores to 0–10', () => {
    const r = scoreDemand(input(all(0, { pain: 99, gap: -5 })))
    expect(r.dimensions.find((d) => d.key === 'pain')!.score).toBe(10)
    expect(r.dimensions.find((d) => d.key === 'gap')!.score).toBe(0)
  })
})

describe('scoreDemand — bands (GO ≥6.5 / REDESIGN 5.0–6.4 / NO-GO <5.0)', () => {
  it('composite exactly 6.5 → GO', () => {
    // 7·.3 + 7·.2 + 6·.25 + 6·.25 = 2.1+1.4+1.5+1.5 = 6.5
    const r = scoreDemand(input([D('pain', 7), D('gap', 7), D('reach', 6), D('build_fit', 6), D('onsell', 8)]))
    expect(r.composite).toBe(6.5)
    expect(r.band).toBe('GO')
  })

  it('composite exactly 5.0 → REDESIGN', () => {
    const r = scoreDemand(input(all(5, { onsell: 8 })))
    expect(r.composite).toBe(5)
    expect(r.band).toBe('REDESIGN')
  })

  it('composite 4.x → NO-GO', () => {
    const r = scoreDemand(input(all(4, { onsell: 8 })))
    expect(r.composite).toBe(4)
    expect(r.band).toBe('NO-GO')
  })
})

describe('scoreDemand — onsell HARD GATE (dimension 3)', () => {
  it('forces NO-GO when onsell < 5, even with a perfect composite', () => {
    const r = scoreDemand(input(all(10, { onsell: 4 })))
    expect(r.composite).toBe(10) // still computed for transparency
    expect(r.gate.passed).toBe(false)
    expect(r.band).toBe('NO-GO')
    expect(r.toReachGo[0].key).toBe('onsell') // the gate is the first lever
  })

  it('passes the gate at onsell exactly 5', () => {
    const r = scoreDemand(input(all(8, { onsell: 5 })))
    expect(r.gate.passed).toBe(true)
    expect(r.band).not.toBe('NO-GO')
  })

  it('personal-interest override bypasses a failing gate', () => {
    const r = scoreDemand(
      input(all(10, { onsell: 2 }), { personalInterestOverride: { reason: 'kira/storyverse passion bet' } })
    )
    expect(r.gate.passed).toBe(true)
    expect(r.gate.overridden).toBe(true)
    expect(r.gate.overrideReason).toBe('kira/storyverse passion bet')
    expect(r.band).toBe('GO') // composite band applies once the gate is overridden
  })
})

describe('scoreDemand — missing evidence is never silently N/A (counted as 0)', () => {
  it('treats an absent dimension as 0 and fails the gate when onsell is absent', () => {
    const r = scoreDemand(input([D('pain', 9), D('gap', 9), D('reach', 9)])) // build_fit + onsell absent
    const bf = r.dimensions.find((d) => d.key === 'build_fit')!
    expect(bf.missing).toBe(true)
    expect(bf.score).toBe(0)
    expect(r.gate.score).toBe(0)
    expect(r.gate.passed).toBe(false)
    expect(r.band).toBe('NO-GO')
  })
})

describe('scoreDemand — confidence flagging (hypothesis mode)', () => {
  it('surfaces the weakest confidence among supplied dimensions', () => {
    const r = scoreDemand(
      input([D('pain', 8, 'high'), D('gap', 7, 'medium'), D('reach', 6, 'low'), D('build_fit', 9, 'high'), D('onsell', 7, 'medium')], {
        mode: 'hypothesis',
      })
    )
    expect(r.mode).toBe('hypothesis')
    expect(r.lowestConfidence).toBe('low')
  })

  it('is null when no confidence is supplied (typical evidence mode)', () => {
    expect(scoreDemand(input(all(7))).lowestConfidence).toBeNull()
  })
})

describe('scoreDemand — toReachGo ranks by weight × deficit', () => {
  it('surfaces the biggest composite lever first (gate passing)', () => {
    // pain deficit (10-5)·30/100 = 1.5 (biggest); build_fit (10-8)·25/100 = 0.5; gap+reach maxed
    const r = scoreDemand(input([D('pain', 5), D('gap', 10), D('reach', 10), D('build_fit', 8), D('onsell', 8)]))
    expect(r.toReachGo[0].key).toBe('pain')
  })
})

describe('isDemandGo', () => {
  it('is true only for a GO band', () => {
    expect(isDemandGo(scoreDemand(input(all(10))))).toBe(true)
    expect(isDemandGo(scoreDemand(input(all(5, { onsell: 8 }))))).toBe(false) // REDESIGN
    expect(isDemandGo(scoreDemand(input(all(10, { onsell: 4 }))))).toBe(false) // gate NO-GO
    expect(isDemandGo(null)).toBe(false)
  })
})
