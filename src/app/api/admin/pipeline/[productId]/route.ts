/**
 * GET /api/admin/pipeline/[productId]
 * 
 * Fetch detailed validation status for a single product
 * - Manifest data
 * - Validation status from Supabase
 * - Calculated gaps and action items
 * - Recent events from audit trail
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = params.productId;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('product_validation_status')
      .select('*')
      .eq('product_slug', productId);

    return NextResponse.json({
      productId,
      data: data || [],
      error: error ? `${error.code}: ${error.message}` : null,
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error fetching product:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch product details',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : null,
      },
      { status: 500 }
    );
  }
}
