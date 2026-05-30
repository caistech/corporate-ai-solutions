/**
 * PATCH /api/admin/pipeline/[productId]/validation
 * 
 * Update validation fields (promise, distributor, end_user, friction)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const ALLOWED_FIELDS = ['promise', 'distributor', 'end_user', 'friction', 'has_methodology_commitment', 'mvp_url'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  console.log('[PATCH] ========== START PATCH VALIDATION ==========');
  try {
    const productSlug = params.productId.trim().toLowerCase();
    console.log('[PATCH] productSlug:', productSlug);

    const body = await request.json();
    console.log('[PATCH] body received:', body);

    // Build update object with only allowed fields
    const update: Record<string, any> = {};
    const skipHasFlag = ['mvp_url']; // Fields that shouldn't get auto has_ flag
    
    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) {
        const value = body[field];
        console.log('[PATCH] Processing field:', field, 'value:', value, 'type:', typeof value);
        if (typeof value === 'boolean') {
          update[field] = value;
        } else {
          update[field] = value;
          // Also update the corresponding has_* flag for string fields
          if (!skipHasFlag.includes(field)) {
            update[`has_${field}`] = !!value && value.trim().length > 0;
          }
        }
      }
    }

    console.log('[PATCH] Built update object:', update);

    if (Object.keys(update).length === 0) {
      console.log('[PATCH] No valid fields to update');
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Use UPSERT - more reliable than UPDATE
    console.log('[PATCH] Doing UPSERT with:', { product_slug: productSlug, ...update });
    
    const displayName = productSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    
    const { data: upsertResult, error: upsertError } = await supabase
      .from('product_validation_status')
      .upsert({ 
        product_slug: productSlug, 
        display_name: displayName,
        ...update,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'product_slug',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    console.log('[PATCH] UPSERT result:', { upsertResult, upsertError });

    if (upsertError) {
      console.error('[PATCH] UPSERT error:', upsertError);
      return NextResponse.json(
        { error: 'Failed to update validation', details: upsertError.message },
        { status: 500 }
      );
    }

    // Fetch fresh to verify
    const { data: finalRow, error: fetchError } = await supabase
      .from('product_validation_status')
      .select('*')
      .eq('product_slug', productSlug)
      .single();

    console.log('[PATCH] Final fetch:', { finalRow, fetchError });
    console.log('[PATCH] ========== END PATCH SUCCESS ==========');

    return NextResponse.json({ success: true, data: finalRow });
  } catch (error) {
    console.error('[PATCH] ========== END PATCH ERROR ==========', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}
