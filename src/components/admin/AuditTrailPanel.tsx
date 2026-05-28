'use client';
import React from 'react';

interface AuditTrailPanelProps {
  productId: string;
}

export default function AuditTrailPanel({ productId }: AuditTrailPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Recent Changes</h3>
      <div className="text-sm text-gray-500 text-center py-8">
        <p>Audit trail loading...</p>
        <p className="text-xs mt-2">(Phase 4 feature)</p>
      </div>
    </div>
  );
}
