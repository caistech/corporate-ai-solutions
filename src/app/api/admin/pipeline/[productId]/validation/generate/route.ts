/**
 * POST /api/admin/pipeline/[productId]/validation/generate
 * 
 * Generate validation fields using AI based on product info
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
    if (!MINIMAX_API_KEY) {
      console.error('MINIMAX_API_KEY is not set');
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }
    
    const productSlug = params.productId;
    const body = await request.json();
    const { fields } = body;

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json({ error: 'No fields specified' }, { status: 400 });
    }

    const category = productSlug.includes('pipeline') ? 'Internal Tool' :
                     productSlug.includes('hemp') ? 'Sustainable Housing' :
                     productSlug.includes('seafields') || productSlug.includes('wavecrest') || productSlug.includes('branscombe') ? 'Property Development' :
                     'SaaS Product';

    const prompt = `Generate validation fields for a product called "${productSlug}" (category: ${category}).

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

    const GROUP_ID = process.env.MINIMAX_GROUP_ID || '516712014697644041';
    
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

    if (!response.ok) {
      const err = await response.text();
      console.error('Minimax error:', err);
      return NextResponse.json({ error: 'AI generation failed', minimaxError: err }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    let result = {};
    if (jsonMatch) {
      try {
        result = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('Failed to parse JSON:', e);
      }
    }

    // Filter to only requested fields
    const filtered: Record<string, string> = {};
    const resultAny = result as Record<string, unknown>;
    for (const field of fields) {
      if (resultAny[field]) {
        filtered[field] = String(resultAny[field]);
      }
    }

    return NextResponse.json(filtered);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error generating validation:', msg);
    return NextResponse.json({ error: 'Internal error', detail: msg }, { status: 500 });
  }
}
