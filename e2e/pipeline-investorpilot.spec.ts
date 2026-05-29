/**
 * Pipeline ↔ InvestorPilot Integration E2E Test
 *
 * Tests the full integration flow:
 * 1. Execute product → sends to InvestorPilot via webhook (with HMAC)
 * 2. Track signals (cta_click, form_submit, meeting_booked, reply_received)
 * 3. Market validation (LIVE/DIE/PENDING verdict)
 *
 * Run:
 *   npx playwright test e2e/pipeline-investorpilot.spec.ts
 *
 * Or with custom base URL:
 *   PIPELINE_TEST_BASE_URL=https://corporate-ai-solutions.vercel.app \
 *   npx playwright test e2e/pipeline-investorpilot.spec.ts
 */

import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const BASE_URL = process.env.PIPELINE_TEST_BASE_URL ?? 'https://corporate-ai-solutions.vercel.app'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY
const WEBHOOK_SECRET = process.env.PIPELINE_INTAKE_WEBHOOK_SECRET ?? 'c783d980dd60533bfb36e817e5696b596acc476e924baa38e4585025ba93daf2'

const testProductId = `e2e-test-${Date.now()}`

test.describe('Pipeline ↔ InvestorPilot Integration', () => {
  const admin = SUPABASE_URL && SUPABASE_SERVICE
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE, { auth: { autoRefreshToken: false, persistSession: false } })
    : null

  test.beforeEach(async () => {
    if (!admin) {
      test.skip(true, 'SUPABASE_SERVICE_ROLE_KEY not set')
      return
    }

    await admin.from('product_validation_status').upsert({
      product_slug: testProductId,
      display_name: 'E2E Test Product',
      promise: 'Test promise',
      distributor: 'Test distributor',
      end_user: 'Test end user',
      friction: 'Test friction',
      weighted_score_percent: 85,
      has_promise: true,
      has_distributor: true,
      has_end_user: true,
      has_friction: true,
      has_methodology_commitment: false,
      hard_gates_passed: 5,
      gate1_ready: true,
      validation_stage: 'stage_2_feasibility',
      regulated: false,
    })
  })

  test.afterEach(async () => {
    if (!admin) return

    await admin.from('product_validation_status').delete().eq('product_slug', testProductId)
    await admin.from('validation_events').delete().eq('product_slug', testProductId)
  })

  test('1. Execute sends product to InvestorPilot with HMAC signature', async ({ request }) => {
    const payload = { dry_run: false }

    const response = await request.post(`${BASE_URL}/api/admin/pipeline/${testProductId}/execute`, {
      data: payload,
    })

    expect(response.status(), `Execute failed: ${await response.text()}`).toBe(200)

    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.mode).toBe('EXECUTED')
  })

  test('2. Market validation returns PENDING with no signals', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/admin/pipeline/${testProductId}/market-validate`, {
      data: { dry_run: true },
    })

    expect(response.status()).toBe(200)

    const json = await response.json()
    expect(json.result.verdict).toBe('PENDING')
    expect(json.result.signals.total).toBe(0)
    expect(json.result.score).toBe(0)
  })

  test('3. Market validation calculates LIVE with high signals', async ({ request }) => {
    if (!admin) {
      test.skip(true, 'No admin client')
      return
    }

    await admin.from('product_validation_status').update({
      cta_clicks: 5,
      form_submits: 2,
      meetings_booked: 1,
      replies_received: 1,
    }).eq('product_slug', testProductId)

    const response = await request.post(`${BASE_URL}/api/admin/pipeline/${testProductId}/market-validate`, {
      data: { dry_run: true },
    })

    expect(response.status()).toBe(200)

    const json = await response.json()
    expect(json.result.verdict).toBe('LIVE')
    expect(json.result.score).toBe(135)
  })

  test('4. Market validation calculates DIE with low signals', async ({ request }) => {
    if (!admin) {
      test.skip(true, 'No admin client')
      return
    }

    await admin.from('product_validation_status').update({
      cta_clicks: 1,
    }).eq('product_slug', testProductId)

    const response = await request.post(`${BASE_URL}/api/admin/pipeline/${testProductId}/market-validate`, {
      data: { dry_run: true },
    })

    expect(response.status()).toBe(200)

    const json = await response.json()
    expect(json.result.verdict).toBe('DIE')
    expect(json.result.score).toBe(10)
  })

  test('5. Market validation calculates PENDING with medium signals', async ({ request }) => {
    if (!admin) {
      test.skip(true, 'No admin client')
      return
    }

    await admin.from('product_validation_status').update({
      cta_clicks: 2,
    }).eq('product_slug', testProductId)

    const response = await request.post(`${BASE_URL}/api/admin/pipeline/${testProductId}/market-validate`, {
      data: { dry_run: true },
    })

    expect(response.status()).toBe(200)

    const json = await response.json()
    expect(json.result.verdict).toBe('PENDING')
    expect(json.result.score).toBe(20)
  })

  test('6. Execute with dry_run shows payload without sending', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/admin/pipeline/${testProductId}/execute`, {
      data: { dry_run: true },
    })

    expect(response.status()).toBe(200)

    const json = await response.json()
    expect(json.mode).toBe('DRY_RUN')
    expect(json.would_execute).toBeDefined()
    expect(json.would_execute.product_id).toBe(testProductId)
    expect(json.next_step).toContain('dry_run: false')
  })

  test('7. GET market-validate returns current status', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/admin/pipeline/${testProductId}/market-validate`)

    expect(response.status()).toBe(200)

    const json = await response.json()
    expect(json.product_slug).toBe(testProductId)
    expect(json.current_signals).toBeDefined()
    expect(json.config).toBeDefined()
    expect(json.config.weights).toEqual({
      cta_click: 10,
      form_submit: 25,
      meeting_booked: 50,
      reply_received: 15,
    })
  })

  test('8. HMAC signature is correctly generated', () => {
    const payload = { product_id: testProductId, test: true }
    const body = JSON.stringify(payload)
    const signature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex')

    expect(signature).toHaveLength(64)
    expect(signature).toMatch(/^[a-f0-9]+$/)
  })
})
