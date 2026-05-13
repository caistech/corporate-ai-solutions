import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  use: {
    baseURL: process.env.PIPELINE_TEST_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
})
