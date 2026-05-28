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
  };
  validation: any;
  gaps: string[];
  readiness_score: number;
  can_run_outreach_now: boolean;
  action_items: string[];
}

interface PipelineTableProps {
  products: EnrichedProduct[];
  filterStatus: 'all' | 'ready' | 'in-progress' | 'draft' | 'paused';
  filterCategory: 'all' | 'infrastructure' | 'own-tools' | 'product';
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
        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          ⏸ Paused
        </span>
      );
    }
    if (product.can_run_outreach_now) {
      return (
        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          ✅ Ready
        </span>
      );
    }
    if (product.validation && !product.validation.is_draft) {
      return (
        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
          🟡 In Progress
        </span>
      );
    }
    return (
      <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        ⚪ Draft
      </span>
    );
  };

  const getReadinessColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-700';
    if (score >= 50) return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-600';
  };

  if (sorted.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-gray-500">No products found in this filter</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left font-semibold text-gray-900">Product</th>
              <th className="px-6 py-4 text-center font-semibold text-gray-900">Status</th>
              <th className="px-6 py-4 text-center font-semibold text-gray-900">Readiness</th>
              <th className="px-6 py-4 text-left font-semibold text-gray-900">Gaps</th>
              <th className="px-6 py-4 text-left font-semibold text-gray-900">Next Step</th>
              <th className="px-6 py-4 text-center font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((product) => (
              <tr
                key={product.manifest.name}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                {/* Product Name */}
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{product.manifest.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {product.validation?.display_name || 'Not in pipeline'}
                    </p>
                  </div>
                </td>

                {/* Status Badge */}
                <td className="px-6 py-4 text-center">{getStatusBadge(product)}</td>

                {/* Readiness Score */}
                <td className="px-6 py-4 text-center">
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getReadinessColor(product.readiness_score)}`}>
                    {product.readiness_score}%
                  </div>
                </td>

                {/* Gaps */}
                <td className="px-6 py-4">
                  {product.gaps.length === 0 ? (
                    <p className="text-xs text-green-600">✓ No gaps</p>
                  ) : (
                    <div>
                      <p className="text-xs font-medium text-gray-600">{product.gaps.length} gap{product.gaps.length !== 1 ? 's' : ''}</p>
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
                    <p className="text-xs text-gray-600 line-clamp-2">
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
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-medium transition-colors"
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
