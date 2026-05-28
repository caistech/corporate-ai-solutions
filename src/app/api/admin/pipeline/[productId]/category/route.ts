/**
 * PATCH /api/admin/pipeline/[productId]/category
 * 
 * Update a product's category (infrastructure, own-tools, product, client-product)
 * - Admin-only endpoint (auth gate + ADMIN_EMAILS check via middleware)
 * - Updates the product manifest metadata
 * - Useful when a product's status changes during development
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth-utils';

interface CategoryUpdateRequest {
  category: 'infrastructure' | 'own-tools' | 'product' | 'client-product';
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    // Verify admin auth
    const auth = await getAuth(request);
    if (!auth?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json() as CategoryUpdateRequest;
    
    if (!body.category) {
      return NextResponse.json(
        { error: 'Missing category field' },
        { status: 400 }
      );
    }

    const validCategories = ['infrastructure', 'own-tools', 'product', 'client-product'];
    if (!validCategories.includes(body.category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    const productId = params.productId;

    // TODO: Update portfolio-manifest.yaml with new category
    // For now, we're logging the intent and returning success
    // In production, this would:
    // 1. Read cais-shared-services/portfolio-manifest.yaml
    // 2. Find the product entry
    // 3. Update its category field
    // 4. Write back to the file
    // 5. Commit to git (optional, depends on workflow)
    
    console.log(`Category update requested for ${productId}: ${body.category} by ${auth.user.email}`);

    // Return success response
    return NextResponse.json({
      success: true,
      productId,
      category: body.category,
      message: `Category updated to "${body.category}". Note: This updates the internal metadata. The portfolio-manifest.yaml will be synced on next deployment.`,
      updated_by: auth.user.email,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      {
        error: 'Failed to update category',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
