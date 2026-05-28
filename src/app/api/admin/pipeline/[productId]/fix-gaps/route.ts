/**
 * POST /api/admin/pipeline/[productId]/fix-gaps
 * 
 * Auto-fill missing validation fields using simple heuristics + Claude LLM
 * (Phase 2 MVP: heuristics only; Phase 5 will add Claude)
 * 
 * For testing: generates plausible placeholder values
 * In production: Claude will intelligently prefill based on product type
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = params.productId;

    // Fetch current product
    const { data: product, error: fetchError } = await supabase
      .from('product_validation_status')
      .select('*')
      .eq('product_slug', productId)
      .single();

    if (fetchError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Generate placeholder values for missing fields
    // (Phase 5: Will use Claude to intelligently generate these)
    const updates: any = {};
    const fixed_fields: string[] = [];

    if (!product.promise) {
      updates.promise = `AI-powered solution for validating ${productId} in production`;
      updates.has_promise = true;
      fixed_fields.push('promise');
    }

    if (!product.distributor) {
      updates.distributor = 'SaaS studio / accelerator partners';
      updates.has_distributor = true;
      fixed_fields.push('distributor');
    }

    if (!product.end_user) {
      updates.end_user = 'Founders and product teams building in this space';
      updates.has_end_user = true;
      fixed_fields.push('end_user');
    }

    if (!product.friction) {
      updates.friction = `${productId} solves [problem] without requiring [workaround]`;
      updates.has_friction = true;
      fixed_fields.push('friction');
    }

    if (fixed_fields.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No gaps to fix — all fields already populated',
        fixed_fields: [],
      });
    }

    // Apply updates
    const { error: updateError } = await supabase
      .from('product_validation_status')
      .update(updates)
      .eq('product_slug', productId);

    if (updateError) {
      throw updateError;
    }

    // Log event
    await supabase.from('validation_events').insert({
      product_slug: productId,
      event_type: 'gaps_autofixed',
      field_name: 'bulk_fields',
      new_value: fixed_fields.join(','),
      actor_type: 'admin',
      actor_id: null, // Would be auth.uid() in real flow
      reason: 'Auto-fix via CLI tool (Phase 2 test)',
    });

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixed_fields.length} field(s)`,
      fixed_fields,
      note: 'Values are placeholders (Phase 5 will use Claude for intelligent generation)',
    });
  } catch (error) {
    console.error('Error fixing gaps:', error);
    return NextResponse.json(
      {
        error: 'Failed to fix gaps',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
