import { NextResponse } from 'next/server'

export async function GET() {
  const keys = Object.keys(process.env).filter(k => k.includes('MINIMAX') || k.includes('API') || k.includes('KEY'))
  const mmKey = process.env.MINIMAX_API_KEY || '';
  return NextResponse.json({
    envKeysFound: keys,
    minimax: mmKey ? 'SET (' + mmKey.substring(0, 12) + '...)' : 'MISSING',
    other: { MINIMAX_API_KEY: mmKey ? mmKey.substring(0, 15) + '...' : 'MISSING' }
  })
}
