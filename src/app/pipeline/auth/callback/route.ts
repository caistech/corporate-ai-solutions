import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/pipeline/supabase-server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('exchangeCodeForSession:', error)
      const failUrl = new URL('/pipeline/login', request.url)
      failUrl.searchParams.set('error', error.message)
      return NextResponse.redirect(failUrl)
    }
  }

  return NextResponse.redirect(new URL('/pipeline/today', request.url))
}
