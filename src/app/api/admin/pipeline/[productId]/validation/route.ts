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

const ALLOWED_FIELDS = ['promise', 'distributor', 'end_user', 'friction'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const productSlug = params.productId.trim().toLowerCase();
    const body = await request.json();

    // Build update object with only allowed fields
    const update: Record<string, any> = {};
    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) {
        update[field] = body[field];
        // Also update the corresponding has_* flag
        update[`has_${field}`] = !!body[field] && body[field].trim().length > 0;
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    update.updated_at = new Date().toISOString();

    console.log('PATCH validation:', { productSlug, update });

    // Try direct update with trimmed/lowercased slug
    const { error, count } = await supabase
      .from('product_validation_status')
      .update(update)
      .eq('product_slug', productSlug)
      .select();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update validation', details: error.message },
        { status: 500 }
      );
    }

    console.log('Update success, rows affected:', count);
    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error('Error in validation PATCH:', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}
