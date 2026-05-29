import { NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.MINIMAX_API_KEY;
  return NextResponse.json({ 
    hasKey: !!key, 
    keyPrefix: key ? key.substring(0, 10) + '...' : null 
  });
}
