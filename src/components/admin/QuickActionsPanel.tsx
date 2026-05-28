'use client';
import React from 'react';

interface QuickActionsPanelProps {
  product: any;
  onRefresh: () => void;
}

export default function QuickActionsPanel({ product, onRefresh }: QuickActionsPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 sticky top-8">
      <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="space-y-3">
        <button disabled className="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium text-sm hover:bg-blue-100 disabled:opacity-50 cursor-not-allowed">
          🤖 Generate Missing Fields
        </button>
        <button disabled className="w-full px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium text-sm hover:bg-indigo-100 disabled:opacity-50 cursor-not-allowed">
          ✍️ Add Commitment
        </button>
        <button disabled={!product.can_run_outreach_now} className="w-full px-4 py-2 bg-green-50 text-green-600 rounded-lg font-medium text-sm hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed">
          🚀 Run Outreach
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-4">Actions available in Phase 4+</p>
    </div>
  );
}
