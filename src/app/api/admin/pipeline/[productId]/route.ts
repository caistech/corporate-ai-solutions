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
import { getProductPipeline } from '@/lib/portfolio-scanner';

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = params.productId;

    const product = await getProductPipeline(productId);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
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

    return NextResponse.json({
      ...product,
      _debug: {
        portfolioCount: portfolio.length,
        rawCount: rawData?.length || 0,
        rawError: rawError ? `${rawError.code}: ${rawError.message}` : null,
        pipelineInRaw: (rawData || []).some((r: any) => r.product_slug === productId),
        schemaCount: schemaCheck?.length || 0,
        schemaError: schemaError ? `${schemaError.code}: ${schemaError.message}` : null,
        tableCount: tableCount ?? 0,
        countError: countError ? `${countError.code}: ${countError.message}` : null,
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
