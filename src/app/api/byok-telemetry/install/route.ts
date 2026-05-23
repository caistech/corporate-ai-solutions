import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'

// Rule 10 carve-out — anonymous install telemetry.
// Receives one POST per BYOK install when /setup completes successfully.
// install_id is a UUID generated at first-run on the user's own deploy;
// never derived from any user identifier. No PII columns persisted.
const InstallPingSchema = z.object({
  tool: z.string().min(1).max(120),
  version: z.string().min(1).max(64),
  install_id: z.string().uuid(),
  timestamp: z.string().datetime().optional(),
})

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Max-Age': '86400',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = InstallPingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid telemetry payload', issues: parsed.error.issues },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    const supabase = supabaseAdmin()
    // Upsert on install_id — re-runs of /setup from the same install
    // update last_seen + version without double-counting.
    const { error } = await supabase
      .from('byok_installs')
      .upsert(
        {
          install_id: parsed.data.install_id,
          tool: parsed.data.tool,
          version: parsed.data.version,
          last_seen: new Date().toISOString(),
        },
        { onConflict: 'install_id' }
      )

    if (error) {
      console.error('Supabase error (byok_installs upsert):', error)
      // Swallow downstream — telemetry must never break a user's deploy.
      return NextResponse.json(
        { success: false, error: 'persistence failed' },
        { status: 200, headers: CORS_HEADERS }
      )
    }

    return NextResponse.json(
      { success: true },
      { status: 200, headers: CORS_HEADERS }
    )
  } catch (error) {
    console.error('API error (/api/byok-telemetry/install):', error)
    return NextResponse.json(
      { success: false, error: 'malformed request' },
      { status: 200, headers: CORS_HEADERS }
    )
  }
}
