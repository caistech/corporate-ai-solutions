/**
 * RLS isolation smoke test for pipeline.contacts.
 *
 * Confirms that two distinct authenticated users cannot see each other's rows.
 * Skips automatically unless the required env vars are set (CI / local with
 * test Supabase project). Run with:
 *
 *   PIPELINE_RLS_TEST=1 \
 *   NEXT_PUBLIC_SUPABASE_URL=... \
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   npx vitest run src/lib/pipeline/__tests__/rls-isolation.test.ts
 *
 * Do NOT run against the production Supabase project — this creates and
 * deletes test users. Use a dedicated test project.
 */

import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'

const SHOULD_RUN = process.env.PIPELINE_RLS_TEST === '1'
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const run = SHOULD_RUN && url && anonKey && serviceKey ? describe : describe.skip

run('RLS isolation: pipeline.contacts', () => {
  let adminClient: SupabaseClient
  let userA: { id: string; email: string; password: string }
  let userB: { id: string; email: string; password: string }
  let userAClient: SupabaseClient
  let userBClient: SupabaseClient
  let contactAId: string

  beforeAll(async () => {
    adminClient = createSupabaseClient(url!, serviceKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const stamp = Date.now()
    userA = {
      id: '',
      email: `rls-test-a-${stamp}@example.invalid`,
      password: `Pass-${stamp}-A!`,
    }
    userB = {
      id: '',
      email: `rls-test-b-${stamp}@example.invalid`,
      password: `Pass-${stamp}-B!`,
    }

    const { data: a, error: aErr } = await adminClient.auth.admin.createUser({
      email: userA.email,
      password: userA.password,
      email_confirm: true,
    })
    if (aErr) throw aErr
    userA.id = a.user!.id

    const { data: b, error: bErr } = await adminClient.auth.admin.createUser({
      email: userB.email,
      password: userB.password,
      email_confirm: true,
    })
    if (bErr) throw bErr
    userB.id = b.user!.id

    userAClient = createSupabaseClient(url!, anonKey!)
    await userAClient.auth.signInWithPassword({
      email: userA.email,
      password: userA.password,
    })

    userBClient = createSupabaseClient(url!, anonKey!)
    await userBClient.auth.signInWithPassword({
      email: userB.email,
      password: userB.password,
    })
  })

  afterAll(async () => {
    if (userA?.id) await adminClient.auth.admin.deleteUser(userA.id)
    if (userB?.id) await adminClient.auth.admin.deleteUser(userB.id)
  })

  it('user A can insert their own contact', async () => {
    const { data, error } = await userAClient
      .schema('pipeline')
      .from('contacts')
      .insert({ name: 'A-only', source: 'linkedin' })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data?.owner_id).toBe(userA.id)
    contactAId = data!.id
  })

  it("user B sees zero rows from user A's contacts", async () => {
    const { data, error } = await userBClient
      .schema('pipeline')
      .from('contacts')
      .select('*')

    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it('user B cannot update user A\'s contact', async () => {
    const { error, data } = await userBClient
      .schema('pipeline')
      .from('contacts')
      .update({ name: 'hijacked' })
      .eq('id', contactAId)
      .select()

    // RLS suppresses the row: either zero rows returned, or an explicit error
    expect(data ?? []).toEqual([])
    expect(error?.code === 'PGRST116' || (data ?? []).length === 0).toBe(true)
  })

  it('user B cannot delete user A\'s contact', async () => {
    const { error } = await userBClient
      .schema('pipeline')
      .from('contacts')
      .delete()
      .eq('id', contactAId)

    // Still expect the row to exist when queried as A
    const { data } = await userAClient
      .schema('pipeline')
      .from('contacts')
      .select('id')
      .eq('id', contactAId)
      .single()

    expect(error).toBeFalsy()
    expect(data?.id).toBe(contactAId)
  })
})
