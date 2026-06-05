'use client';

/**
 * /admin/pipeline dashboard
 * 
 * Portfolio validation pipeline command center.
 * Answers: "Which products can I run outreach on RIGHT NOW?" and "What work is needed for each?"
 * 
 * Shows:
 * - Summary stats: Total products, ready for outreach, in progress, draft, paused
 * - Sortable table: All products with readiness score, gaps, action items
 * - Color coding: Green (ready) → Yellow (in progress) → Gray (draft/paused)
 * - Quick actions: Click to see gaps, run outreach, generate missing fields
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import PipelineTable from '@/components/admin/PipelineTable';
import PipelineSummary from '@/components/admin/PipelineSummary';
import { supabase } from '@/lib/supabase';

interface PortfolioData {
  summary: {
    total: number;
    ready_for_outreach: number;
    in_progress: number;
    draft: number;
    paused: number;
    not_started: number;
    average_readiness: number;
  };
  portfolio: any[];
}

export default function PipelineDashboard() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'readiness' | 'name' | 'updated'>('readiness');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ready' | 'in-progress' | 'draft' | 'paused'>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | 'infrastructure' | 'own-tools' | 'product' | 'client-product'>('all');

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch('/api/admin/pipeline/scan');

        if (!res.ok) {
          throw new Error(`Failed to fetch portfolio: ${res.statusText}`);
        }

        const portfolio = await res.json();
        setData(portfolio);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolio();

    // Subscribe to realtime updates from key tables
    const channels = supabase
      .channel('pipeline-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pipeline_gates' },
        () => fetchPortfolio()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lifecycle_stages' },
        () => fetchPortfolio()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'certificates' },
        () => fetchPortfolio()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sensors' },
        () => fetchPortfolio()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channels);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Scanning portfolio...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
            <p className="text-red-200">Error loading portfolio: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-white">Products</h1>
              <p className="text-gray-400 mb-2">Every product in the portfolio and where it stands: readiness score, what&apos;s blocking it, and what to do next.</p>
              <p className="text-gray-400">Which products can run outreach right now, and what each one needs before it can.</p>
            </div>
            <Link
              href="/admin/pipeline/new-ideas"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              New Product
            </Link>
          </div>

         {/* Summary Stats */}
        <PipelineSummary summary={data.summary} />

        {/* Initialize Button - show if many products not in pipeline */}
        {data.portfolio.filter((p: any) => !p.validation).length > 5 && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/admin/pipeline/initialize', { method: 'POST' });
                  const result = await res.json();
                  if (result.success) {
                    window.location.reload();
                  } else {
                    alert('Failed: ' + result.error);
                  }
                } catch (e) {
                  alert('Error: ' + e);
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Initialize All Products ({data.portfolio.length - data.portfolio.filter((p: any) => p.validation).length} missing)
            </button>
          </div>
        )}

         {/* Controls */}
         <div className="mb-6 bg-gray-800 border border-gray-700 rounded-lg p-4">
           <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-3 py-2 border border-gray-700 rounded-lg text-sm text-white bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                 <option value="all">All ({data.summary.total})</option>
                 <option value="ready">Ready for Outreach ({data.summary.ready_for_outreach})</option>
                 <option value="in-progress">In Progress ({data.summary.in_progress})</option>
                 <option value="draft">Draft ({data.summary.draft})</option>
                 <option value="paused">Paused ({data.summary.paused})</option>
               </select>
             </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as any)}
                  className="px-3 py-2 border border-gray-700 rounded-lg text-sm text-white bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                   <option value="all">All</option>
                   <option value="infrastructure">Infrastructure</option>
                   <option value="own-tools">Own Tools</option>
                   <option value="client-product">Client Products</option>
                   <option value="product">Products (Distributor SaaS)</option>
                </select>
              </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Sort by</label>
              <div className="flex gap-2">
                <select
                   value={sortBy}
                   onChange={(e) => setSortBy(e.target.value as any)}
                   className="px-3 py-2 border border-gray-700 rounded-lg text-sm text-white bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                 >
                  <option value="readiness">Readiness Score</option>
                  <option value="name">Product Name</option>
                  <option value="updated">Last Updated</option>
                </select>

                <button
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  className="px-3 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-700 font-medium"
                >
                  {sortOrder === 'desc' ? '↓ Highest' : '↑ Lowest'}
                </button>
              </div>
            </div>
          </div>
        </div>

         {/* Table */}
         <PipelineTable
           products={data.portfolio}
           filterStatus={filterStatus}
           filterCategory={filterCategory}
           sortBy={sortBy}
          sortOrder={sortOrder}
        />
      </div>
    </div>
  );
}
