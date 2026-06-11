/**
 * Operator-auth helper for the /api/admin/ops/* routes.
 *
 * /api/admin/* is NOT covered by the middleware matcher (['/pipeline/*','/admin/*',
 * '/api/methodology/*']), so each ops API route must verify the operator session +
 * ADMIN_EMAILS allowlist itself. This centralises that check so every ops route enforces
 * it identically (previously inlined only in the balance route).
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * True when the email is on the ADMIN_EMAILS allowlist. Fails CLOSED: if ADMIN_EMAILS is
 * unset, a config mistake must deny access rather than silently authorise — never bake in
 * fallback addresses (that would be an auth bypass).
 */
export function isOperator(email: string | undefined | null): boolean {
  const raw = process.env.ADMIN_EMAILS
  if (!raw) {
    console.error('[ops/auth] ADMIN_EMAILS not set — denying operator access (fail closed)')
    return false
  }
  const allow = raw
    .split(/[,:]/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return allow.includes((email || '').toLowerCase())
}

export async function getOperatorEmail(): Promise<string | null> {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } },
  )
  const { data } = await supabase.auth.getUser()
  return data.user?.email ?? null
}

export type OperatorGate =
  | { ok: true; email: string }
  | { ok: false; status: 401 | 403; error: string }

/**
 * Resolve the caller's operator status in one call. Routes do:
 *   const gate = await requireOperator()
 *   if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })
 */
export async function requireOperator(): Promise<OperatorGate> {
  const email = await getOperatorEmail()
  if (!email) return { ok: false, status: 401, error: 'Authentication required' }
  if (!isOperator(email)) return { ok: false, status: 403, error: 'Operator access required' }
  return { ok: true, email }
}
