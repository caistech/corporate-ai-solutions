/**
 * PATCH /api/admin/pipeline/[productId]/validation
 * Update validation fields
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  global: { headers: { 'Cache-Control': 'no-cache' } }
});

const ALLOWED_FIELDS = ['promise', 'distributor', 'end_user', 'friction', 'customer_outcomes', 'core_mechanism', 'icp_geography', 'has_methodology_commitment', 'mvp_url'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  console.log('[PATCH] ========== START ==========');
  try {
    const productSlug = params.productId.trim().toLowerCase();
    const body = await request.json();
    console.log('[PATCH] productSlug:', productSlug, 'body:', JSON.stringify(body));

    const update: Record<string, any> = {};
    const skipHasFlag = ['mvp_url'];
    
    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) {
        const value = body[field];
        if (typeof value === 'boolean') {
          update[field] = value;
          console.log('[PATCH] Boolean field:', field, '=', value);
        } else {
          update[field] = value;
          if (!skipHasFlag.includes(field)) {
            update[`has_${field}`] = !!value && value.trim().length > 0;
          }
        }
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields' }, { status: 400 });
    }

    console.log('[PATCH] Update payload:', JSON.stringify(update));

    // Direct update using eq
    const { data: updated, error: updateError } = await supabase
      .from('product_validation_status')
      .update(update)
      .eq('product_slug', productSlug);

    console.log('[PATCH] Update result - updated:', updated, 'error:', updateError);
    
    if (updateError) {
      console.error('[PATCH] Update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Wait for DB to commit
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Now SELECT to get the updated row
    const { data: fresh, error: fetchError } = await supabase
      .from('product_validation_status')
      .select('*')
      .eq('product_slug', productSlug)
      .single();

    console.log('[PATCH] Fresh data:', JSON.stringify(fresh));
    console.log('[PATCH] commitment is:', fresh?.has_methodology_commitment);
    console.log('[PATCH] ========== END ==========');

    return NextResponse.json({ success: true, data: fresh });
  } catch (error) {
    console.error('[PATCH] EXCEPTION:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
