'use client';
import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface ValidationFieldsEditorProps {
  product: any;
  onUpdate?: (updatedValidation: any) => void;
}

// icp_partner_type must be one of InvestorPilot's recognised prospect types —
// it's the top-priority steering signal for discovery. Free text would break
// the receiving query generator, so this field renders as a dropdown.
const PARTNER_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'buyer', label: 'Buyers — operators who would buy this' },
  { value: 'referral_partner', label: 'Referral partners — send us customers' },
  { value: 'integration_partner', label: 'Integration partners — platforms to integrate with' },
  { value: 'reseller', label: 'Resellers / channel partners' },
  { value: 'strategic', label: 'Strategic partners — broader / mixed' },
];

export default function ValidationFieldsEditor({ product, onUpdate }: ValidationFieldsEditorProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    promise: product.validation?.promise || '',
    distributor: product.validation?.distributor || '',
    end_user: product.validation?.end_user || '',
    friction: product.validation?.friction || '',
    distributor_outcomes: product.validation?.distributor_outcomes || '',
    end_user_outcomes: product.validation?.end_user_outcomes || '',
    core_mechanism: product.validation?.core_mechanism || '',
    icp_geography: product.validation?.icp_geography || '',
    // Path 2 — ICP targeting fields InvestorPilot needs for full onboarding.
    icp_partner_type: product.validation?.icp_partner_type || '',
    icp_buyer_title: product.validation?.icp_buyer_title || '',
    icp_verticals: product.validation?.icp_verticals || '',
    icp_company_size: product.validation?.icp_company_size || '',
    icp_stage: product.validation?.icp_stage || '',
    exclusions: product.validation?.exclusions || '',
  });

  // Sync formData when product.validation changes.
  React.useEffect(() => {
    setFormData({
      promise: product.validation?.promise || '',
      distributor: product.validation?.distributor || '',
      end_user: product.validation?.end_user || '',
      friction: product.validation?.friction || '',
      distributor_outcomes: product.validation?.distributor_outcomes || '',
      end_user_outcomes: product.validation?.end_user_outcomes || '',
      core_mechanism: product.validation?.core_mechanism || '',
      icp_geography: product.validation?.icp_geography || '',
      icp_partner_type: product.validation?.icp_partner_type || '',
      icp_buyer_title: product.validation?.icp_buyer_title || '',
      icp_verticals: product.validation?.icp_verticals || '',
      icp_company_size: product.validation?.icp_company_size || '',
      icp_stage: product.validation?.icp_stage || '',
      exclusions: product.validation?.exclusions || '',
    });
  }, [
    product.validation?.promise,
    product.validation?.distributor,
    product.validation?.end_user,
    product.validation?.friction,
    product.validation?.distributor_outcomes,
    product.validation?.end_user_outcomes,
    product.validation?.core_mechanism,
    product.validation?.icp_geography,
    product.validation?.icp_partner_type,
    product.validation?.icp_buyer_title,
    product.validation?.icp_verticals,
    product.validation?.icp_company_size,
    product.validation?.icp_stage,
    product.validation?.exclusions,
  ]);

  const getProductSlug = () => product.validation?.product_slug || product.manifest?.name || product.id || 'unknown';

  const handleSave = async (field: string) => {
    const slug = getProductSlug();
    console.log('Saving field:', field, 'to slug:', slug);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/pipeline/${slug}/validation`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: formData[field as keyof typeof formData] }),
      });
      const data = await res.json();
      console.log('Save response:', res.status, data);
      if (res.ok) {
        setEditing(null);
        if (onUpdate && data.data) {
          onUpdate(data.data);
        }
      } else {
        console.error('Save failed:', data?.error);
        alert(`Save failed: ${data?.error ?? `HTTP ${res.status}`}`);
      }
    } catch (err) {
      console.error('Save error:', err);
      alert(`Save error: ${err instanceof Error ? err.message : 'network error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async (field: string) => {
    setGenerating(field);
    try {
      const slug = getProductSlug();
      console.log('Generating for slug:', slug);

      const productDetails = {
        name: product.manifest?.name || slug,
        problem: product.ideaCard?.problem || '',
        solution: product.ideaCard?.solution || '',
        targetAudience: product.ideaCard?.end_user_pool || product.ideaCard?.distributor || '',
        oneLiner: product.ideaCard?.one_liner || '',
      };

      const res = await fetch(`/api/admin/pipeline/${slug}/validation/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: [field], productDetails }),
      });
      if (res.ok) {
        const data = await res.json();
        console.log('Generate response:', data);
        if (data[field]) {
          setFormData({ ...formData, [field]: data[field] });
          setEditing(field);
        } else {
          console.log('No data for field:', field, data);
        }
      } else {
        console.error('Generate failed:', res.status);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(null);
    }
  };

  const handleGenerateAll = async () => {
    const missing = fields
      .filter((f) => f.generatable && !product.validation?.[f.key])
      .map((f) => f.key);

    if (missing.length === 0) return;

    setGenerating('all');
    try {
      const slug = getProductSlug();
      const productDetails = {
        name: product.manifest?.name || slug,
        problem: product.ideaCard?.problem || '',
        solution: product.ideaCard?.solution || '',
        targetAudience: product.ideaCard?.end_user_pool || product.ideaCard?.distributor || '',
        oneLiner: product.ideaCard?.one_liner || '',
      };

      const res = await fetch(`/api/admin/pipeline/${slug}/validation/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: missing, productDetails }),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = { ...formData };
        for (const key of missing) {
          if (data[key]) updated[key as keyof typeof updated] = data[key];
        }
        setFormData(updated);
        for (const key of missing) {
          if (updated[key as keyof typeof updated]) {
            await fetch(`/api/admin/pipeline/${slug}/validation`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ [key]: updated[key as keyof typeof updated] }),
            });
          }
        }
        // Re-fetch once so the parent sees all the saved values.
        const fresh = await fetch(`/api/admin/pipeline/${slug}/validation`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }).catch(() => null);
        if (fresh && fresh.ok && onUpdate) {
          const fd = await fresh.json();
          if (fd.data) onUpdate(fd.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(null);
    }
  };

  // `type` controls the editor widget: 'textarea' (default), 'text', or
  // 'select' (uses `options`). `generatable` marks fields the LLM generate
  // flow can fill — the new ICP fields are operator-entered, not generated.
  const fields: Array<{
    key: string;
    label: string;
    placeholder: string;
    section: string;
    type?: 'textarea' | 'text' | 'select';
    options?: Array<{ value: string; label: string }>;
    generatable?: boolean;
  }> = [
    { key: 'promise', label: 'Product Promise', placeholder: '1-2 sentence promise of what this product delivers...', section: 'common', generatable: true },
    { key: 'friction', label: 'Friction/Pain Point', placeholder: 'What problem does this solve?', section: 'common', generatable: true },
    { key: 'core_mechanism', label: 'Core Mechanism', placeholder: 'How does your AI work? (e.g., voice analysis, predictive models, NLP)', section: 'common', generatable: true },
    { key: 'icp_geography', label: 'Target Geography', placeholder: 'Where do you want to target? (e.g., Australia, US, UK, Global, APAC)', section: 'common', generatable: true },

    // Path 2 — ICP targeting. These flow to InvestorPilot and drive discovery
    // quality. Operator-entered (not LLM-generated) so they're accurate.
    { key: 'icp_partner_type', label: 'Who to reach (Prospect Type)', placeholder: 'Pick who discovery should target', section: 'common', type: 'select', options: PARTNER_TYPE_OPTIONS },
    { key: 'icp_buyer_title', label: 'Primary Buyer Title', placeholder: 'Decision-maker job title(s) (e.g. vocal academy owner, singing teacher)', section: 'common', type: 'text' },
    { key: 'icp_verticals', label: 'ICP Verticals', placeholder: 'Industries to target (e.g. singing lessons, vocal coaching, music education)', section: 'common', type: 'text' },
    { key: 'icp_company_size', label: 'ICP Company Size', placeholder: 'e.g. 1-50 employees, $50k-$1M revenue', section: 'common', type: 'text' },
    { key: 'icp_stage', label: 'ICP Stage', placeholder: 'e.g. operating businesses, established practices', section: 'common', type: 'text' },
    { key: 'exclusions', label: 'Exclusions', placeholder: 'Who to filter OUT (e.g. large franchises, businesses with in-house apps)', section: 'common' },

    { key: 'distributor', label: 'Distributor ICP', placeholder: 'Who sells/delivers this to end users? (e.g., singing teachers, academies)', section: 'distributor', generatable: true },
    { key: 'distributor_outcomes', label: 'Distributor Outcomes', placeholder: 'What value does this give to your distributors and their clients?', section: 'distributor', generatable: true },
    { key: 'end_user', label: 'End User ICP', placeholder: 'Who uses this product? (e.g., students, karaoke enthusiasts)', section: 'enduser', generatable: true },
    { key: 'end_user_outcomes', label: 'End User Outcomes', placeholder: 'What results do end users get after 90 days?', section: 'enduser', generatable: true },
  ];

  // Count only generatable missing fields for the "Generate All" badge.
  const missingCount = fields.filter((f) => f.generatable && !product.validation?.[f.key]).length;

  const renderValue = (field: { key: string; options?: Array<{ value: string; label: string }> }) => {
    const raw = product.validation?.[field.key];
    if (!raw) return <span className="text-gray-400 italic">(not set)</span>;
    if (field.options) {
      const opt = field.options.find((o) => o.value === raw);
      return opt ? opt.label : raw;
    }
    return raw;
  };

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
            {generating === 'all' ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Generate All ({missingCount})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div
            key={field.key}
            className={`p-4 rounded-lg ${
              field.section === 'distributor'
                ? 'bg-blue-50 border border-blue-100'
                : field.section === 'enduser'
                  ? 'bg-green-50 border border-green-100'
                  : 'bg-gray-50 border border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">{field.label}</p>
              <div className="flex items-center gap-2">
                {!editing && field.generatable && !product.validation?.[field.key] && (
                  <button
                    onClick={() => handleGenerate(field.key)}
                    disabled={generating === field.key}
                    className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium"
                  >
                    {generating === field.key ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
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
                {field.type === 'select' ? (
                  <select
                    value={formData[field.key as keyof typeof formData]}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">— select —</option>
                    {(field.options ?? []).map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : field.type === 'text' ? (
                  <input
                    type="text"
                    value={formData[field.key as keyof typeof formData]}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full p-2 border border-gray-300 rounded text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <textarea
                    value={formData[field.key as keyof typeof formData]}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full p-2 border border-gray-300 rounded text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                )}
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
              <p className="text-gray-700">{renderValue(field)}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}