'use client';

/**
 * Portfolio Pipeline Table
 * 
 * Sortable table showing all products with:
 * - Product name + status badge (green/yellow/gray)
 * - Readiness score (0-100)
 * - Gaps count (how many fields missing)
 * - Action items (next steps)
 * - Quick actions: View Details, Run Outreach
 */

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface EnrichedProduct {
  manifest: {
    name: string;
    vercel_project_id: string;
    category?: 'infrastructure' | 'own-tools' | 'product' | 'client-product';
  };
  validation: any;
  gaps: string[];
  readiness_score: number;
  can_run_outreach_now: boolean;
  action_items: string[];
  // NEW: 7-Stage House-Building Lifecycle
  current_stage: number;
  stage_name: string;
  certificate_of_occupancy: {
    status: 'valid' | 'expired' | 'missing' | 'pending_review' | 'issues_reported';
    valid_until?: string;
    readiness_score?: number;
  };
  smart_sensors: {
    health: 'ok' | 'warning' | 'down';
    security: 'ok' | 'warning';
    cost: 'ok' | 'warning' | 'over_budget';
  };
}

interface PipelineTableProps {
  products: EnrichedProduct[];
  filterStatus: 'all' | 'ready' | 'in-progress' | 'draft' | 'paused';
  filterCategory: 'all' | 'infrastructure' | 'own-tools' | 'product' | 'client-product';
  sortBy: 'readiness' | 'name' | 'updated';
  sortOrder: 'desc' | 'asc';
}

