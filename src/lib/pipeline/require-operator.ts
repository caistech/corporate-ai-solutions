// requireOperator — in-route operator auth for /api/admin/* routes.
//
// The middleware matcher covers /pipeline/*, /admin/*, /api/methodology/* — NOT /api/admin/*.
// So routes under /api/admin/ MUST gate themselves. This is the canonical check: the cookie-bound
// anon client (the repo's MANDATORY auth pattern — never service-role for auth) resolves the
// session, then the operator allowlist (same default as middleware.isOperator) authorises.

import { createClient } from './supabase-server'

const DEFAULT_OPERATORS = 'mcmdennis@gmail.com,dennis@corporateaisolutions.com'

export function operatorAllowlist(): string[] {
  return (process.env.ADMIN_EMAILS || DEFAULT_OPERATORS)
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export interface Operator {
  id: string
  email: string
}

/** Resolve the authed operator from the request cookies, or null (route returns 401/403). */
export async function requireOperator(): Promise<Operator | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const email = (user.email || '').toLowerCase()
  if (!operatorAllowlist().includes(email)) return null
  return { id: user.id, email }
}
