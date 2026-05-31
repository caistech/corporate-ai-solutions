/**
 * POST /api/admin/pipeline/[productId]/validation/generate
 *
 * Generate validation/spec fields with AI from the product's known context.
 *
 * Provider: OpenRouter (OpenAI-compatible) → routes to MiniMax per the account's
 * configured preference. Reads OPENROUTER_API_KEY. Model is env-configurable via
 * OPENROUTER_MODEL (default: minimax/minimax-m2.5) so it can change without a code edit.
 *
 * Body:  { fields: string[], productDetails?: { name, problem, solution, targetAudience, oneLiner } }
 * Reply: a FLAT object of only the requested fields, e.g. { promise: "...", friction: "..." }
 *        (the client reads data[field], so the shape must stay flat).
 */

import { NextRequest, NextResponse } from 'next/server';

// The generatable spec fields and what each one means. Keys MUST match
// ValidationFieldsEditor's `generatable` field keys exactly.
const FIELD_BRIEFS: Record<string, string> = {
  promise: 'Product Promise — a 1-2 sentence promise of what this product delivers.',
  friction: 'Friction/Pain Point — the specific problem or pain this solves.',
  core_mechanism: 'Core Mechanism — how the product/AI actually works (e.g. voice analysis, predictive models, NLP).',
  icp_geography: 'Target Geography — where to target (e.g. Australia, US, UK, Global, APAC).',
  distributor: 'Distributor ICP — who sells or delivers this to end users (the channel).',
  distributor_outcomes: 'Distributor Outcomes — the value distributors and their clients get from it.',
  end_user: 'End User ICP — who actually uses the product.',
  end_user_outcomes: 'End User Outcomes — the concrete results end users get (think ~90 days in).',
};

const ALL_GENERATABLE = Object.keys(FIELD_BRIEFS);

const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'minimax/minimax-m2.5';

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      console.error('[validation/generate] OPENROUTER_API_KEY is not set');
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const productSlug = params.productId;

    let fields: string[] = [];
    let productDetails: Record<string, string> = {};
    try {
      const body = await request.json();
      fields = Array.isArray(body.fields) ? body.fields : [];
      productDetails = body.productDetails || {};
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Default to every generatable field if none specified.
    if (fields.length === 0) fields = [...ALL_GENERATABLE];

    // Only keep fields we know how to generate (ignore operator-entered ICP fields).
    const requested = fields.filter((f) => f in FIELD_BRIEFS);
    if (requested.length === 0) {
      return NextResponse.json({ error: 'No generatable fields requested', received: fields }, { status: 400 });
    }

    const category =
      productSlug.includes('pipeline') ? 'Internal Tool' :
      productSlug.includes('hemp') ? 'Sustainable Housing' :
      (productSlug.includes('seafields') || productSlug.includes('wavecrest') || productSlug.includes('branscombe')) ? 'Property Development' :
      'SaaS Product';

    const productContext = [
      `- Name: ${productDetails.name || productSlug}`,
      `- Problem: ${productDetails.problem || 'Not specified'}`,
      `- Solution: ${productDetails.solution || 'Not specified'}`,
      `- Target Audience: ${productDetails.targetAudience || 'Not specified'}`,
      `- One-liner: ${productDetails.oneLiner || 'Not specified'}`,
    ].join('\n');

    const fieldList = requested.map((f) => `- "${f}": ${FIELD_BRIEFS[f]}`).join('\n');

    const prompt = `You are a product validation expert. Generate spec fields for the product "${productSlug}" (category: ${category}).

Product context:
${productContext}

Generate ONLY these fields, each a concise 1-2 sentences, specific to this product (no filler):
${fieldList}

Respond with ONLY a JSON object whose keys are exactly: ${requested.join(', ')}. No prose, no markdown, no code fences.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        // Optional attribution headers OpenRouter recommends (harmless if unused).
        'HTTP-Referer': 'https://corporate-ai-solutions.vercel.app',
        'X-Title': 'CAIS Pipeline',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'You are a product validation expert. Output ONLY valid JSON, no markdown.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[validation/generate] OpenRouter error:', response.status, err);
      return NextResponse.json({ error: 'AI generation failed', detail: err }, { status: 502 });
    }

    const data = await response.json();
    const content: string = data?.choices?.[0]?.message?.content ?? '';

    // Pull the JSON object out of the model's text (tolerate stray prose/fences).
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error('[validation/generate] No JSON object in model output:', content);
      return NextResponse.json({ error: 'Model returned no JSON' }, { status: 502 });
    }
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(match[0]);
    } catch (e) {
      console.error('[validation/generate] Failed to parse model JSON:', e, content);
      return NextResponse.json({ error: 'Model returned unparseable output' }, { status: 502 });
    }

    // Return a flat object of only the requested fields (client reads data[field]).
    const result: Record<string, string> = {};
    for (const f of requested) {
      if (parsed[f]) result[f] = String(parsed[f]).trim();
    }

    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[validation/generate] Internal error:', msg);
    return NextResponse.json({ error: 'Internal error', detail: msg }, { status: 500 });
  }
}