import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/admin/verify-admin
 * Verifies if an email is in the ADMIN_EMAILS allowlist
 * Used by admin login to gate access to /admin/* routes
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ isAdmin: false }, { status: 400 })
    }

    // Get ADMIN_EMAILS from environment
    const adminEmailsEnv = process.env.ADMIN_EMAILS || ''
    const adminEmails = adminEmailsEnv
      .split(/[,:]/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)

    const isAdmin = adminEmails.includes(email.toLowerCase())

    return NextResponse.json({ isAdmin })
  } catch (error) {
    console.error('[verify-admin]', error)
    return NextResponse.json({ isAdmin: false }, { status: 500 })
  }
}