export default function PipelineTable({
  products,
  filterStatus,
  filterCategory,
  sortBy,
  sortOrder,
}: PipelineTableProps) {
  // Filter products
  const filtered = products.filter((p) => {
    // Status filter
    let statusMatch = true;
    if (filterStatus === 'ready') statusMatch = p.can_run_outreach_now;
    else if (filterStatus === 'in-progress')
      statusMatch = !p.can_run_outreach_now && p.validation && !p.validation.is_draft;
    else if (filterStatus === 'draft') statusMatch = p.validation?.is_draft;
    else if (filterStatus === 'paused') statusMatch = p.validation?.is_paused;

    // Category filter
    let categoryMatch = true;
    if (filterCategory !== 'all') {
      categoryMatch = (p.manifest as any).category === filterCategory;
    }

    return statusMatch && categoryMatch;
  });

  // Sort products
  const sorted = [...filtered].sort((a, b) => {
    let aVal: number | string = 0;
    let bVal: number | string = 0;

    if (sortBy === 'readiness') {
      aVal = a.readiness_score;
      bVal = b.readiness_score;
    } else if (sortBy === 'name') {
      aVal = a.manifest.name.toLowerCase();
      bVal = b.manifest.name.toLowerCase();
    } else if (sortBy === 'updated') {
      aVal = a.validation?.last_scoring_run || '0';
      bVal = b.validation?.last_scoring_run || '0';
    }

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
    }

    return 0;
  });

  const getStatusBadge = (product: EnrichedProduct) => {
    if (product.validation?.is_paused) {
      return (
        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-200">
          ⏸ Paused
        </span>
      );
    }
    if (product.can_run_outreach_now) {
      return (
        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-300">
          ✅ Ready
        </span>
      );
    }
    if (product.validation && !product.validation.is_draft) {
      return (
        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-yellow-900/30 text-yellow-300">
          🟡 In Progress
        </span>
      );
    }
    return (
      <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-200">
        ⚪ Draft
      </span>
    );
  };

  const getReadinessColor = (score: number) => {
    if (score >= 80) return 'bg-green-900/30 text-green-300';
    if (score >= 50) return 'bg-yellow-900/30 text-yellow-300';
    return 'bg-gray-700 text-gray-200';
  };

  const getTestBadge = (product: EnrichedProduct) => {
    const testStatus = product.validation?.validation_test_status;
    if (!testStatus || testStatus === 'not_run') {
      return (
        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-200">
          Not Run
        </span>
      );
    }
    if (testStatus === 'passed') {
      return (
        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-300" title="All validation tests passed">
          ✓ Passed
        </span>
      );
    }
    if (testStatus === 'warning') {
      return (
        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-yellow-900/30 text-yellow-300" title="Validation tests passed with warnings">
          ⚠ Warnings
        </span>
      );
    }
    return (
      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-red-900/30 text-red-300" title="Validation tests failed">
        ✗ Failed
      </span>
    );
  };

  const getCertificateBadge = (cert: EnrichedProduct['certificate_of_occupancy']) => {
    if (cert.status === 'valid') {
      return (
        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-300" title={`Valid until ${cert.valid_until}`}>
          🏠 Valid
        </span>
      );
    }
    if (cert.status === 'expired') {
      return (
        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-red-900/30 text-red-300" title="Certificate expired">
          ⏰ Expired
        </span>
      );
    }
    if (cert.status === 'issues_reported') {
      return (
        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-red-900/30 text-red-300" title="Issues reported - human review required">
          ❌ Issues
        </span>
      );
    }
    if (cert.status === 'pending_review') {
      return (
        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-yellow-900/30 text-yellow-300" title="Pending review">
          ⏳ Pending
        </span>
      );
    }
    return (
      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-200" title="No certificate">
        ❌ None
      </span>
    );
  };

  const getSensorsBadge = (sensors: EnrichedProduct['smart_sensors']) => {
    const issues = [];
    if (sensors.health === 'down') issues.push('🔴');
    else if (sensors.health === 'warning') issues.push('🟡');
    else issues.push('🟢');
    
    if (sensors.security === 'warning') issues.push('🟡');
    
    if (sensors.cost === 'over_budget') issues.push('🔴');
    else if (sensors.cost === 'warning') issues.push('🟡');
    
    const title = `Health: ${sensors.health} | Security: ${sensors.security} | Cost: ${sensors.cost}`;
    return (
      <span className="text-lg" title={title}>
        {issues.join('')}
      </span>
    );
  };

  if (sorted.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-12 text-center">
        <p className="text-gray-500">No products found in this filter</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 border-b border-gray-700">
            <tr>
              <th className="px-6 py-4 text-left font-semibold text-white">Product</th>
              <th className="px-6 py-4 text-center font-semibold text-white">Stage</th>
              <th className="px-6 py-4 text-center font-semibold text-white">Status</th>
              <th className="px-6 py-4 text-center font-semibold text-white">Tests</th>
              <th className="px-6 py-4 text-center font-semibold text-white">Cert</th>
              <th className="px-6 py-4 text-center font-semibold text-white">Sensors</th>
              <th className="px-6 py-4 text-center font-semibold text-white">Score</th>
              <th className="px-6 py-4 text-left font-semibold text-white">Gaps</th>
              <th className="px-6 py-4 text-left font-semibold text-white">Next Step</th>
              <th className="px-6 py-4 text-center font-semibold text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((product) => (
              <tr
                key={product.manifest.name}
                className="border-b border-gray-700 hover:bg-gray-750 transition-colors"
              >
                {/* Product Name */}
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-white">{product.manifest.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {product.validation?.display_name || 'Not in pipeline'}
                    </p>
                  </div>
                </td>

                {/* Status Badge */}
                <td className="px-6 py-4 text-center">{getStatusBadge(product)}</td>

                {/* Validation Tests */}
                <td className="px-6 py-4 text-center">{getTestBadge(product)}</td>

                {/* Readiness Score */}
                <td className="px-6 py-4 text-center">
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getReadinessColor(product.readiness_score)}`}>
                    {product.readiness_score}%
                  </div>
                </td>

                {/* Gaps */}
                <td className="px-6 py-4">
                  {product.gaps.length === 0 ? (
                    <p className="text-xs text-green-400">✓ No gaps</p>
                  ) : (
                    <div>
                      <p className="text-xs font-medium text-gray-400">{product.gaps.length} gap{product.gaps.length !== 1 ? 's' : ''}</p>
                      <ul className="text-xs text-gray-500 mt-1 space-y-0.5">
                        {product.gaps.slice(0, 2).map((gap, i) => (
                          <li key={i}>• {gap}</li>
                        ))}
                        {product.gaps.length > 2 && (
                          <li>• +{product.gaps.length - 2} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </td>

                {/* Next Step / Action Item */}
                <td className="px-6 py-4">
                  {product.action_items.length > 0 ? (
                    <p className="text-xs text-gray-400 line-clamp-2">
                      {product.action_items[0]}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">-</p>
                  )}
                </td>

                {/* Quick Actions */}
                <td className="px-6 py-4 text-center">
                  <Link
                    href={`/admin/pipeline/${product.manifest.name}`}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-900/30 text-blue-300 hover:bg-blue-900/50 rounded text-xs font-medium transition-colors"
                  >
                    Details
                    <ChevronRight size={14} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
