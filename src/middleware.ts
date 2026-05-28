import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// Methodology API routes that carry their OWN auth (HMAC / token) and must NOT be
// cookie-gated — gating them would 401 the inbound webhook and break the loop.
// /sync is the Connexions HMAC return-leg (X-Methodology-Signature).
const API_EXEMPT = ['/api/methodology/sync']

function isOperator(email: string | undefined | null): boolean {
  const allow = (process.env.ADMIN_EMAILS || 'mcmdennis@gmail.com,dennis@corporateaisolutions.com')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return allow.includes((email || '').toLowerCase())
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isApi = pathname.startsWith('/api/methodology')

  // Externally-authed routes short-circuit BEFORE the session lookup — they have no
  // operator cookie and run on their own auth (e.g. the /sync HMAC webhook).
  if (isApi && API_EXEMPT.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Operator-only methodology API: these fire real outreach + API cost (validate,
  // pools/launch), mutate decisions (PATCH), or incur LLM cost (propose / pools/assess /
  // score). The matcher previously excluded /api, leaving them OPEN — an unauthed caller
  // who knew a slug could fire real InvestorPilot outreach. Respond with JSON (never an
  // HTML login redirect) since the callers are fetch / programmatic.
  if (isApi) {
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    if (!isOperator(user.email)) return NextResponse.json({ error: 'Operator access required' }, { status: 403 })
    return response
  }

  const isLogin = pathname === '/pipeline/login'
  const isCallback = pathname.startsWith('/pipeline/auth/')
  const isAdminCallback = pathname.startsWith('/admin/pipeline/auth/')
  const isAdmin = pathname.startsWith('/admin')

  // Unauthenticated → login. Covers /admin/* + /pipeline/* (the methodology cockpit
  // fires real outreach + API cost, so an open surface is a live exposure).
  // Callbacks (/pipeline/auth/*, /admin/pipeline/auth/*) are exempt — they handle
  // the magic-link code exchange before the user session exists.
  if (!isLogin && !isCallback && !isAdminCallback && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/pipeline/login'
    return NextResponse.redirect(url)
  }

  // /admin/* is operator-only: a logged-in user must also be on the admin allowlist.
  if (isAdmin && user && !isOperator(user.email)) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  if (isLogin && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/pipeline/welcome'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/pipeline/:path*', '/admin/:path*', '/api/methodology/:path*'],
}
