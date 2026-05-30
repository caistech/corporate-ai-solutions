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
  try {
    const productSlug = params.productId.trim().toLowerCase();
    const body = await request.json();

    // Build update object with only allowed fields
    const update: Record<string, any> = {};
    const skipHasFlag = ['mvp_url']; // Fields that shouldn't get auto has_ flag
    
    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) {
        const value = body[field];
        // Handle boolean fields (like has_methodology_commitment) vs string fields
        if (typeof value === 'boolean') {
          update[field] = value;
        } else {
          update[field] = value;
          // Also update the corresponding has_* flag for string fields (skip mvp_url)
          if (!skipHasFlag.includes(field)) {
            update[`has_${field}`] = !!value && value.trim().length > 0;
          }
        }
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    update.updated_at = new Date().toISOString();

    console.log('[PATCH] validation:', { productSlug, update });

    // Check if row exists first
    const { data: existing } = await supabase
      .from('product_validation_status')
      .select('product_slug')
      .eq('product_slug', productSlug)
      .single();

    let error: any = null;
    let data: any = null;

    if (existing) {
      // Row exists - use update (preserves other columns)
      const result = await supabase
        .from('product_validation_status')
        .update(update)
        .eq('product_slug', productSlug)
        .select();
      error = result.error;
      data = result.data;
    } else {
      // Row doesn't exist - use insert
      const displayName = productSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const result = await supabase
        .from('product_validation_status')
        .insert({ product_slug: productSlug, display_name: displayName, ...update });
      error = result.error;
      data = result.data;
    }

    console.log('[PATCH] Update result:', { error });

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update validation', details: error.message },
        { status: 500 }
      );
    }

    // Return the updated row so client doesn't need to refetch
    try {
      const { data: updatedRow } = await supabase
        .from('product_validation_status')
        .select('*')
        .eq('product_slug', productSlug)
        .single();
      
      console.log('[PATCH] Returning updated row:', { commitment: updatedRow?.has_methodology_commitment, mvp_url: updatedRow?.mvp_url });
      return NextResponse.json({ success: true, data: updatedRow });
    } catch (e) {
      console.log('[PATCH] Returning update success without row');
      return NextResponse.json({ success: true, data: null });
    }
  } catch (error) {
    console.error('Error in validation PATCH:', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}
