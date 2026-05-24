import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
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

  const pathname = request.nextUrl.pathname
  const isLogin = pathname === '/pipeline/login'
  const isCallback = pathname.startsWith('/pipeline/auth/')
  const isAdmin = pathname.startsWith('/admin')

  // Unauthenticated → login. Now covers /admin/* too (it was previously
  // ungated — the methodology cockpit fires real outreach + API cost, so an
  // open /admin was a live exposure).
  if (!isLogin && !isCallback && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/pipeline/login'
    return NextResponse.redirect(url)
  }

  // /admin/* is operator-only: a logged-in user must also be on the admin
  // allowlist. Without this, any authenticated marketplace user could reach the
  // cockpit. Allowlist via ADMIN_EMAILS env (comma-separated) which overrides;
  // falls back to the known operator emails so the gate works without the env var.
  if (isAdmin && user) {
    const allow = (process.env.ADMIN_EMAILS || 'mcmdennis@gmail.com,dennis@corporateaisolutions.com')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
    if (!allow.includes((user.email || '').toLowerCase())) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  if (isLogin && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/pipeline/today'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/pipeline/:path*', '/admin/:path*'],
}
