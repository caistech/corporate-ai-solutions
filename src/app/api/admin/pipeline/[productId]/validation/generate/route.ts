/**
 * POST /api/admin/pipeline/[productId]/validation/generate
 *
 * Generate validation/spec fields with AI. When the product has a live URL
 * (mvpUrl), the route fetches that page and grounds the model on the ACTUAL
 * site content — so fields describe the real product, not a guess from the slug.
 *
 * Provider: OpenRouter (OpenAI-compatible) → routes to MiniMax via BYOK.
 * Reads OPENROUTER_API_KEY. Model via OPENROUTER_MODEL (default minimax/minimax-m2.5).
 *
 * Body:  { fields: string[], productDetails?: {...}, mvpUrl?: string }
 * Reply: a FLAT object of only the requested fields, e.g. { promise: "...", ... }
 */

import { NextRequest, NextResponse } from 'next/server';

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

// Fetch the live site and reduce it to readable text for grounding.
async function fetchSiteText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'CAIS-Pipeline/1.0 (+spec-generation)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.warn('[validation/generate] site fetch non-OK:', res.status, url);
      return '';
    }
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 6000);
  } catch (e) {
    console.warn('[validation/generate] site fetch failed:', url, e);
    return '';
  }
}

// Tolerant JSON extraction — MiniMax sometimes drops the leading brace or wraps
// the object in prose/code fences. Try increasingly forgiving strategies.
function extractJsonObject(raw: string): Record<string, unknown> | null {
  if (!raw) return null;
  let s = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();

  // 1. direct
  try { return JSON.parse(s); } catch { /* fall through */ }

  // 2. first balanced-looking {...}
  const m = s.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch { /* fall through */ } }

  // 3. repair a missing leading brace: output begins like  promise":"..."}  or  "promise":...
  if (/^"?\w+"\s*:/.test(s)) {
    let cand = s.startsWith('"') ? `{${s}` : `{"${s}`;
    if (!cand.trimEnd().endsWith('}')) cand += '}';
    try { return JSON.parse(cand); } catch { /* fall through */ }
  }

  return null;
}

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
    let mvpUrl = '';
    try {
      const body = await request.json();
      fields = Array.isArray(body.fields) ? body.fields : [];
      productDetails = body.productDetails || {};
      mvpUrl = typeof body.mvpUrl === 'string' ? body.mvpUrl : '';
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (fields.length === 0) fields = [...ALL_GENERATABLE];
    const requested = fields.filter((f) => f in FIELD_BRIEFS);
    if (requested.length === 0) {
      return NextResponse.json({ error: 'No generatable fields requested', received: fields }, { status: 400 });
    }

    const category =
      productSlug.includes('pipeline') ? 'Internal Tool' :
      productSlug.includes('hemp') ? 'Sustainable Housing' :
      (productSlug.includes('seafields') || productSlug.includes('wavecrest') || productSlug.includes('branscombe')) ? 'Property Development' :
      'SaaS Product';

    // Ground on the live site when a URL is available.
    const siteText = mvpUrl ? await fetchSiteText(mvpUrl) : '';

    const productContext = [
      `- Name: ${productDetails.name || productSlug}`,
      `- Problem: ${productDetails.problem || 'Not specified'}`,
      `- Solution: ${productDetails.solution || 'Not specified'}`,
      `- Target Audience: ${productDetails.targetAudience || 'Not specified'}`,
      `- One-liner: ${productDetails.oneLiner || 'Not specified'}`,
    ].join('\n');

    const fieldList = requested.map((f) => `- "${f}": ${FIELD_BRIEFS[f]}`).join('\n');

    const groundingBlock = siteText
      ? `PRIMARY SOURCE — the product's actual live website (${mvpUrl}). Base every field on what THIS says; do not invent features it doesn't show:
"""
${siteText}
"""
`
      : `NOTE: No live site content was available, so infer carefully from the limited context below. Do not fabricate specifics.`;

    const prompt = `You are a product validation expert. Generate spec fields for the product "${productSlug}" (category: ${category}).

${groundingBlock}

Supporting context:
${productContext}

Generate ONLY these fields, each a concise 1-2 sentences, specific to this product:
${fieldList}

Respond with ONLY a JSON object whose keys are exactly: ${requested.join(', ')}. No prose, no markdown, no code fences.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://corporate-ai-solutions.vercel.app',
        'X-Title': 'CAIS Pipeline',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'You are a product validation expert. Output ONLY a single valid JSON object. No markdown, no code fences, no commentary.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 2500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[validation/generate] OpenRouter error:', response.status, err);
      return NextResponse.json({ error: 'AI generation failed', detail: err }, { status: 502 });
    }

    const data = await response.json();
    const content: string = data?.choices?.[0]?.message?.content ?? '';

    const parsed = extractJsonObject(content);
    if (!parsed) {
      console.error('[validation/generate] No JSON object in model output:', content);
      return NextResponse.json({ error: 'Model returned unparseable output' }, { status: 502 });
    }

    const result: Record<string, string> = {};
    for (const f of requested) {
      if (parsed[f]) result[f] = String(parsed[f]).trim();
    }

    if (Object.keys(result).length === 0) {
      console.error('[validation/generate] Parsed JSON had none of the requested keys:', Object.keys(parsed));
      return NextResponse.json({ error: 'Model returned no usable fields' }, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[validation/generate] Internal error:', msg);
    return NextResponse.json({ error: 'Internal error', detail: msg }, { status: 500 });
  }
}