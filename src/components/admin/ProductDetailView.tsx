'use client';

/**
 * Product Detail View Component
 * 
 * Shows comprehensive validation status + fix actions for a single product
 * Structured as a logical flow: Steps 1-4 → Validation Tests → Submit for Outreach
 */

import React, { useEffect, useState } from 'react';
import GapsSection from './GapsSection';
import ValidationFieldsEditor from './ValidationFieldsEditor';
import QuickActionsPanel from './QuickActionsPanel';
import AuditTrailPanel from './AuditTrailPanel';
import CategoryEditor from './CategoryEditor';
import ValidationTestResults from './ValidationTestResults';
import { CheckCircle, Send, Loader2 } from 'lucide-react';

interface ProductDetailViewProps {
  productId: string;
}

export default function ProductDetailView({ productId }: ProductDetailViewProps) {
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(`/api/admin/pipeline/${productId}?_t=${Date.now()}`);

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

  const handleSubmitForOutreach = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/pipeline/${productId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_outreach' }),
      });
      if (res.ok) {
        alert('Product submitted for outreach! InvestorPilot will be notified.');
        handleRefresh();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit for outreach');
    } finally {
      setSubmitting(false);
    }
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

  const validationFieldsComplete = 
    product.validation?.promise && 
    product.validation?.distributor && 
    product.validation?.end_user && 
    product.validation?.friction;

  const isReadyForOutreach = product.can_run_outreach_now;

  return (
    <div className="space-y-6">
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
            ? 'Ready to run outreach! Submit below to notify InvestorPilot.'
            : `Fill ${product.gaps.length} gap${product.gaps.length !== 1 ? 's' : ''} to enable outreach.`}
        </p>
      </div>

      {/* STEP 1-4: Validation Fields - The core validation data */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">STEPS 1-4</span>
          <h2 className="text-lg font-semibold text-gray-900">Validation Fields</h2>
          {validationFieldsComplete && <CheckCircle className="text-green-600" size={18} />}
        </div>
        <p className="text-sm text-gray-600 mb-4">
          These 4 fields define what your product is and who it is for.
          <br /><strong>This item is for:</strong> Defining the product promise, distributor model, end user, and pain point.
          <br /><strong>When done:</strong> Move to Step 6 (Compliance) ↓
        </p>
        <ValidationFieldsEditor product={product} onRefresh={handleRefresh} />
      </div>

      {/* STEP 5: Founder Commitment */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded">STEP 5</span>
          <h2 className="text-lg font-semibold text-gray-900">Founder Commitment</h2>
          {product.validation?.has_methodology_commitment && <CheckCircle className="text-green-600" size={18} />}
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Tick to confirm you are committed to running the 4-week validation pipeline.
          <br /><strong>This item is for:</strong> Confirming you will actually validate this product.
          <br /><strong>When done:</strong> Move to Step 6 (Compliance) ↓
        </p>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={product.validation?.has_methodology_commitment || false}
            onChange={async (e) => {
              await fetch(`/api/admin/pipeline/${productId}/validation`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ has_methodology_commitment: e.target.checked }),
              });
              handleRefresh();
            }}
            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
          />
          <span className="text-gray-700">
            I commit to running the 4-week validation pipeline for this product
          </span>
        </label>
      </div>

      {/* STEP 6: Hard Gates / Compliance */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">STEP 6</span>
          <h2 className="text-lg font-semibold text-gray-900">Compliance & Hard Gates</h2>
          {product.validation?.hard_gates_passed > 0 && <CheckCircle className="text-green-600" size={18} />}
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Run compliance checks to ensure the product meets technical and legal requirements.
          <br /><strong>This item is for:</strong> Verifying auth, branding, metadata, and other hard requirements.
          <br /><strong>When done:</strong> Move to Step 7 (Validation Tests) ↓
        </p>
        <QuickActionsPanel product={product} onRefresh={handleRefresh} />
      </div>

      {/* STEP 7: Validation Tests */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-yellow-600 text-white text-xs font-bold px-2 py-1 rounded">STEP 7</span>
          <h2 className="text-lg font-semibold text-gray-900">Validation Tests</h2>
          {product.validation?.validation_test_status === 'passed' && <CheckCircle className="text-green-600" size={18} />}
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Run automated tests to verify the product works.
          <br /><strong>This item is for:</strong> Testing admin portal, user portal, auth flows, and scaffold.
          <br /><strong>When done:</strong> Move to Step 8 (Final Score) ↓
        </p>
        <ValidationTestResults
          validation={product.validation}
          productName={product.manifest?.name || productId}
        />
      </div>

      {/* STEP 8: Gaps Summary + Submit */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded">STEP 8</span>
          <h2 className="text-lg font-semibold text-gray-900">Final Score Check</h2>
          {product.readiness_score >= 80 && <CheckCircle className="text-green-600" size={18} />}
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Your validation score must be ≥80% to run outreach.
          <br /><strong>This item is for:</strong> Reviewing remaining gaps and confirming readiness.
          <br /><strong>When score ≥80%:</strong> Submit for automated outreach to InvestorPilot ↓
        </p>
        <GapsSection gaps={product.gaps} actionItems={product.action_items} productSlug={product.manifest?.name} />
        
        {/* Submit for Outreach Button */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={handleSubmitForOutreach}
            disabled={!isReadyForOutreach || submitting}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all ${
              isReadyForOutreach
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Submitting...
              </>
            ) : (
              <>
                <Send size={20} />
                {isReadyForOutreach 
                  ? 'Submit for Automated Outreach →' 
                  : `Submit for Outreach (${product.readiness_score}%/80%)`}
              </>
            )}
          </button>
          {isReadyForOutreach && (
            <p className="text-center text-sm text-green-600 mt-2">
              ✅ Product will be sent to InvestorPilot for distributor outreach
            </p>
          )}
        </div>
      </div>

      {/* Right Column - Category + Audit (less critical) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2" />
        <div>
          <div id="category">
            <CategoryEditor 
              productId={productId} 
              currentCategory={product.manifest.category} 
              onRefresh={handleRefresh} 
            />
          </div>
          <div className="mt-6" id="audit">
            <AuditTrailPanel productId={productId} />
          </div>
        </div>
      </div>
    </div>
  );
}
