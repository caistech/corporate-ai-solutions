'use client';

/**
 * /admin/pipeline/[productId] — Product Detail View
 * 
 * Shows:
 * - Product validation status (gates, scores, fields)
 * - List of gaps with fix actions
 * - Validation fields editor (promise, distributor, end-user, friction)
 * - Quick actions:
 *   - Generate missing fields (LLM prefill)
 *   - Add methodology commitment
 *   - Run outreach to distributors
 * - Audit trail (recent changes)
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ProductDetailView from '@/components/admin/ProductDetailView';

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.productId as string;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm">
          <Link href="/admin/pipeline" className="text-blue-600 hover:text-blue-700">
            Pipeline
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-700 font-medium">Processing</span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-700 font-medium">{productId}</span>
        </nav>

        {/* Detail View */}
        <ProductDetailView productId={productId} />
      </div>
    </div>
  );
}
