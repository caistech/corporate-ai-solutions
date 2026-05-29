import { NextResponse } from 'next/server'

export async function GET() {
  const keys = Object.keys(process.env).filter(k => k.includes('MINIMAX') || k.includes('API') || k.includes('KEY'))
  return NextResponse.json({
    envKeysFound: keys,
    minimax: process.env.MINIMAX_API_KEY ? 'SET' : 'MISSING',
    other: Object.fromEntries(
      Object.entries(process.env).filter(([k]) => k.includes('MINIMAX'))
    )
  })
}
