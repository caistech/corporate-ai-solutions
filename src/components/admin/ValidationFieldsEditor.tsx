'use client';
import React from 'react';

interface ValidationFieldsEditorProps {
  product: any;
  onRefresh: () => void;
}

export default function ValidationFieldsEditor({ product, onRefresh }: ValidationFieldsEditorProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Validation Fields</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-600 mb-2">Promise</p>
          <p className="text-gray-700">{product.validation?.promise || '(not set)'}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-600 mb-2">Distributor</p>
          <p className="text-gray-700">{product.validation?.distributor || '(not set)'}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-600 mb-2">End User</p>
          <p className="text-gray-700">{product.validation?.end_user || '(not set)'}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-600 mb-2">Friction</p>
          <p className="text-gray-700">{product.validation?.friction || '(not set)'}</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-4">Edit via detail form (Phase 4 feature)</p>
    </div>
  );
}
