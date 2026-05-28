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

    // Direct Supabase queries as reference
    const supabase = createClient(dbUrl, dbKey);

    // Query 1: product_validation_status
    const { data: rawData, error: rawError } = await supabase
      .from('product_validation_status')
      .select('*');

    // Query 2: another table (organisations) to verify connection works
    const { data: orgData, error: orgError } = await supabase
      .from('organisations')
      .select('id')
      .limit(1);

    // Query 3: auth users to verify service_role key
    const { data: authData, error: authError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);

    // Query with filter
    const { data: filteredData, error: filteredError } = await supabase
      .from('product_validation_status')
      .select('product_slug')
      .eq('product_slug', 'pipeline');

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
        orgCount: orgData?.length || 0,
        orgError: orgError ? `${orgError.code}: ${orgError.message}` : null,
        authCount: authData?.length || 0,
        authError: authError ? `${authError.code}: ${authError.message}` : null,
        filteredCount: filteredData?.length || 0,
        filteredError: filteredError ? `${filteredError.code}: ${filteredError.message}` : null,
        envUrl: dbUrl,
        envKeyPresent: !!dbKey,
        envKeyLength: dbKey ? dbKey.length : 0,
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
