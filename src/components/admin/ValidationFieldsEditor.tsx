'use client';
import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface ValidationFieldsEditorProps {
  product: any;
  onRefresh: () => void;
}

export default function ValidationFieldsEditor({ product, onRefresh }: ValidationFieldsEditorProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    promise: product.validation?.promise || '',
    distributor: product.validation?.distributor || '',
    end_user: product.validation?.end_user || '',
    friction: product.validation?.friction || '',
  });

  const handleSave = async (field: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/pipeline/${product.product_slug}/validation`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: formData[field as keyof typeof formData] }),
      });
      if (res.ok) {
        setEditing(null);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async (field: string) => {
    setGenerating(field);
    try {
      const res = await fetch(`/api/admin/pipeline/${product.product_slug}/validation/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: [field] }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data[field]) {
          setFormData({ ...formData, [field]: data[field] });
          setEditing(field);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(null);
    }
  };

  const handleGenerateAll = async () => {
    const missing = fields
      .filter(f => !product.validation?.[f.key])
      .map(f => f.key);
    
    if (missing.length === 0) return;
    
    setGenerating('all');
    try {
      const res = await fetch(`/api/admin/pipeline/${product.id}/validation/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: missing }),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = { ...formData };
        for (const key of missing) {
          if (data[key]) updated[key as keyof typeof updated] = data[key];
        }
        setFormData(updated);
        // Auto-save all generated fields
        for (const key of missing) {
          if (updated[key as keyof typeof updated]) {
            await fetch(`/api/admin/pipeline/${product.id}/validation`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ [key]: updated[key as keyof typeof updated] }),
            });
          }
        }
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(null);
    }
  };

  const fields = [
    { key: 'promise', label: 'Product Promise', placeholder: '1-2 sentence promise of what this product delivers...' },
    { key: 'distributor', label: 'Distributor', placeholder: 'Who sells/delivers this to end users?' },
    { key: 'end_user', label: 'End User', placeholder: 'Who uses this product?' },
    { key: 'friction', label: 'Friction/Pain Point', placeholder: 'What problem does this solve?' },
  ];

  const missingCount = fields.filter(f => !product.validation?.[f.key]).length;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Validation Fields</h2>
        {missingCount > 0 && (
          <button
            onClick={handleGenerateAll}
            disabled={generating !== null}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
          >
            {generating === 'all' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            Generate All ({missingCount})
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.key} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">{field.label}</p>
              <div className="flex items-center gap-2">
                {!editing && !product.validation?.[field.key] && (
                  <button
                    onClick={() => handleGenerate(field.key)}
                    disabled={generating === field.key}
                    className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium"
                  >
                    {generating === field.key ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Sparkles size={12} />
                    )}
                    Generate
                  </button>
                )}
                {editing !== field.key && (
                  <button
                    onClick={() => setEditing(field.key)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
            {editing === field.key ? (
              <div>
                <textarea
                  value={formData[field.key as keyof typeof formData]}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full p-2 border border-gray-300 rounded text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleSave(field.key)}
                    disabled={saving}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="px-3 py-1.5 text-gray-600 text-sm rounded hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700">
                {product.validation?.[field.key] || <span className="text-gray-400 italic">(not set)</span>}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
