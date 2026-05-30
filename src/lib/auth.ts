/**
 * Standard auth utilities for Next.js + Supabase
 * COPY THIS FILE TO: src/lib/auth.ts in every repo
 * 
 * Auth checks: use cookie-aware client (createServerClient)
 * Data ops: use service role client (createClient with SERVICE_ROLE_KEY)
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

/**
 * Create cookie-aware client for auth operations.
 * Use for: getUser(), requireUser(), session checks
 */
export function createCookieClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.error('[auth] Missing env vars:', { 
      url: !!url, 
      key: !!key,
      urlValue: url,
    })
    throw new Error(`Supabase env missing: URL=${!!url}, KEY=${!!key}`)
  }
  
  const cookieStore = cookies()
  return createServerClient(url, key, {
    cookies: {
      get(name: string) { return cookieStore.get(name)?.value },
      set() {},
      remove() {},
    },
  })
}

/**
 * Get current user from session.
 * Returns null if not authenticated.
 */
export async function getUser() {
  const supabase = createCookieClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Get current user email (checks auth + profiles table).
 * Returns null if not authenticated.
 */
export async function getUserEmail(): Promise<string | null> {
  const user = await getUser()
  if (!user?.email) return null
  
  const supabase = createCookieClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single()
  
  return profile?.email || user.email
}

/**
 * Require user - throws if not authenticated.
 */
export async function requireUser() {
  const user = await getUser()
  if (!user) throw new Error('UNAUTHENTICATED')
  return user
}

/**
 * Require user email - throws if not authenticated.
 */
export async function requireUserEmail(): Promise<string> {
  const email = await getUserEmail()
  if (!email) throw new Error('UNAUTHENTICATED')
  return email
}

/**
 * Create service-role client for data operations (bypasses RLS).
 * NEVER use for auth checks - only for admin DB operations.
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
