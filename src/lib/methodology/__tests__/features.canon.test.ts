import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { KNOWN_FEATURES } from '../features'

// Cross-repo drift guard. The conditional feature tags MUST stay in lockstep with the canon
// in cais-shared-services/gate-readiness/applicability.json `features` keys — the same set the
// scorer's applies_when, the seed migration, and the workbook all derive from. The 3-way in-repo
// duplication (z.enum / CockpitControls / enroll-card) already drifted once (address-or-abn-fields,
// public-web); this test closes that class of bug.

// Embedded snapshot — the guard that runs everywhere (incl. CI, where the sibling repo isn't
// checked out). Updating KNOWN_FEATURES without updating this forces a conscious "is it in the
// canon?" moment.
const CANON = [
  'voice',
  'auth',
  'supabase',
  'third-party-content',
  'address-or-abn-fields',
  'email',
  'public-web',
] as const

const sorted = (xs: readonly string[]) => [...xs].sort()

describe('KNOWN_FEATURES stays in lockstep with the shared applicability canon', () => {
  it('matches the embedded canon snapshot', () => {
    expect(sorted(KNOWN_FEATURES)).toEqual(sorted(CANON))
  })

  it('matches cais-shared-services/gate-readiness/applicability.json when the sibling repo is present', () => {
    // vitest cwd = the cockpit repo root; the sibling shared-services repo is one level up.
    const canonPath = resolve(
      process.cwd(),
      '..',
      'cais-shared-services',
      'gate-readiness',
      'applicability.json',
    )
    if (!existsSync(canonPath)) {
      // Sibling repo not checked out (e.g. CI) — the embedded snapshot above is the guard.
      return
    }
    const canon = JSON.parse(readFileSync(canonPath, 'utf8')) as { features: Record<string, string> }
    expect(sorted(KNOWN_FEATURES)).toEqual(sorted(Object.keys(canon.features)))
  })
})
