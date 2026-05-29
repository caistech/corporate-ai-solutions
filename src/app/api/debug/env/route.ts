import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    INVESTORPILOT_WEBHOOK_URL: process.env.INVESTORPILOT_WEBHOOK_URL ? 'SET' : 'NOT_SET',
    PIPELINE_INTAKE_WEBHOOK_SECRET: process.env.PIPELINE_INTAKE_WEBHOOK_SECRET ? 'SET' : 'NOT_SET',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    MINIMAX_API_KEY: process.env.MINIMAX_API_KEY ? 'SET (' + process.env.MINIMAX_API_KEY.substring(0, 8) + '...)' : 'NOT_SET',
  })
}
