import { NextResponse } from 'next/server';

export async function GET() {
  const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
  const GROUP_ID = process.env.MINIMAX_GROUP_ID || '516712014697644041';
  
  if (!MINIMAX_API_KEY) {
    return NextResponse.json({ error: 'No API key' });
  }
  
  try {
    // Pay-as-you-go needs GroupId
    const response = await fetch('https://api.minimax.io/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MINIMAX_API_KEY}`
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7',
        messages: [
          { role: 'user', content: 'Say hello in 3 words' }
        ],
      }),
    });
    
    const data = await response.json();
    return NextResponse.json({ 
      ok: response.ok, 
      status: response.status,
      url: `https://api.minimax.io/v1/chat/completions?GroupId=${GROUP_ID}`,
      keyPrefix: MINIMAX_API_KEY?.substring(0, 15),
      data 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
