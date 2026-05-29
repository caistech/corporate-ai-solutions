import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
  const GROUP_ID = '516712014697644041';
  
  const productDetails = {
    name: 'Singify',
    problem: 'Music fans struggle to discover new songs that match their current mood and context',
    solution: 'AI-powered playlist generator',
    targetAudience: 'Music enthusiasts aged 18-45',
    oneLiner: 'AI playlist generator for any mood or activity'
  };
  
  const fields = ['promise'];
  
  const prompt = `Generate validation fields for a product called "${productDetails.name}".

Product Details:
- Problem: ${productDetails.problem}
- Solution: ${productDetails.solution}
- Target Audience: ${productDetails.targetAudience}
- One-liner: ${productDetails.oneLiner}

For each field, provide a 1-2 sentence response:

1. Promise: What does this product deliver?
2. Distributor: Who sells/delivers this to end users?
3. End User: Who uses this product?  
4. Friction: What problem/pain point does this solve?

Format as JSON:
{
  "promise": "...",
  "distributor": "...",
  "end_user": "...",
  "friction": "..."
}

Only include the fields requested: ${fields.join(', ')}`;

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
          { role: 'system', content: 'You are a product validation expert. Output ONLY valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    return NextResponse.json({ 
      ok: response.ok, 
      minimaxResponse: data 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
