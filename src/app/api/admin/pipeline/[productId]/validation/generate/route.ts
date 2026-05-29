/**
 * POST /api/admin/pipeline/[productId]/validation/generate
 * 
 * Generate validation fields using AI based on product info
 */

import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const productSlug = params.productId;
    const body = await request.json();
    const { fields } = body; // ['promise', 'distributor', 'end_user', 'friction']

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json({ error: 'No fields specified' }, { status: 400 });
    }

    // Get product context from the slug
    const category = productSlug.includes('pipeline') ? 'Internal Tool' :
                     productSlug.includes('hemp') ? 'Sustainable Housing' :
                     productSlug.includes('seafields') || productSlug.includes('wavecrest') || productSlug.includes('branscombe') ? 'Property Development' :
                     'SaaS Product';

    const prompt = `Generate validation fields for a product called "${productSlug}" (category: ${category}).

For each field, provide a 1-2 sentence response that would work for a product validation framework:

1. Promise: What does this product deliver? (1-2 sentences, be specific to the product name)
2. Distributor: Who sells/delivers this to end users? (1-2 sentences)
3. End User: Who uses this product? (1-2 sentences)  
4. Friction: What problem/pain point does this solve? (1-2 sentences)

Format as JSON:
{
  "promise": "...",
  "distributor": "...",
  "end_user": "...",
  "friction": "..."
}

Only include the fields requested: ${fields.join(', ')}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a product validation expert. Generate concise, specific validation field content based on product names.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenAI error:', err);
      return NextResponse.json({ error: 'AI generation failed' }, { status: 500 });
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
    console.error('Error generating validation:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
