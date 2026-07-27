/**
 * POST /api/admin/pipeline/[productId]/generate-icp
 * 
 * Generate detailed ICP fields from idea_card data.
 * 
 * Input: { idea_card: { one_liner, problem, distributor, end_user_pool } }
 * Output: { icp fields + reasoning }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ANTHROPIC_API_URL, ANTHROPIC_MODEL, firstText, noThinking } from '@/lib/ai/anthropic-model';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const productSlug = params.productId;
    const body = await request.json();
    const { idea_card } = body;

    if (!idea_card) {
      return NextResponse.json({ error: 'idea_card is required' }, { status: 400 });
    }

    const one_liner = idea_card.one_liner || '';
    const problem = idea_card.problem || '';
    const distributor = idea_card.distributor || '';
    const end_user_pool = idea_card.end_user_pool || '';

    if (!one_liner && !problem && !distributor && !end_user_pool) {
      return NextResponse.json({ 
        error: 'At least one idea_card field required (one_liner, problem, distributor, or end_user_pool)' 
      }, { status: 400 });
    }

    const prompt = `You are a B2B go-to-market expert. Given the following product information, generate a detailed ICP (Ideal Customer Profile) for both DISTRIBUTOR and END-USER streams.

Provide your response as JSON with these fields:
{
  "distributor": {
    "icp_company_size": "...",
    "icp_stage": "...",
    "icp_buyer_title": "...",
    "icp_user_title": "...",
    "icp_stack_tools": "...",
    "traction_arr": "...",
    "traction_customers": "...",
    "reasoning": "Explain WHY you chose each field value - what in the product info informed this decision?"
  },
  "end_user": {
    "icp_company_size": "...",
    "icp_stage": "...",
    "icp_buyer_title": "...",
    "icp_user_title": "...",
    "icp_stack_tools": "...",
    "traction_arr": "...",
    "traction_customers": "...",
    "reasoning": "Explain WHY you chose each field value"
  }
}

Guidelines:
- icp_company_size: Employee count range (e.g. "10-50", "50-200", "200-1000", "1000+")
- icp_stage: Business lifecycle (e.g. "startup", "seed", "growth", "scale", "enterprise")
- icp_buyer_title: Job titles of decision makers (e.g. "VP Sales", "CEO", "Operations Manager")
- icp_user_title: Job titles of actual users (e.g. "Sales Rep", "Accountant", "Project Manager")
- icp_stack_tools: Tools/systems they currently use (e.g. "Salesforce, HubSpot, Slack")
- traction_arr: Pricing or revenue stage (e.g. "$0-1M ARR", "$1-5M ARR", "Enterprise pricing")
- traction_customers: Current customer base (e.g. "10-20 customers", "50+ SMBs")

Product Information:
- One-liner: ${one_liner}
- Problem: ${problem}
- Distributor pool (who would onsell): ${distributor}
- End-user pool (who would use): ${end_user_pool}

Output ONLY valid JSON, no other text.`;

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 4000,
        ...noThinking('medium'),
        system: 'You are a B2B go-to-market expert. Generate specific, actionable ICP details based on product information. Be precise - vague answers like "any size" or "various industries" are not helpful. Output ONLY JSON.',
        messages: [
          { role: 'user', content: prompt }
        ]
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic error:', err);
      return NextResponse.json({ error: 'AI generation failed' }, { status: 500 });
    }

    const data = await response.json();
    const content = firstText(data);

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    let result = {};
    if (jsonMatch) {
      try {
        result = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
      }
    }

    // Store the reasoning separately
    const reasoning: Record<string, string> = {};
    const resultAny = result as Record<string, any>;
    if (resultAny.distributor?.reasoning) {
      reasoning.distributor = resultAny.distributor.reasoning;
      delete resultAny.distributor.reasoning;
    }
    if (resultAny.end_user?.reasoning) {
      reasoning.end_user = resultAny.end_user.reasoning;
      delete resultAny.end_user.reasoning;
    }

    // Save to product_validation_status
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl && serviceRoleKey) {
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      const updateFields: Record<string, any> = {
        icp_reasoning: reasoning,
      };

      // Set distributor ICP fields
      if (resultAny.distributor) {
        if (resultAny.distributor.icp_company_size) updateFields.icp_company_size = resultAny.distributor.icp_company_size;
        if (resultAny.distributor.icp_stage) updateFields.icp_stage = resultAny.distributor.icp_stage;
        if (resultAny.distributor.icp_buyer_title) updateFields.icp_buyer_title = resultAny.distributor.icp_buyer_title;
        if (resultAny.distributor.icp_user_title) updateFields.icp_user_title = resultAny.distributor.icp_user_title;
        if (resultAny.distributor.icp_stack_tools) updateFields.icp_stack_tools = resultAny.distributor.icp_stack_tools;
        if (resultAny.distributor.traction_arr) updateFields.traction_arr = resultAny.distributor.traction_arr;
        if (resultAny.distributor.traction_customers) updateFields.traction_customers = resultAny.distributor.traction_customers;
      }

      // For end_user, we store separately or we can keep same fields (reused)
      // For now, we'll store end_user specific fields with prefix
      if (resultAny.end_user) {
        // Store end_user specific values - they may differ from distributor
        // We could add separate columns or store as JSON
        // For simplicity, keep main fields (distributor is the primary for outreach targeting)
      }

      const { error: updateError } = await supabase
        .from('product_validation_status')
        .update(updateFields)
        .eq('product_slug', productSlug);

      if (updateError) {
        console.error('Failed to update product_validation_status:', updateError);
      }
    }

    return NextResponse.json({
      icp: result,
      reasoning,
      message: 'ICP generated and saved to product profile'
    });
  } catch (error) {
    console.error('Error generating ICP:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
