import { describe, it, expect } from 'vitest'
import {
  survey,
  latestPreHard,
  isRenovation,
  SURVEY_FIELDS,
  MIN_EVIDENCED,
  SURVEY_FIELD_COUNT,
  type SurveyField,
  type SurveyInput,
  type FieldEvidence,
  type PreHardResult,
} from '../survey'

// ── Compact fixture builders ────────────────────────────────────────────────
const ALL_FIELDS = SURVEY_FIELDS.map((f) => f.field)

/** All 14 columns filled (spec complete). */
const fullSpec = (): Record<SurveyField, string | null> =>
  Object.fromEntries(ALL_FIELDS.map((f) => [f, 'x'])) as Record<SurveyField, string | null>

/** First `n` fields evidenced (with a citation), the rest not. */
const evN = (n: number): Record<SurveyField, FieldEvidence> =>
  Object.fromEntries(
    ALL_FIELDS.map((f, i) => [f, i < n ? { evidenced: true, evidence: `p:${i}` } : { evidenced: false, evidence: null }]),
  ) as Record<SurveyField, FieldEvidence>

const pass = (...codes: PreHardResult['code'][]): PreHardResult[] => codes.map((code) => ({ code, status: 'pass' }))

const base = (over: Partial<SurveyInput> = {}): SurveyInput => ({
  fields: fullSpec(),
  evidence: evN(SURVEY_FIELD_COUNT),
  preHard: pass('P1', 'P2', 'P3'),
  mvpUrl: 'https://build.example',
  mvpUrlOk: true,
  ...over,
})

// ── Spec presence = the survey's hard gate ──────────────────────────────────
describe('survey — spec presence (INCOMPLETE-SPEC short-circuits)', () => {
  it('any missing field → INCOMPLETE-SPEC, regardless of a perfect build', () => {
    const fields = fullSpec()
    fields.promise = null
    const r = survey(base({ fields }))
    expect(r.verdict).toBe('INCOMPLETE-SPEC')
    expect(r.spec.present).toBe(SURVEY_FIELD_COUNT - 1)
    expect(r.spec.missing.map((m) => m.field)).toEqual(['promise'])
    expect(r.nextStage).toMatch(/Stage 1\/2/)
  })

  it('blank/whitespace-only counts as absent (trim<>\'\' rule)', () => {
    const fields = fullSpec()
    fields.exclusions = '   '
    expect(survey(base({ fields })).verdict).toBe('INCOMPLETE-SPEC')
  })

  it('the toReach list names the missing fields first', () => {
    const fields = fullSpec()
    fields.promise = null
    fields.friction = null
    const r = survey(base({ fields }))
    const codes = r.toReach.map((t) => t.code)
    expect(codes.slice(0, 2)).toEqual(['promise', 'friction'])
  })
})

// ── RENOVATION ───────────────────────────────────────────────────────────────
describe('survey — RENOVATION (the forward door)', () => {
  it('complete spec + 14/14 evidenced + P1/P2/P3 pass + live → RENOVATION', () => {
    const r = survey(base())
    expect(r.verdict).toBe('RENOVATION')
    expect(r.nextStage).toBe('Stage 5')
    expect(isRenovation(r)).toBe(true)
    expect(r.toReach).toHaveLength(0)
  })

  it('exactly MIN_EVIDENCED (12/14, ≥80%) still passes', () => {
    expect(MIN_EVIDENCED).toBe(12)
    expect(survey(base({ evidence: evN(12) })).verdict).toBe('RENOVATION')
  })

  it('P4 (the TOO-MUCH guard) failing does NOT block — it is informational', () => {
    const preHard: PreHardResult[] = [...pass('P1', 'P2', 'P3'), { code: 'P4', status: 'fail', evidence: 'scale-infra present' }]
    expect(survey(base({ preHard })).verdict).toBe('RENOVATION')
  })
})

