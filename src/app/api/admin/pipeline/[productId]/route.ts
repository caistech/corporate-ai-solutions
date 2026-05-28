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
import { scanPortfolio } from '@/lib/portfolio-scanner';
import { createClient } from '@supabase/supabase-js';

const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const dbKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = params.productId;

    // Direct Supabase query as reference
    const supabase = createClient(dbUrl, dbKey);
    const { data: rawData, error: rawError } = await supabase
      .from('product_validation_status')
      .select('*');

    // Using scanPortfolio
    const portfolio = await scanPortfolio();
    const product = portfolio.find((p) => p.manifest.name === productId) || null;

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...product,
      _debug: {
        portfolioCount: portfolio.length,
        rawCount: rawData?.length || 0,
        rawError: rawError ? `${rawError.code}: ${rawError.message}` : null,
        pipelineInRaw: (rawData || []).some((r: any) => r.product_slug === productId),
      },
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
      },
      { status: 500 }
    );
  }
}
