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
  console.log('[GET] ========== START GET PRODUCT ==========');
  try {
    const productId = params.productId;
    console.log('[GET] productId:', productId);

    console.log('[GET] Calling getProductPipeline...');
    const product = await getProductPipeline(productId);
    console.log('[GET] getProductPipeline result:', { found: !!product, name: product?.manifest?.name });

    if (!product) {
      console.log('[GET] Product not found');
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Direct exact-match query for fresh validation data
    console.log('[GET] Creating Supabase client...');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    console.log('[GET] Querying product_validation_status for product_slug:', productId);
    const { data: freshValidation, error: freshError } = await supabase
      .from('product_validation_status')
      .select('*')
      .eq('product_slug', productId)
      .single();

    console.log('[GET] DB query result:', { 
      found: !!freshValidation, 
      error: freshError,
      commitment: freshValidation?.has_methodology_commitment, 
      mvp_url: freshValidation?.mvp_url,
      promise: freshValidation?.promise,
      distributor: freshValidation?.distributor
    });

    if (freshValidation) {
      console.log('[GET] Setting product.validation = freshValidation');
      product.validation = freshValidation;
    } else {
      console.log('[GET] No fresh validation found, using cached');
    }

    console.log('[GET] Returning product with validation:', { 
      has_validation: !!product.validation,
      commitment: product.validation?.has_methodology_commitment,
      mvp_url: product.validation?.mvp_url
    });
    console.log('[GET] ========== END GET SUCCESS ==========');
    
    return NextResponse.json(product, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('[GET] ========== END GET ERROR ==========', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch product details',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