// ── TEARDOWN (spec complete, build falls short) ──────────────────────────────
describe('survey — TEARDOWN (back to design→build)', () => {
  it('no live site (mvpUrlOk false) → TEARDOWN even at 14/14 evidenced', () => {
    const r = survey(base({ mvpUrlOk: false }))
    expect(r.verdict).toBe('TEARDOWN')
    expect(r.mvp.ok).toBe(false)
    expect(r.toReach.some((t) => t.code === 'mvp_url')).toBe(true)
  })

  it('null mvpUrl → TEARDOWN with a "no mvp_url set" reason', () => {
    const r = survey(base({ mvpUrl: null, mvpUrlOk: false }))
    expect(r.verdict).toBe('TEARDOWN')
    expect(r.toReach.find((t) => t.code === 'mvp_url')?.need).toMatch(/no mvp_url set/)
  })

  it('11/14 evidenced (<80%) → TEARDOWN; un-evidenced fields appear in toReach', () => {
    const r = survey(base({ evidence: evN(11) }))
    expect(r.verdict).toBe('TEARDOWN')
    expect(r.site.meetsThreshold).toBe(false)
    expect(r.site.evidencedCount).toBe(11)
    expect(r.toReach.some((t) => t.need.includes(`${MIN_EVIDENCED}/${SURVEY_FIELD_COUNT}`))).toBe(true)
  })

  it('a gating PRE-HARD (P3) failing → TEARDOWN', () => {
    const preHard: PreHardResult[] = [...pass('P1', 'P2'), { code: 'P3', status: 'fail' }]
    const r = survey(base({ preHard }))
    expect(r.verdict).toBe('TEARDOWN')
    expect(r.preHard.passed).toBe(false)
    expect(r.preHard.failing.map((p) => p.code)).toEqual(['P3'])
  })

  it('a missing PRE-HARD reads as unknown and blocks (like score.ts)', () => {
    const r = survey(base({ preHard: [] }))
    expect(r.verdict).toBe('TEARDOWN')
    expect(r.preHard.failing.map((p) => p.code)).toEqual(['P1', 'P2', 'P3'])
    expect(r.preHard.results.every((p) => p.status === 'unknown')).toBe(true)
  })
})

// ── Evidence discipline ──────────────────────────────────────────────────────
describe('survey — evidence discipline (no citation ⇒ false)', () => {
  it('a field with no evidence entry is treated as not evidenced', () => {
    const r = survey(base({ evidence: {} as Record<SurveyField, FieldEvidence> }))
    expect(r.verdict).toBe('TEARDOWN')
    expect(r.site.evidencedCount).toBe(0)
    expect(r.fields.every((f) => f.present && !f.evidenced)).toBe(true)
  })

  it('per-field result carries present + evidenced + the citation', () => {
    const ev = evN(1)
    const r = survey(base({ evidence: ev }))
    const first = r.fields.find((f) => f.field === ALL_FIELDS[0])!
    expect(first).toMatchObject({ present: true, evidenced: true, evidence: 'p:0' })
  })
})

// ── Verdict precedence: INCOMPLETE-SPEC wins over a broken build ──────────────
describe('survey — precedence', () => {
  it('INCOMPLETE-SPEC takes priority even when the build is also broken', () => {
    const fields = fullSpec()
    fields.promise = null
    const r = survey({ fields, evidence: evN(0), preHard: [], mvpUrl: null, mvpUrlOk: false })
    expect(r.verdict).toBe('INCOMPLETE-SPEC')
    // build-level toReach (mvp/evidence/pre-hard) is suppressed until the spec is complete
    expect(r.toReach.every((t) => ALL_FIELDS.includes(t.code as SurveyField))).toBe(true)
  })
})

// ── Helpers ──────────────────────────────────────────────────────────────────
describe('latestPreHard / isRenovation', () => {
  it('latestPreHard keeps the first-seen per code (recency-ordered input)', () => {
    const rows: PreHardResult[] = [
      { code: 'P1', status: 'pass' },
      { code: 'P1', status: 'fail' }, // older duplicate — dropped
      { code: 'P2', status: 'fail' },
    ]
    const out = latestPreHard(rows)
    expect(out).toHaveLength(2)
    expect(out.find((p) => p.code === 'P1')!.status).toBe('pass')
  })

  it('isRenovation is false for null/non-renovation results', () => {
    expect(isRenovation(null)).toBe(false)
    expect(isRenovation(survey(base({ mvpUrlOk: false })))).toBe(false)
  })
})
