/**
 * GET /api/admin/pipeline/[productId]
 *
 * Fetch detailed validation status for a single product
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProductPipeline } from '@/lib/portfolio-scanner';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = params.productId;

    const product = await getProductPipeline(productId);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Direct exact-match query for fresh validation data
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    console.log('[GET] Querying for product_slug:', productId);
    const { data: freshValidation, error: freshError } = await supabase
      .from('product_validation_status')
      .select('*')
      .eq('product_slug', productId)
      .single();

    console.log('[GET] Direct query result:', { found: !!freshValidation, error: freshError, commitment: freshValidation?.has_methodology_commitment });

    if (freshValidation) {
      product.validation = freshValidation;
    } else {
      console.log('[GET] No fresh validation found, using cached');
    }

    return NextResponse.json(product, {
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
      },
      { status: 500 }
    );
  }
}
