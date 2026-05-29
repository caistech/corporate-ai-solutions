import { NextResponse } from 'next/server';

export async function GET() {
  const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
  
  if (!MINIMAX_API_KEY) {
    return NextResponse.json({ error: 'No API key' });
  }
  
  try {
    const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MINIMAX_API_KEY}`
      },
      body: JSON.stringify({
        model: 'abab6.5s-chat',
        messages: [
          { role: 'user', content: 'Say hello in 3 words' }
        ],
      }),
    });
    
    const data = await response.json();
    return NextResponse.json({ 
      ok: response.ok, 
      status: response.status,
      data 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
