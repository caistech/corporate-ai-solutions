import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/pipeline/supabase-server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  if (code) {
    const supabase = createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('exchangeCodeForSession:', error)
      const failUrl = new URL('/admin/pipeline/login', request.url)
      failUrl.searchParams.set('error', error.message)
      return NextResponse.redirect(failUrl)
    }

    // Verify user is admin
    if (data.user) {
      const adminEmailsEnv = process.env.ADMIN_EMAILS || ''
      const adminEmails = adminEmailsEnv
        .split(/[,:]/)
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)

      const isAdmin = adminEmails.includes(data.user.email?.toLowerCase() || '')
      if (!isAdmin) {
        // Sign out non-admin
        await supabase.auth.signOut()
        const failUrl = new URL('/admin/pipeline/login', request.url)
        failUrl.searchParams.set('error', 'Admin access denied')
        return NextResponse.redirect(failUrl)
      }
    }
  }

  return NextResponse.redirect(new URL('/admin/pipeline', request.url))
}
