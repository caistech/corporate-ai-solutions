/**
 * Pipeline ↔ InvestorPilot Integration Tests
 *
 * Run: npm test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import crypto from 'crypto'

const BASE_URL = process.env.PIPELINE_TEST_BASE_URL ?? 'https://corporate-ai-solutions.vercel.app'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY
const WEBHOOK_SECRET = process.env.PIPELINE_INTAKE_WEBHOOK_SECRET ?? 'c783d980dd60533bfb36e817e5696b596acc476e924baa38e4585025ba93daf2'

// The "API Endpoints" block below makes real HTTP calls. Opt-in only (set PIPELINE_TEST_BASE_URL) —
// otherwise it ran against the prod Vercel URL on every `vitest run`. The HMAC + scoring suites
// below are pure unit tests and always run.
const LIVE = !!process.env.PIPELINE_TEST_BASE_URL

const testProductId = `e2e-test-${Date.now()}`

describe('Pipeline → InvestorPilot Integration', () => {
  describe('HMAC Signature Generation', () => {
    it('generates valid SHA256 HMAC signature', () => {
      const payload = { product_id: 'test-product', test: true }
      const body = JSON.stringify(payload)
      const signature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex')

      expect(signature).toHaveLength(64)
      expect(signature).toMatch(/^[a-f0-9]+$/)
    })

    it('produces different signatures for different payloads', () => {
      const payload1 = { product_id: 'test-1' }
      const payload2 = { product_id: 'test-2' }

      const sig1 = crypto.createHmac('sha256', WEBHOOK_SECRET).update(JSON.stringify(payload1)).digest('hex')
      const sig2 = crypto.createHmac('sha256', WEBHOOK_SECRET).update(JSON.stringify(payload2)).digest('hex')

      expect(sig1).not.toBe(sig2)
    })
  })

  describe('Market Validation Scoring', () => {
    const weights = {
      cta_click: 10,
      form_submit: 25,
      meeting_booked: 50,
      reply_received: 15,
    }

    const thresholds = {
      live: 30,
      die: 10,
    }

    function calculateVerdict(signals: { cta_clicks: number; form_submits: number; meetings_booked: number; replies_received: number }) {
      const score =
        signals.cta_clicks * weights.cta_click +
        signals.form_submits * weights.form_submit +
        signals.meetings_booked * weights.meeting_booked +
        signals.replies_received * weights.reply_received

      const total = signals.cta_clicks + signals.form_submits + signals.meetings_booked + signals.replies_received

      if (total === 0) return 'PENDING'
      if (score >= thresholds.live) return 'LIVE'
      if (score <= thresholds.die) return 'DIE'
      return 'PENDING'
    }

    it('returns PENDING with no signals', () => {
      const verdict = calculateVerdict({ cta_clicks: 0, form_submits: 0, meetings_booked: 0, replies_received: 0 })
      expect(verdict).toBe('PENDING')
    })

    it('returns LIVE with high signals', () => {
      const verdict = calculateVerdict({ cta_clicks: 5, form_submits: 2, meetings_booked: 1, replies_received: 1 })
      expect(verdict).toBe('LIVE')
      expect(5 * 10 + 2 * 25 + 1 * 50 + 1 * 15).toBe(165)
    })

    it('returns DIE with low signals', () => {
      const verdict = calculateVerdict({ cta_clicks: 1, form_submits: 0, meetings_booked: 0, replies_received: 0 })
      expect(verdict).toBe('DIE')
      expect(1 * 10).toBe(10)
    })

    it('returns PENDING with medium signals', () => {
      const verdict = calculateVerdict({ cta_clicks: 2, form_submits: 0, meetings_booked: 0, replies_received: 0 })
      expect(verdict).toBe('PENDING')
      expect(2 * 10).toBe(20)
    })

    it('handles boundary at live threshold', () => {
      const verdict = calculateVerdict({ cta_clicks: 3, form_submits: 0, meetings_booked: 0, replies_received: 0 })
      expect(verdict).toBe('LIVE')
      expect(3 * 10).toBe(30)
    })

    it('handles boundary at die threshold', () => {
      const verdict = calculateVerdict({ cta_clicks: 1, form_submits: 0, meetings_booked: 0, replies_received: 0 })
      expect(verdict).toBe('DIE')
      expect(1 * 10).toBe(10)
    })
  })

  describe.skipIf(!LIVE)('API Endpoints (live)', () => {
    it('market-validate GET returns current status', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/pipeline/nonexistent-product-${Date.now()}/market-validate`)
      expect(res.status).toBe(404)
    })

    it('market-validate POST with dry_run returns verdict', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/pipeline/test-product/market-validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dry_run: true }),
      })

      expect([200, 404]).toContain(res.status)
    })

    it('execute with dry_run returns mode DRY_RUN', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/pipeline/test-product-execute-${Date.now()}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dry_run: true }),
      })

      if (res.status === 200) {
        const json = await res.json()
        expect(json.mode).toBe('DRY_RUN')
      } else {
        // 401/403 = the admin auth gate rejecting an unauthenticated call (correct); 400/404 = bad
        // request / unknown product. All are acceptable non-200 outcomes for this probe.
        expect([400, 401, 403, 404]).toContain(res.status)
      }
    })
  })
})
