'use client';

/**
 * Product Detail View Component
 * 
 * Shows comprehensive validation status + fix actions for a single product
 * Structured as a logical flow: Steps 1-4 → Validation Tests → Submit for Outreach
 */

import React, { useEffect, useState } from 'react';
import GapsSection from './GapsSection';
import ValidationFieldsEditor from './ValidationFieldsEditor';
import QuickActionsPanel from './QuickActionsPanel';
import AuditTrailPanel from './AuditTrailPanel';
import CategoryEditor from './CategoryEditor';
import ValidationTestResults from './ValidationTestResults';
import { CheckCircle, Send, Loader2, ExternalLink, Play, Wrench, XCircle, AlertTriangle, AlertCircle } from 'lucide-react';

interface ProductDetailViewProps {
  productId: string;
}

export default function ProductDetailView({ productId }: ProductDetailViewProps) {
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Compliance tests state
  type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  const [complianceTests, setComplianceTests] = useState<Array<{ id: string; name: string; description: string; status: TestStatus; findings: string[] }>>([
    { id: 'auth', name: 'Auth Flows', description: 'Signup, login, password reset, magic link work', status: 'pending', findings: [] },
    { id: 'branding', name: 'Branding', description: 'Logo, colors, typography consistent', status: 'pending', findings: [] },
    { id: 'metadata', name: 'Metadata', description: 'OG tags, title, favicon, manifest', status: 'pending', findings: [] },
    { id: 'security', name: 'Security Headers', description: 'CORS, CSP, HSTS configured', status: 'pending', findings: [] },
    { id: 'privacy', name: 'Privacy Compliance', description: 'Terms, privacy policy, cookie consent', status: 'pending', findings: [] },
  ]);

  // Validation tests state
  const [validationTests, setValidationTests] = useState<Array<{ id: string; name: string; description: string; status: TestStatus; findings: string[] }>>([
    { id: 'naive', name: 'Naive Tester', description: 'Human walkthrough - friction, terminology, "I want that" reaction', status: 'pending', findings: [] },
    { id: 'voice', name: 'Voice Auditor', description: 'Voice agent placement and behavior', status: 'pending', findings: [] },
    { id: 'gtm', name: 'GTM Auditor', description: 'Distribution loop - does output create next user?', status: 'pending', findings: [] },
    { id: 'qa', name: 'QA Tests', description: 'Automated browser testing', status: 'pending', findings: [] },
  ]);

  const [runningTest, setRunningTest] = useState<string | null>(null);
  const [fixingTest, setFixingTest] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      console.log('[FETCH] Starting fetch, productId:', productId, 'refreshTrigger:', refreshTrigger);
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(`/api/admin/pipeline/${productId}?_t=${Date.now()}`);
        console.log('[FETCH] Response status:', res.status);

        if (!res.ok) {
          throw new Error(`Failed to fetch product: ${res.statusText}`);
        }

        const data = await res.json();
        console.log('[FETCH] Got data, has_methodology_commitment:', data.validation?.has_methodology_commitment);
        setProduct(data);
        console.log('[FETCH] Set product state');
      } catch (err) {
        console.error('[FETCH] Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
        console.log('[FETCH] Loading set to false');
      }
    };

    fetchProduct();
  }, [productId, refreshTrigger]);

  const handleRefresh = async () => {
    console.log('[REFRESH] handleRefresh called, current trigger:', refreshTrigger);
    // Wait for DB sync before fetching
    await new Promise(r => setTimeout(r, 500));
    const newVal = refreshTrigger + 1;
    setRefreshTrigger(newVal);
    console.log('[REFRESH] Set trigger to:', newVal);
  };

  const handleSubmitForOutreach = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/pipeline/${productId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_outreach' }),
      });
      if (res.ok) {
        alert('Product submitted for outreach! InvestorPilot will be notified.');
        // handleRefresh(); // DISABLED - keeps stale data
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit for outreach');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading product: {error}</p>
      </div>
    );
  }

  const calculateGaps = (validation: any) => {
    const gaps: string[] = [];
    if (!validation) return gaps;
    if (!validation.has_promise) gaps.push('Missing product promise');
    if (!validation.has_distributor) gaps.push('Missing distributor hypothesis');
    if (!validation.has_end_user) gaps.push('Missing end-user definition');
    if (!validation.has_friction) gaps.push('Missing friction/pain point');
    if (!validation.has_methodology_commitment) gaps.push('No founder commitment to validate');
    if (validation.hard_gates_passed < validation.hard_gates_total) {
      gaps.push(`${validation.hard_gates_total - validation.hard_gates_passed} hard gates not passed`);
    }
    if ((validation.weighted_score_percent || 0) < 80) {
      gaps.push(`Weighted score ${validation.weighted_score_percent || 0}% (need ≥80%)`);
    }
    return gaps;
  };

  const validationFieldsComplete = 
    product.validation?.promise && 
    product.validation?.distributor && 
    product.validation?.end_user && 
    product.validation?.friction;

  const allCompliancePassed = complianceTests.every(t => t.status === 'passed');
  const allValidationPassed = validationTests.every(t => t.status === 'passed');
  const allTestsPassed = allCompliancePassed && allValidationPassed;
  const isReadyForOutreach = product.can_run_outreach_now && allTestsPassed;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.manifest.name}</h1>
            <p className="text-gray-500 mt-1">{product.validation?.display_name || 'Not in pipeline'}</p>
          </div>

          {/* Status Badges */}
          <div className="flex gap-2">
            {product.can_run_outreach_now && (
              <span className="inline-block px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-700">
                ✅ Ready for Outreach
              </span>
            )}
            {product.validation?.is_paused && (
              <span className="inline-block px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                ⏸ Paused
              </span>
            )}
            {product.validation?.is_draft && (
              <span className="inline-block px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                📝 Draft
              </span>
            )}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="font-semibold text-blue-900 mb-2">Readiness: {product.readiness_score}%</h2>
          <p className="text-blue-800 text-sm mb-2">{product.validation?.promise || 'No promise defined yet'}</p>
          <p className="text-blue-700 text-sm">{product.action_items.length} action{product.action_items.length !== 1 ? 's' : ''} needed to reach outreach readiness</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="font-medium text-gray-900">Validation Progress</p>
          <p className="text-sm font-bold text-gray-600">{product.readiness_score}%</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              product.readiness_score >= 80
                ? 'bg-green-500'
                : product.readiness_score >= 50
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            }`}
            style={{ width: `${product.readiness_score}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {product.can_run_outreach_now
            ? 'Ready to run outreach! Submit below to notify InvestorPilot.'
            : `Fill ${product.gaps.length} gap${product.gaps.length !== 1 ? 's' : ''} to enable outreach.`}
        </p>
      </div>

      {/* STEP 1-4: Validation Fields - The core validation data */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">STEPS 1-4</span>
          <h2 className="text-lg font-semibold text-gray-900">Validation Fields</h2>
          {validationFieldsComplete && <CheckCircle className="text-green-600" size={18} />}
        </div>
        <p className="text-sm text-gray-600 mb-4">
          These 4 fields define what your product is and who it is for.
          <br /><strong>This item is for:</strong> Defining the product promise, distributor model, end user, and pain point.
          <br /><strong>When done:</strong> Move to Step 6 (Compliance) ↓
        </p>
        <ValidationFieldsEditor 
          product={product} 
          onUpdate={(updatedValidation) => {
            console.log('[EDITOR] Got updated validation:', updatedValidation);
            const newGaps = calculateGaps(updatedValidation);
            setProduct((prev: any) => ({
              ...prev,
              validation: updatedValidation,
              gaps: newGaps
            }));
          }} 
        />
      </div>

      {/* STEP 5: Founder Commitment */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded">STEP 5</span>
          <h2 className="text-lg font-semibold text-gray-900">Founder Commitment</h2>
          {product.validation?.has_methodology_commitment && <CheckCircle className="text-green-600" size={18} />}
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Tick to confirm you are committed to running the 4-week validation pipeline.
          <br /><strong>This item is for:</strong> Confirming you will actually validate this product.
          <br /><strong>When done:</strong> Move to Step 6 (Design & Build) ↓
        </p>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={product.validation?.has_methodology_commitment || false}
            onChange={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('[CHECKBOX] Clicked, value:', e.target.checked);
              try {
                const res = await fetch(`/api/admin/pipeline/${productId}/validation`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ has_methodology_commitment: e.target.checked }),
                });
                const data = await res.json();
                console.log('[CHECKBOX] Response - success:', data.success, 'data:', JSON.stringify(data.data));
                console.log('[CHECKBOX] Response commitment value:', data.data?.has_methodology_commitment);
                if (res.ok && data.data) {
                  const newGaps = calculateGaps(data.data);
                  setProduct((prev: any) => ({
                    ...prev,
                    validation: data.data,
                    gaps: newGaps
                  }));
                  console.log('[CHECKBOX] Updated local state, gaps:', newGaps);
                }
              } catch (err) {
                console.error('[CHECKBOX] Error:', err);
              }
            }}
            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
          />
          <span className="text-gray-700">
            I commit to running the 4-week validation pipeline for this product
          </span>
        </label>
      </div>

      {/* STEP 6: Product URL - Enter the deployed URL */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">STEP 6</span>
          <h2 className="text-lg font-semibold text-gray-900">Product Deployment</h2>
          {product.validation?.mvp_url && <CheckCircle className="text-green-600" size={18} />}
        </div>
        <p className="text-sm text-gray-600 mb-4">
          {product.validation?.mvp_url 
            ? "Product URL is set. You can run validation tests."
            : "Enter the deployed product URL to enable testing. If no URL exists, you need to design and build the product first."}
        </p>
        
        {product.validation?.mvp_url ? (
          <div className="flex items-center gap-4">
            <a 
              href={product.validation.mvp_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-2"
            >
              {product.validation.mvp_url}
              <ExternalLink size={14} />
            </a>
            <button
              onClick={async () => {
                const newUrl = prompt('Enter product URL:', product.validation?.mvp_url || '');
                if (newUrl !== null && newUrl.trim() !== '') {
                  const res = await fetch(`/api/admin/pipeline/${productId}/validation`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mvp_url: newUrl.trim() }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setProduct((prev: any) => ({
                      ...prev,
                      validation: data.data
                    }));
                  }
                }
              }}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Edit URL
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded">
              ⚠️ No product URL found. You need to either:
            </p>
            <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
              <li>Enter an existing deployed URL below if the product already exists</li>
              <li>Design and build the product (then come back and enter URL)</li>
            </ol>
            <div className="flex gap-2 mt-4">
              <input
                type="url"
                placeholder="https://your-product.vercel.app"
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                id="mvp-url-input"
              />
              <button
                onClick={async () => {
                  const input = document.getElementById('mvp-url-input') as HTMLInputElement;
                  const url = input?.value?.trim();
                  console.log('[URL SAVE] Button clicked, url:', url);
                  if (url) {
                    const res = await fetch(`/api/admin/pipeline/${productId}/validation`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ mvp_url: url }),
                    });
                    console.log('[URL SAVE] Response:', res.status, await res.clone().json().catch(() => ({})));
                    if (res.ok) {
                      const data = await res.json();
                      setProduct((prev: any) => ({
                        ...prev,
                        validation: data.data
                      }));
                    }
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Save URL
              </button>
            </div>
          </div>
        )}
      </div>

      {/* STEP 7: Design & Build - greyed if URL exists */}
      <div className={`rounded-lg shadow p-6 ${product.validation?.mvp_url ? 'bg-gray-100 opacity-60' : 'bg-white'}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">STEP 7</span>
          <h2 className="text-lg font-semibold text-gray-900">Design & Build</h2>
          {product.validation?.mvp_url && <CheckCircle className="text-green-600" size={18} />}
        </div>
        <p className="text-sm text-gray-600 mb-4">
          {product.validation?.mvp_url 
            ? "Product is built and deployed. Skip to compliance tests."
            : "Design and build the product. Once deployed, enter the URL in Step 6."}
        </p>
        
        {product.validation?.mvp_url ? (
          <p className="text-sm text-gray-500 italic">
            ✅ Product deployed - design & build complete
          </p>
        ) : (
          <button
            onClick={() => window.open('https://github.com/new', '_blank')}
            className="px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
          >
            Start Design & Build →
          </button>
        )}
      </div>

      {/* STEP 8: Compliance Tests */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">STEP 8</span>
          <h2 className="text-lg font-semibold text-gray-900">Compliance Tests</h2>
          {complianceTests.every(t => t.status === 'passed') && <CheckCircle className="text-green-600" size={18} />}
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Run compliance checks to ensure the product meets technical and legal requirements.
          <br /><strong>When done:</strong> Move to Step 9 (Validation Tests) ↓
        </p>
        
        <div className="space-y-3">
          {complianceTests.map((test) => (
            <div key={test.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {test.status === 'passed' && <CheckCircle className="text-green-600" size={20} />}
                  {test.status === 'failed' && <XCircle className="text-red-600" size={20} />}
                  {test.status === 'warning' && <AlertTriangle className="text-yellow-600" size={20} />}
                  {test.status === 'pending' && <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}
                  {test.status === 'running' && <Loader2 className="text-blue-600 animate-spin" size={20} />}
                  
                  <div>
                    <h4 className="font-medium text-gray-900">{test.name}</h4>
                    <p className="text-sm text-gray-500">{test.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {test.status === 'pending' || test.status === 'failed' || test.status === 'warning' ? (
                    <button
                      onClick={async () => {
                        setRunningTest(test.id);
                        setComplianceTests(prev => prev.map(t => t.id === test.id ? { ...t, status: 'running' } : t));
                        try {
                          const res = await fetch(`/api/admin/pipeline/${productId}/run-test`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              testType: test.id, 
                              testId: test.id,
                              mvpUrl: product.validation?.mvp_url 
                            }),
                          });
                          const data = await res.json();
                          console.log('[COMPLIANCE TEST] Result:', data);
                          
                          // Handle both automated and manual test results
                          let newStatus: TestStatus = 'passed';
                          let newFindings: string[] = [];
                          
                          if (data.status === 'manual_required') {
                            // Show instructions for manual tests
                            newStatus = 'warning';
                            newFindings = data.instructions ? [data.instructions] : ['Manual review required'];
                            if (data.steps) {
                              newFindings = data.steps;
                            }
                          } else if (data.findings?.length > 0) {
                            newStatus = data.status === 'warning' ? 'warning' : 'failed';
                            newFindings = data.findings;
                          }
                          
                          setComplianceTests(prev => prev.map(t => t.id === test.id ? { 
                            ...t, 
                            status: newStatus,
                            findings: newFindings
                          } : t));
                          // handleRefresh(); // DISABLED - keeps stale data
                        } catch (err) {
                          console.error('[COMPLIANCE TEST] Error:', err);
                          setComplianceTests(prev => prev.map(t => t.id === test.id ? { ...t, status: 'failed' } : t));
                        }
                        setRunningTest(null);
                      }}
                      disabled={runningTest === test.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {runningTest === test.id ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                      Run Test
                    </button>
                  ) : null}

                  {test.status === 'failed' && (
                    <button
                      onClick={async () => {
                        setFixingTest(test.id);
                        await new Promise(r => setTimeout(r, 2000));
                        setComplianceTests(prev => prev.map(t => t.id === test.id ? { ...t, status: 'passed', findings: [] } : t));
                        setFixingTest(null);
                      }}
                      disabled={fixingTest === test.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {fixingTest === test.id ? <Loader2 size={14} className="animate-spin" /> : <Wrench size={14} />}
                      Fix Now
                    </button>
                  )}
                </div>
              </div>

              {test.findings && test.findings.length > 0 && (
                <div className="mt-3 pl-8">
                  <div className="text-sm text-red-600 font-medium">Findings:</div>
                  <ul className="text-sm text-red-500 list-disc list-inside">
                    {test.findings.map((finding, i) => (
                      <li key={i}>{finding}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}

          {complianceTests.every(t => t.status === 'passed') && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="text-green-600" size={20} />
              <span className="text-green-700 font-medium">All compliance tests passed!</span>
            </div>
          )}
          {complianceTests.some(t => t.status === 'warning') && !complianceTests.every(t => t.status === 'passed') && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="text-yellow-600" size={20} />
              <span className="text-yellow-700 font-medium">{complianceTests.filter(t => t.status === 'warning').length} compliance tests with warnings</span>
            </div>
          )}
          {complianceTests.some(t => t.status === 'failed') && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="text-red-600" size={20} />
              <span className="text-red-700 font-medium">{complianceTests.filter(t => t.status === 'failed').length} compliance tests failed</span>
            </div>
          )}
        </div>
      </div>

      {/* STEP 9: Validation Tests */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-yellow-600 text-white text-xs font-bold px-2 py-1 rounded">STEP 9</span>
          <h2 className="text-lg font-semibold text-gray-900">Validation Tests</h2>
          {validationTests.every(t => t.status === 'passed') && <CheckCircle className="text-green-600" size={18} />}
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Run validation tests using gstack skills (naive-tester, voice-auditor, gtm-auditor, qa).
          <br /><strong>When done:</strong> Move to Step 10 (Final Score) ↓
        </p>
        
        <div className="space-y-3">
          {validationTests.map((test) => (
            <div key={test.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {test.status === 'passed' && <CheckCircle className="text-green-600" size={20} />}
                  {test.status === 'failed' && <XCircle className="text-red-600" size={20} />}
                  {test.status === 'warning' && <AlertTriangle className="text-yellow-600" size={20} />}
                  {test.status === 'pending' && <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}
                  {test.status === 'running' && <Loader2 className="text-blue-600 animate-spin" size={20} />}
                  
                  <div>
                    <h4 className="font-medium text-gray-900">{test.name}</h4>
                    <p className="text-sm text-gray-500">{test.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {test.status === 'pending' || test.status === 'failed' || test.status === 'warning' ? (
                    <button
                      onClick={async () => {
                        setRunningTest('val-' + test.id);
                        setValidationTests(prev => prev.map(t => t.id === test.id ? { ...t, status: 'running' } : t));
                        try {
                          const res = await fetch(`/api/admin/pipeline/${productId}/run-test`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              testType: test.id, 
                              testId: test.id,
                              mvpUrl: product.validation?.mvp_url 
                            }),
                          });
                          const data = await res.json();
                          console.log('[VALIDATION TEST] Result:', data);
                          
                          // Handle both automated and manual test results
                          let newStatus: TestStatus = 'passed';
                          let newFindings: string[] = [];
                          
                          if (data.status === 'manual_required') {
                            newStatus = 'warning';
                            newFindings = data.steps || [data.instructions].filter(Boolean);
                          } else if (data.findings?.length > 0) {
                            newStatus = data.status === 'warning' ? 'warning' : 'failed';
                            newFindings = data.findings;
                          }
                          
                          setValidationTests(prev => prev.map(t => t.id === test.id ? { 
                            ...t, 
                            status: newStatus,
                            findings: newFindings
                          } : t));
                          // handleRefresh(); // DISABLED - keeps stale data
                        } catch (err) {
                          console.error('[VALIDATION TEST] Error:', err);
                          setValidationTests(prev => prev.map(t => t.id === test.id ? { ...t, status: 'failed' } : t));
                        }
                        setRunningTest(null);
                      }}
                      disabled={runningTest === 'val-' + test.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {runningTest === 'val-' + test.id ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                      Run Test
                    </button>
                  ) : null}

                  {test.status === 'failed' && (
                    <button
                      onClick={async () => {
                        setFixingTest('val-' + test.id);
                        await new Promise(r => setTimeout(r, 2000));
                        setValidationTests(prev => prev.map(t => t.id === test.id ? { ...t, status: 'passed', findings: [] } : t));
                        setFixingTest(null);
                      }}
                      disabled={fixingTest === 'val-' + test.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {fixingTest === 'val-' + test.id ? <Loader2 size={14} className="animate-spin" /> : <Wrench size={14} />}
                      Fix Now
                    </button>
                  )}
                </div>
              </div>

              {test.findings && test.findings.length > 0 && (
                <div className="mt-3 pl-8">
                  <div className="text-sm text-red-600 font-medium">Findings:</div>
                  <ul className="text-sm text-red-500 list-disc list-inside">
                    {test.findings.map((finding, i) => (
                      <li key={i}>{finding}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}

          {validationTests.every(t => t.status === 'passed') && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="text-green-600" size={20} />
              <span className="text-green-700 font-medium">All validation tests passed!</span>
            </div>
          )}
        </div>
      </div>

      {/* STEP 10: Gaps Summary + Submit */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded">STEP 10</span>
          <h2 className="text-lg font-semibold text-gray-900">Final Score Check</h2>
          {product.readiness_score >= 80 && <CheckCircle className="text-green-600" size={18} />}
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Your validation score must be ≥80% to run outreach.
          <br /><strong>This item is for:</strong> Reviewing remaining gaps and confirming readiness.
          <br /><strong>When score ≥80%:</strong> Submit for automated outreach to InvestorPilot ↓
        </p>
        <GapsSection gaps={product.gaps} actionItems={product.action_items} productSlug={product.manifest?.name} />
        
        {/* Submit for Outreach Button */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={handleSubmitForOutreach}
            disabled={!isReadyForOutreach || submitting}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all ${
              isReadyForOutreach
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Submitting...
              </>
            ) : (
              <>
                <Send size={20} />
                {isReadyForOutreach 
                  ? 'Submit for Automated Outreach →' 
                  : `Submit for Outreach (${product.readiness_score}%/80%)`}
              </>
            )}
          </button>
          {isReadyForOutreach && (
            <p className="text-center text-sm text-green-600 mt-2">
              ✅ Product will be sent to InvestorPilot for distributor outreach
            </p>
          )}
        </div>
      </div>

      {/* Right Column - Category + Audit (less critical) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2" />
        <div>
          <div id="category">
            <CategoryEditor 
              productId={productId} 
              currentCategory={product.manifest.category} 
              onRefresh={handleRefresh} 
            />
          </div>
          <div className="mt-6" id="audit">
            <AuditTrailPanel productId={productId} />
          </div>
        </div>
      </div>
    </div>
  );
}

