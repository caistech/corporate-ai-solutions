'use client';

/**
 * Product Detail View Component
 * 
 * Shows comprehensive validation status + fix actions for a single product
 */

import React, { useEffect, useState } from 'react';
import GapsSection from './GapsSection';
import ValidationFieldsEditor from './ValidationFieldsEditor';
import QuickActionsPanel from './QuickActionsPanel';
import AuditTrailPanel from './AuditTrailPanel';

interface ProductDetailViewProps {
  productId: string;
}

export default function ProductDetailView({ productId }: ProductDetailViewProps) {
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(`/api/admin/pipeline/${productId}`);

        if (!res.ok) {
          throw new Error(`Failed to fetch product: ${res.statusText}`);
        }

        const data = await res.json();
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId, refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading product: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.manifest.name}</h1>
            <p className="text-gray-500 mt-1">{product.validation?.display_name || 'Not in pipeline'}</p>
          </div>

          {/* Status Badges */}
          <div className="flex gap-2">
            {product.can_run_outreach_now && (
              <span className="inline-block px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-700">
                ✅ Ready for Outreach
              </span>
            )}
            {product.validation?.is_paused && (
              <span className="inline-block px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                ⏸ Paused
              </span>
            )}
            {product.validation?.is_draft && (
              <span className="inline-block px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                📝 Draft
              </span>
            )}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="font-semibold text-blue-900 mb-2">Readiness: {product.readiness_score}%</h2>
          <p className="text-blue-800 text-sm mb-2">{product.validation?.promise || 'No promise defined yet'}</p>
          <p className="text-blue-700 text-sm">{product.action_items.length} action{product.action_items.length !== 1 ? 's' : ''} needed to reach outreach readiness</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="font-medium text-gray-900">Validation Progress</p>
          <p className="text-sm font-bold text-gray-600">{product.readiness_score}%</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              product.readiness_score >= 80
                ? 'bg-green-500'
                : product.readiness_score >= 50
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            }`}
            style={{ width: `${product.readiness_score}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {product.can_run_outreach_now
            ? 'Ready to run outreach! Start conversations with distributors.'
            : `Fill ${product.gaps.length} gap${product.gaps.length !== 1 ? 's' : ''} to enable outreach.`}
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Gaps + Actions */}
        <div className="lg:col-span-2 space-y-8">
          <GapsSection gaps={product.gaps} actionItems={product.action_items} />
          <ValidationFieldsEditor product={product} onRefresh={handleRefresh} />
        </div>

        {/* Right: Quick Actions */}
        <div>
          <QuickActionsPanel product={product} onRefresh={handleRefresh} />
          <div className="mt-8">
            <AuditTrailPanel productId={productId} />
          </div>
        </div>
      </div>
    </div>
  );
}
