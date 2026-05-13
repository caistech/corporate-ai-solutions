/**
 * Pipeline tracker — Playwright smoke test.
 *
 * Tests the full happy path: login → today → capture contact → log event,
 * then verifies the audit_log has entries with non-NULL actor_id.
 *
 * Setup (run once locally):
 *   npm install -D @playwright/test
 *   npx playwright install chromium
 *
 * To run:
 *   PIPELINE_TEST_BASE_URL=http://localhost:3000 \
 *   PIPELINE_TEST_EMAIL=you@example.com \
 *   PIPELINE_TEST_PASSWORD=xxx \
 *   NEXT_PUBLIC_SUPABASE_URL=... \
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   npx playwright test e2e/pipeline-smoke.spec.ts
 *
 * Requires the test user to have password auth enabled (or adapt to use a
 * magic-link helper that grabs the token via the Supabase admin API).
 */

import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const BASE = process.env.PIPELINE_TEST_BASE_URL ?? 'http://localhost:3000'
const EMAIL = process.env.PIPELINE_TEST_EMAIL
const PASSWORD = process.env.PIPELINE_TEST_PASSWORD
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY

test.skip(
  !EMAIL || !PASSWORD || !SUPABASE_URL || !SUPABASE_ANON || !SUPABASE_SERVICE,
  'env not set for smoke test'
)

test('login → today → capture → log event → audit_log written', async ({ page, context }) => {
  // Pre-authenticate via Supabase JS to get a session cookie quickly,
  // bypassing the magic-link flow (which can't be polled in CI).
  const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON!)
  const { data: signIn, error: signInError } = await supabase.auth.signInWithPassword({
    email: EMAIL!,
    password: PASSWORD!,
  })
  expect(signInError).toBeNull()
  expect(signIn.session).toBeTruthy()

  // Inject session cookie. The cookie names follow Supabase SSR conventions.
  const projectRef = new URL(SUPABASE_URL!).hostname.split('.')[0]
  await context.addCookies([
    {
      name: `sb-${projectRef}-auth-token`,
      value: JSON.stringify([signIn.session!.access_token, signIn.session!.refresh_token, null, null, null]),
      domain: new URL(BASE).hostname,
      path: '/',
      sameSite: 'Lax',
      httpOnly: false,
    },
  ])

  await page.goto(`${BASE}/pipeline/today`)
  await expect(page.getByRole('heading', { name: /today/i })).toBeVisible()

  // Capture a new contact
  const captureName = `Smoke ${Date.now()}`
  await page.getByRole('link', { name: /\+ Add contact|\+ New/i }).first().click()
  await page.getByLabel('Name').fill(captureName)
  await page.getByRole('button', { name: /capture contact/i }).click()

  // Now on contact detail
  await expect(page.getByRole('heading', { name: captureName })).toBeVisible({ timeout: 10_000 })

  // Log an event
  await page.getByRole('button', { name: /\+ Log event/i }).click()
  await page.getByLabel('Summary').fill('smoke test event')
  await page.getByRole('button', { name: /^Log event$/i }).click()
  await expect(page.getByText('smoke test event')).toBeVisible()

  // Verify audit_log entries via service-role
  const admin = createClient(SUPABASE_URL!, SUPABASE_SERVICE!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const userId = signIn.user!.id

  const { data: auditRows, error: auditError } = await admin
    .schema('pipeline')
    .from('audit_log')
    .select('*')
    .eq('actor_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)

  expect(auditError).toBeNull()
  expect(auditRows?.length ?? 0).toBeGreaterThan(0)
  for (const row of auditRows ?? []) {
    expect(row.actor_id).toBe(userId)
  }
})
