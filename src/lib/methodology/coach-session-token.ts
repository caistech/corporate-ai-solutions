// coach-session-token — our own HMAC session token for the voice coach
// (docs/VOICE_COACH_PLAN.md §4, BLOCKER-3 fix).
//
// The convai package's mintAnonSessionToken emits {sid, agentId, exp} on the anon path
// (TTL-purged at 24h, no slug, no operator id) — unusable for an authed, slug-bound,
// persistent-memory coach. So we mint our OWN {user_id, slug, exp} token. The authed server
// component mints it; every package-external tool route (save-field, card-state) and the
// convai resolveSession verify it. The package's resolveSession/HMAC does NOT cover the
// custom tool routes — this is their auth.
//
// Format: `<base64url(JSON payload)>.<base64url(HMAC-SHA256(payload, secret))>`. Stateless;
// verification needs only the shared secret (COACH_SESSION_TOKEN_SECRET).

import { createHmac, timingSafeEqual } from 'crypto'

export interface CoachSessionClaims {
  /** Operator auth.uid() — the authed identity memory is keyed to (NOT an anon UUID). */
  user_id: string
  /** The product_validation_status row this conversation binds to. */
  slug: string
  /** Expiry, unix seconds. */
  exp: number
}

export class CoachTokenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CoachTokenError'
  }
}

const DEFAULT_TTL_SECONDS = 60 * 60 // 1h — long enough for an onboarding walk, short enough to bound replay.

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromB64url(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
}

function resolveSecret(secret?: string): string {
  const s = secret ?? process.env.COACH_SESSION_TOKEN_SECRET
  if (!s) throw new CoachTokenError('COACH_SESSION_TOKEN_SECRET not configured')
  return s
}

function sign(payloadB64: string, secret: string): string {
  return b64url(createHmac('sha256', secret).update(payloadB64).digest())
}

export interface MintOptions {
  ttlSeconds?: number
  secret?: string
  /** Injectable clock (unix seconds) for tests. Defaults to real time. */
  nowSeconds?: number
}

/** Mint a signed coach session token for an operator + product slug. */
export function mintCoachToken(
  claims: { user_id: string; slug: string },
  opts: MintOptions = {},
): string {
  if (!claims.user_id) throw new CoachTokenError('user_id required')
  if (!claims.slug) throw new CoachTokenError('slug required')
  const secret = resolveSecret(opts.secret)
  const now = opts.nowSeconds ?? Math.floor(Date.now() / 1000)
  const exp = now + (opts.ttlSeconds ?? DEFAULT_TTL_SECONDS)
  const payload: CoachSessionClaims = { user_id: claims.user_id, slug: claims.slug, exp }
  const payloadB64 = b64url(Buffer.from(JSON.stringify(payload), 'utf8'))
  return `${payloadB64}.${sign(payloadB64, secret)}`
}

export interface VerifyOptions {
  secret?: string
  /** If given, the token's slug MUST equal this — the per-conversation binding check. */
  expectSlug?: string
  /** Injectable clock (unix seconds) for tests. */
  nowSeconds?: number
}

/**
 * Verify a coach session token: signature (timing-safe), expiry, and — when `expectSlug` is
 * given — the slug binding. Returns the claims or throws CoachTokenError. Callers map a throw
 * to 401 (the CRITICAL security boundary on the custom tool routes, §8).
 */
export function verifyCoachToken(token: string, opts: VerifyOptions = {}): CoachSessionClaims {
  const secret = resolveSecret(opts.secret)
  if (typeof token !== 'string' || !token.includes('.')) {
    throw new CoachTokenError('malformed token')
  }
  const [payloadB64, sigB64] = token.split('.')
  if (!payloadB64 || !sigB64) throw new CoachTokenError('malformed token')

  const expectedSig = sign(payloadB64, secret)
  const a = Buffer.from(sigB64)
  const b = Buffer.from(expectedSig)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new CoachTokenError('bad signature')
  }

  let claims: CoachSessionClaims
  try {
    claims = JSON.parse(fromB64url(payloadB64).toString('utf8')) as CoachSessionClaims
  } catch {
    throw new CoachTokenError('unparseable payload')
  }
  if (!claims.user_id || !claims.slug || typeof claims.exp !== 'number') {
    throw new CoachTokenError('incomplete claims')
  }

  const now = opts.nowSeconds ?? Math.floor(Date.now() / 1000)
  if (claims.exp <= now) throw new CoachTokenError('expired')

  if (opts.expectSlug !== undefined && claims.slug !== opts.expectSlug) {
    throw new CoachTokenError(`slug mismatch (token=${claims.slug}, expected=${opts.expectSlug})`)
  }

  return claims
}
