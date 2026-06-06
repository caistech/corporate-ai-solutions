import { describe, it, expect, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  buildCoachUpdate,
  applyCoachFields,
  CoachFieldError,
  GRADED_FIELDS,
  HAS_FLAG_FIELDS,
  FEASIBILITY_FIELDS,
} from '../apply-coach-fields'

describe('buildCoachUpdate — schema pins (drift guard vs admit/route.ts)', () => {
  it('keeps the exact 14 graded fields, 8 has_ flags, 6 feasibility keys', () => {
    expect(GRADED_FIELDS).toHaveLength(14)
    expect(HAS_FLAG_FIELDS).toHaveLength(8)
    expect(FEASIBILITY_FIELDS).toHaveLength(6)
    // the 6 graded fields WITHOUT a has_ flag must never gain one (writing it 500s)
    const noFlag = GRADED_FIELDS.filter((f) => !HAS_FLAG_FIELDS.includes(f as never))
    expect(noFlag.sort()).toEqual(
      ['exclusions', 'icp_buyer_title', 'icp_company_size', 'icp_partner_type', 'icp_stage', 'icp_verticals'].sort(),
    )
  })
})

describe('buildCoachUpdate — valid writes', () => {
  it('writes a flagged graded field as column + has_ flag', () => {
    const u = buildCoachUpdate({ fields: { promise: '  sing-along karaoke that polishes your voice  ' } })
    expect(u.columns.promise).toBe('sing-along karaoke that polishes your voice') // trimmed
    expect(u.columns.has_promise).toBe(true)
    expect(u.touched).toEqual(['promise'])
  })

  it('writes a no-flag graded field as column ONLY (no has_ key)', () => {
    const u = buildCoachUpdate({ fields: { icp_partner_type: 'singing academies' } })
    expect(u.columns.icp_partner_type).toBe('singing academies')
    expect('has_icp_partner_type' in u.columns).toBe(false)
  })

  it('partial/resume set touches ONLY the given fields and their flags', () => {
    const u = buildCoachUpdate({ fields: { distributor: 'singing teachers', friction: 'no feedback between lessons' } })
    expect(Object.keys(u.columns).sort()).toEqual(
      ['distributor', 'friction', 'has_distributor', 'has_friction'].sort(),
    )
  })

  it('skips an empty value (no clear, no flag) rather than wiping a column', () => {
    const u = buildCoachUpdate({ fields: { promise: '   ' } })
    expect(u.touched).toEqual([])
    expect(Object.keys(u.columns)).toHaveLength(0)
  })
})

describe('buildCoachUpdate — security boundary', () => {
  it('rejects an unknown graded field', () => {
    expect(() => buildCoachUpdate({ fields: { is_draft: 'false' } })).toThrow(CoachFieldError)
    expect(() => buildCoachUpdate({ fields: { drop_table: 'x' } })).toThrow(/unknown graded field/)
  })

  it('rejects an unknown feasibility field', () => {
    expect(() => buildCoachUpdate({ feasibility: { admitted: 'true' } })).toThrow(/unknown feasibility field/)
  })
})

describe('buildCoachUpdate — feasibility enum coercion', () => {
  it('accepts valid enum values', () => {
    const u = buildCoachUpdate({
      feasibility: { demand_tier: 'data', distributor_benefit_mode: 'paid', proof_of_demand: 'a waitlist of 40 schools' },
    })
    expect(u.feasibilityPatch).toEqual({
      demand_tier: 'data',
      distributor_benefit_mode: 'paid',
      proof_of_demand: 'a waitlist of 40 schools',
    })
    expect(Object.keys(u.columns)).toHaveLength(0) // feasibility goes to the patch, not a column
  })

  it('rejects an invalid demand_tier', () => {
    expect(() => buildCoachUpdate({ feasibility: { demand_tier: 'vibes' } })).toThrow(/invalid demand_tier/)
  })

  it('rejects an invalid distributor_benefit_mode', () => {
    expect(() => buildCoachUpdate({ feasibility: { distributor_benefit_mode: 'free' } })).toThrow(
      /invalid distributor_benefit_mode/,
    )
  })
})

// ---- applyCoachFields with a fake supabase client ----

interface FakeRow {
  feasibility?: Record<string, unknown> | null
}

function fakeSupabase(existing: FakeRow) {
  const updateSpy = vi.fn()
  const client = {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle: async () => ({ data: existing, error: null }),
              }
            },
          }
        },
        update(columns: Record<string, unknown>) {
          return {
            eq: async (_col: string, _val: string) => {
              updateSpy(columns)
              return { error: null }
            },
          }
        },
      }
    },
  }
  return { client: client as unknown as SupabaseClient, updateSpy }
}

describe('applyCoachFields — DB write', () => {
  it('merges the feasibility patch into the existing JSONB (accretes, not overwrites)', async () => {
    const { client, updateSpy } = fakeSupabase({ feasibility: { proof_of_demand: 'old', why_now: 'keep me' } })
    const res = await applyCoachFields(client, 'singify', {
      feasibility: { demand_tier: 'traction', proof_of_demand: 'new' },
    })
    expect(res.touched.sort()).toEqual(['demand_tier', 'proof_of_demand'])
    const written = updateSpy.mock.calls[0][0]
    expect(written.feasibility).toEqual({ why_now: 'keep me', proof_of_demand: 'new', demand_tier: 'traction' })
    expect(typeof written.last_validation_update).toBe('string')
  })

  it('writes graded columns + flags without reading feasibility when none given', async () => {
    const { client, updateSpy } = fakeSupabase({ feasibility: null })
    await applyCoachFields(client, 'singify', { fields: { promise: 'x', icp_stage: 'seed' } })
    const written = updateSpy.mock.calls[0][0]
    expect(written.promise).toBe('x')
    expect(written.has_promise).toBe(true)
    expect(written.icp_stage).toBe('seed')
    expect('feasibility' in written).toBe(false)
  })

  it('no-ops (no write) when nothing is touched', async () => {
    const { client, updateSpy } = fakeSupabase({ feasibility: null })
    const res = await applyCoachFields(client, 'singify', { fields: { promise: '  ' } })
    expect(res.touched).toEqual([])
    expect(updateSpy).not.toHaveBeenCalled()
  })

  it('propagates CoachFieldError for an unknown field (route maps to 400)', async () => {
    const { client } = fakeSupabase({ feasibility: null })
    await expect(applyCoachFields(client, 'singify', { fields: { evil: 'x' } })).rejects.toThrow(CoachFieldError)
  })

  it('requires a product slug', async () => {
    const { client } = fakeSupabase({ feasibility: null })
    await expect(applyCoachFields(client, '', { fields: { promise: 'x' } })).rejects.toThrow(/productSlug/)
  })
})
