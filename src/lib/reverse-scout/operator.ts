/**
 * Operator auth guard for the Reverse Scout API routes.
 *
 * /api/admin/* is NOT covered by the middleware matcher (['/pipeline/*','/admin/*',
 * '/api/methodology/*']), so these routes verify the operator session + ADMIN_EMAILS
 * allowlist themselves — same fail-closed pattern as /api/admin/ops/balance.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function isOperator(email: string | undefined | null): boolean {
  // Fail CLOSED: no hard-coded fallback addresses. An unset ADMIN_EMAILS must deny, never
  // silently authorize baked-in personal accounts (that would be an auth bypass).
  const raw = process.env.ADMIN_EMAILS
  if (!raw) {
    console.error('[reverse-scout] ADMIN_EMAILS not set — denying operator access (fail closed)')
    return false
  }
  const allow = raw
    .split(/[,:]/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return allow.includes((email || '').toLowerCase())
}

async function getOperatorEmail(): Promise<string | null> {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } },
  )
  const { data } = await supabase.auth.getUser()
  return data.user?.email ?? null
}

/**
 * Returns `{ email }` when the caller is an authenticated operator, or `{ error, status }` to
 * return verbatim as a NextResponse.json body. Keeps every route's guard to two lines.
 */
export async function requireOperator(): Promise<
  { ok: true; email: string } | { ok: false; error: string; status: 401 | 403 }
> {
  const email = await getOperatorEmail()
  if (!email) return { ok: false, error: 'Authentication required', status: 401 }
  if (!isOperator(email)) return { ok: false, error: 'Operator access required', status: 403 }
  return { ok: true, email }
}
