/**
 * GET /api/admin/pipeline/scan
 * 
 * Scan entire portfolio and return validation status for dashboard
 * - Reads portfolio-manifest.yaml
 * - Enriches with product_validation_status from Supabase
 * - Returns summary + detailed product list
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPortfolioSummary } from '@/lib/portfolio-scanner';

export async function GET(request: NextRequest) {
  try {
    // Verify auth is handled by middleware
    // This endpoint should only be callable by authenticated admins
    // (middleware validates /admin/* access)

    const data = await getPortfolioSummary();

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error scanning portfolio:', error);

    return NextResponse.json(
      {
        error: 'Failed to scan portfolio',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
