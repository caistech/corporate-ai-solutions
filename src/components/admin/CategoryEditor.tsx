'use client';

/**
 * Category Editor Component
 * 
 * Allows changing a product's category (infrastructure, own-tools, product, client-product)
 * Used when a product's status changes during development
 * Updates the portfolio-manifest.yaml via API
 */

import React, { useState } from 'react';

interface CategoryEditorProps {
  productId: string;
  currentCategory?: string;
  onRefresh: () => void;
}

const CATEGORY_OPTIONS = [
  { value: 'infrastructure', label: 'Infrastructure', description: 'Shared @caistech services & platform' },
  { value: 'own-tools', label: 'Own Tools', description: 'Internal factory use' },
  { value: 'client-product', label: 'Client Product', description: 'Paid custom build for specific client' },
  { value: 'product', label: 'Product (Distributor SaaS)', description: 'Lane 1 paid distributor SaaS' },
];

export default function CategoryEditor({ productId, currentCategory = 'product', onRefresh }: CategoryEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(currentCategory);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSave = async () => {
    if (selectedCategory === currentCategory) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const res = await fetch(`/api/admin/pipeline/${productId}/category`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: selectedCategory }),
      });

      if (!res.ok) {
        throw new Error(`Failed to update category: ${res.statusText}`);
      }

      setSuccess(`Category updated to "${selectedCategory}"`);
      setIsEditing(false);
      onRefresh();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSaving(false);
    }
  };

  const currentOption = CATEGORY_OPTIONS.find(o => o.value === currentCategory);
  const selectedOption = CATEGORY_OPTIONS.find(o => o.value === selectedCategory);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Category</h3>

      {!isEditing ? (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded p-4">
            <p className="text-sm text-gray-600 mb-1">Current Category</p>
            <p className="text-lg font-medium text-gray-900">{currentOption?.label}</p>
            <p className="text-sm text-gray-500 mt-1">{currentOption?.description}</p>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 font-medium transition-colors"
          >
            Change Category
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select New Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {selectedOption && (
              <p className="text-xs text-gray-500 mt-2">{selectedOption.description}</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving || selectedCategory === currentCategory}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 font-medium transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setSelectedCategory(currentCategory);
                setError(null);
              }}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded p-3">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}
    </div>
  );
}
