/**
 * Execute API Route Tests
 *
 * Tests the execute endpoint to catch regressions like:
 * - Missing credentials in fetch calls
 * - dry_run defaulting to true
 * - Auth not being checked
 *
 * Run: npm test
 */

import { describe, it, expect } from 'vitest'

const BASE_URL = process.env.PIPELINE_TEST_BASE_URL ?? 'http://localhost:3000'

// These hit a live server over HTTP — opt-in only. Without a reachable target they fail with
// ECONNREFUSED, and pointing at a default would silently hammer prod. Set PIPELINE_TEST_BASE_URL
// (e.g. http://localhost:3000 with `next dev` up, or a deploy URL) to run them.
const LIVE = !!process.env.PIPELINE_TEST_BASE_URL

describe.skipIf(!LIVE)('Execute API Route (live)', () => {
  describe('dry_run behavior', () => {
    it('should skip webhook when dry_run is NOT explicitly false', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/pipeline/singify/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_outreach' }),
      })

      const data = await res.json()

      // Should return dry-run response, not try to send webhook
      expect(data.mode).toBe('DRY_RUN')
      expect(data.next_step).toContain('dry_run: false')
    })

    it('should try to send webhook when dry_run is explicitly false', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/pipeline/singify/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_outreach', dry_run: false }),
      })

      const data = await res.json()

      // Either succeeds (200) or fails with specific error, but does NOT return DRY_RUN
      if (res.ok) {
        expect(data.mode).not.toBe('DRY_RUN')
      } else {
        // Should fail with meaningful error (auth required, webhook not set, etc)
        expect(data.error).toBeDefined()
      }
    })
  })

  describe('authentication requirement', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/pipeline/singify/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_outreach', dry_run: false }),
      })

      // Should require auth
      expect([401, 403]).toContain(res.status)
    })
  })
})
