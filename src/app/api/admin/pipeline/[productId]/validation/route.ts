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
    
    console.log('[PATCH] ALLOWED_FIELDS:', ALLOWED_FIELDS);
    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) {
        const value = body[field];
        console.log('[PATCH] Processing field:', field, 'value:', value, 'type:', typeof value);
        // Handle boolean fields (like has_methodology_commitment) vs string fields
        if (typeof value === 'boolean') {
          update[field] = value;
          console.log('[PATCH] Boolean field set:', field, '=', value);
        } else {
          update[field] = value;
          // Also update the corresponding has_* flag for string fields (skip mvp_url)
          if (!skipHasFlag.includes(field)) {
            update[`has_${field}`] = !!value && value.trim().length > 0;
            console.log('[PATCH] Has flag set:', `has_${field}`, '=', update[`has_${field}`]);
          }
        }
      } else {
        console.log('[PATCH] Field not in body, skipping:', field);
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

    update.updated_at = new Date().toISOString();
    console.log('[PATCH] Final update object:', update);

    console.log('[PATCH] Checking if row exists...');
    // Check if row exists first
    const { data: existing, error: existingError } = await supabase
      .from('product_validation_status')
      .select('product_slug')
      .eq('product_slug', productSlug)
      .single();

    console.log('[PATCH] Row exists check:', { found: !!existing, error: existingError });

    let error: any = null;
    let data: any = null;

    if (existing) {
      console.log('[PATCH] Row exists - doing UPDATE');
      // Row exists - use update (preserves other columns)
      const result = await supabase
        .from('product_validation_status')
        .update(update)
        .eq('product_slug', productSlug)
        .select();
      console.log('[PATCH] Update response:', { error: result.error, data: result.data });
      error = result.error;
      data = result.data;
    } else {
      console.log('[PATCH] Row does NOT exist - doing INSERT');
      // Row doesn't exist - use insert
      const displayName = productSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      console.log('[PATCH] Insert payload:', { product_slug: productSlug, display_name: displayName, ...update });
      const result = await supabase
        .from('product_validation_status')
        .insert({ product_slug: productSlug, display_name: displayName, ...update });
      console.log('[PATCH] Insert response:', { error: result.error, data: result.data });
      error = result.error;
      data = result.data;
    }

    console.log('[PATCH] DB operation result:', { hasError: !!error, error });

    if (error) {
      console.error('[PATCH] Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update validation', details: error.message },
        { status: 500 }
      );
    }

    // Return the updated row so client doesn't need to refetch
    console.log('[PATCH] Fetching updated row...');
    try {
      const { data: updatedRow, error: fetchError } = await supabase
        .from('product_validation_status')
        .select('*')
        .eq('product_slug', productSlug)
        .single();
      
      console.log('[PATCH] Fetched row:', { found: !!updatedRow, error: fetchError });
      if (updatedRow) {
        console.log('[PATCH] Row details:', { 
          commitment: updatedRow.has_methodology_commitment, 
          mvp_url: updatedRow.mvp_url,
          has_promise: updatedRow.has_promise,
          has_distributor: updatedRow.has_distributor
        });
      }
      console.log('[PATCH] ========== END PATCH SUCCESS ==========');
      return NextResponse.json({ success: true, data: updatedRow });
    } catch (e) {
      console.log('[PATCH] Failed to fetch updated row:', e);
      console.log('[PATCH] ========== END PATCH SUCCESS (no row) ==========');
      return NextResponse.json({ success: true, data: null });
    }
  } catch (error) {
    console.error('[PATCH] ========== END PATCH ERROR ==========', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}
