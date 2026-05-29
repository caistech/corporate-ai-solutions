import { NextResponse } from 'next/server';

export async function GET() {
  const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
  const GROUP_ID = process.env.MINIMAX_GROUP_ID || '516712014697644041';
  
  if (!MINIMAX_API_KEY) {
    return NextResponse.json({ error: 'No API key' });
  }
  
  try {
    const response = await fetch(`https://api.minimax.chat/v1/text/chatcompletion_v2?GroupId=${GROUP_ID}`, {
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
      url: `https://api.minimax.chat/v1/text/chatcompletion_v2?GroupId=${GROUP_ID}`,
      groupIdUsed: GROUP_ID,
      keyPrefix: MINIMAX_API_KEY?.substring(0, 15),
      data 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
