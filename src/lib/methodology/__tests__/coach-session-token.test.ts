import { describe, it, expect } from 'vitest'
import { mintCoachToken, verifyCoachToken, CoachTokenError } from '../coach-session-token'

const SECRET = 'test-secret-do-not-use-in-prod'
const NOW = 1_750_000_000 // fixed clock (unix seconds)

describe('coach session token — roundtrip', () => {
  it('mints and verifies, returning the operator id + slug', () => {
    const tok = mintCoachToken({ user_id: 'op-uuid', slug: 'singify' }, { secret: SECRET, nowSeconds: NOW })
    const claims = verifyCoachToken(tok, { secret: SECRET, nowSeconds: NOW + 10 })
    expect(claims.user_id).toBe('op-uuid')
    expect(claims.slug).toBe('singify')
    expect(claims.exp).toBeGreaterThan(NOW)
  })

  it('binds the slug — verify passes when expectSlug matches', () => {
    const tok = mintCoachToken({ user_id: 'op', slug: 'singify' }, { secret: SECRET, nowSeconds: NOW })
    expect(() => verifyCoachToken(tok, { secret: SECRET, expectSlug: 'singify', nowSeconds: NOW + 5 })).not.toThrow()
  })
})

describe('coach session token — rejection (the 401 boundary)', () => {
  it('rejects a tampered signature', () => {
    const tok = mintCoachToken({ user_id: 'op', slug: 'singify' }, { secret: SECRET, nowSeconds: NOW })
    const [payload] = tok.split('.')
    const forged = `${payload}.${'A'.repeat(43)}`
    expect(() => verifyCoachToken(forged, { secret: SECRET, nowSeconds: NOW + 5 })).toThrow(CoachTokenError)
  })

  it('rejects a tampered payload (signature no longer matches)', () => {
    const tok = mintCoachToken({ user_id: 'op', slug: 'singify' }, { secret: SECRET, nowSeconds: NOW })
    const sig = tok.split('.')[1]
    const evil = Buffer.from(JSON.stringify({ user_id: 'attacker', slug: 'singify', exp: NOW + 9999 }))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    expect(() => verifyCoachToken(`${evil}.${sig}`, { secret: SECRET, nowSeconds: NOW + 5 })).toThrow(/bad signature/)
  })

  it('rejects an expired token', () => {
    const tok = mintCoachToken({ user_id: 'op', slug: 'singify' }, { secret: SECRET, ttlSeconds: 60, nowSeconds: NOW })
    expect(() => verifyCoachToken(tok, { secret: SECRET, nowSeconds: NOW + 61 })).toThrow(/expired/)
  })

  it('rejects a wrong-slug binding', () => {
    const tok = mintCoachToken({ user_id: 'op', slug: 'singify' }, { secret: SECRET, nowSeconds: NOW })
    expect(() => verifyCoachToken(tok, { secret: SECRET, expectSlug: 'deal-findrs', nowSeconds: NOW + 5 })).toThrow(
      /slug mismatch/,
    )
  })

  it('rejects a token signed with a different secret', () => {
    const tok = mintCoachToken({ user_id: 'op', slug: 'singify' }, { secret: 'other-secret', nowSeconds: NOW })
    expect(() => verifyCoachToken(tok, { secret: SECRET, nowSeconds: NOW + 5 })).toThrow(/bad signature/)
  })

  it('rejects a malformed token', () => {
    expect(() => verifyCoachToken('not-a-token', { secret: SECRET })).toThrow(/malformed/)
  })

  it('throws when the secret is unconfigured', () => {
    const tok = mintCoachToken({ user_id: 'op', slug: 'singify' }, { secret: SECRET, nowSeconds: NOW })
    expect(() => verifyCoachToken(tok, { secret: '', nowSeconds: NOW + 5 })).toThrow(/not configured/)
  })
})
