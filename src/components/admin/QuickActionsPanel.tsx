'use client';
import React, { useState } from 'react';

interface QuickActionsPanelProps {
  product: any;
  onRefresh: () => void;
}

export default function QuickActionsPanel({ product, onRefresh }: QuickActionsPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const productId = product.manifest?.name || product.product_slug;
  const gaps = product.gaps || [];
  const readinessScore = product.readiness_score || 0;
  const canRunOutreach = product.can_run_outreach_now || false;

  // Determine primary action based on readiness
  let primaryAction = null;
  let primaryActionLabel = '';
  let primaryActionColor = 'bg-blue-50 text-blue-600 hover:bg-blue-100';
  let primaryActionDisabled = false;

  if (gaps.length > 0) {
    primaryAction = 'fill-gaps';
    primaryActionLabel = `📋 Fill ${gaps.length} Gap${gaps.length !== 1 ? 's' : ''}`;
    primaryActionColor = 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100';
  } else if (readinessScore < 90) {
    primaryAction = 'rerun-validation';
    primaryActionLabel = '🔄 Rerun Validation Tests';
    primaryActionColor = 'bg-purple-50 text-purple-600 hover:bg-purple-100';
  } else if (canRunOutreach) {
    primaryAction = 'execute-workflow';
    primaryActionLabel = '🚀 Execute Validation Workflow';
    primaryActionColor = 'bg-green-50 text-green-600 hover:bg-green-100';
    primaryActionDisabled = false;
  }

  const handlePrimaryAction = async () => {
    if (!primaryAction) return;

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      switch (primaryAction) {
        case 'fill-gaps':
          // Navigate to validation fields editor (already visible on page)
          window.location.hash = 'validation-fields';
          setSuccess('Scroll down to fill validation fields');
          break;

        case 'rerun-validation':
          // Open validation test plan
          window.open('/VALIDATION_TEST_PLAN_BOTH_PORTALS.md', '_blank');
          setSuccess('Validation test plan opened. Complete Parts A-D and submit results.');
          break;

        case 'execute-workflow':
          // Call execute-workflow API
          const res = await fetch(`/api/admin/pipeline/${productId}/validation-workflow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });

          if (!res.ok) {
            throw new Error(`Failed to execute workflow: ${res.statusText}`);
          }

          const data = await res.json();
          setSuccess(data.message || 'Validation workflow executing. InvestorPilot pipeline is now active.');
          onRefresh();
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Next Steps</h3>
      
      <div className="space-y-3">
        {/* Primary Action Button */}
        {primaryAction && (
          <>
            <button
              onClick={handlePrimaryAction}
              disabled={primaryActionDisabled || isLoading}
              className={`w-full px-4 py-3 rounded-lg font-medium text-sm transition-colors ${primaryActionColor} ${
                (primaryActionDisabled || isLoading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {isLoading ? 'Processing...' : primaryActionLabel}
            </button>
          </>
        )}

        {/* Status Info */}
        <div className="bg-gray-50 rounded p-3 text-xs space-y-2">
          {gaps.length > 0 && (
            <div>
              <p className="text-gray-600 font-medium">Gaps to Fill:</p>
              <ul className="text-gray-500 space-y-1 mt-1">
                {gaps.slice(0, 3).map((gap, i) => (
                  <li key={i}>• {gap}</li>
                ))}
                {gaps.length > 3 && <li className="text-gray-400">+ {gaps.length - 3} more</li>}
              </ul>
            </div>
          )}
          
          {gaps.length === 0 && readinessScore < 90 && (
            <div>
              <p className="text-gray-600 font-medium">Readiness Score: {readinessScore}%</p>
              <p className="text-gray-500">Run validation tests to verify compliance before outreach.</p>
            </div>
          )}

          {canRunOutreach && (
            <div>
              <p className="text-green-700 font-medium">✅ Ready for External Validation</p>
              <p className="text-gray-600">Execute the validation workflow to begin InvestorPilot outreach.</p>
            </div>
          )}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded p-2 text-xs text-green-700">
            {success}
          </div>
        )}
      </div>
    </div>
  );
}
