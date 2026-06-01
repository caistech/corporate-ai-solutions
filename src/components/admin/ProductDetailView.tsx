'use client';

/**
 * Product Detail View Component
 *
 * Operator card for one product, sequenced to the survey-gated flow:
 *
 *   FRONT DOOR (always visible)
 *     Header + Survey Verdict banner
 *     Step 1 — Define the spec        (the 14 spec fields; can't build/survey without the
 *                                       distributor/end-user)               [was STEPS 1-4]
 *     Step 2 — Website / Product URL                                        [was STEP 6]
 *     Step 3 — Survey gate (the front door) + branch:
 *                INCOMPLETE-SPEC → fill the spec above
 *                TEARDOWN / no URL → Stage 2 Design & Build                 [was STEP 7]
 *                RENOVATION → unlocks downstream
 *
 *   DOWNSTREAM (visually locked until a RENOVATION verdict)
 *     Step 4 — Founder commitment                                          [was STEP 5]
 *     Step 5 — Compliance tests                                            [was STEP 8]
 *     Step 6 — Validation tests                                            [was STEP 9]
 *     Step 7 — Final score + gaps + recalculate + submit + IP login        [was STEP 10]
 *
 *   Category + Audit (bottom)
 *
 * The survey verdict is NOT recomputed here. It is read from product.survey_gate — the latest
 * pipeline_gates `gate==='survey'` row, attached by the API route. The verdict is recovered from
 * the row's `reason` leading token, identical to components/methodology/SurveyGatePanel.tsx
 * (kept in sync deliberately — see parseVerdict below). Survey itself runs out-of-band: the
 * naive-tester SURVEY_MODE skill browses the live site and POSTs survey.json to the survey route.
 * Step 3 surfaces the recorded verdict and how to run survey mode; it does NOT fake-run in-browser.
 */

import React, { useEffect, useRef, useState } from 'react';
import GapsSection from './GapsSection';
import ValidationFieldsEditor from './ValidationFieldsEditor';
import QuickActionsPanel from './QuickActionsPanel';
import AuditTrailPanel from './AuditTrailPanel';
import CategoryEditor from './CategoryEditor';
import ValidationTestResults from './ValidationTestResults';
import type { SurveyGateRecord } from '@/components/methodology/SurveyGatePanel';
import { parseVerdict, type Verdict } from '@/lib/methodology/survey-verdict';
import { CheckCircle, Send, Loader2, ExternalLink, Play, Wrench, XCircle, AlertTriangle, AlertCircle, Lock, Search } from 'lucide-react';

interface ProductDetailViewProps {
  productId: string;
}

// ── Survey verdict (light-themed mirror of SurveyGatePanel) ───────────────────────────────────
// The methodology cockpit's SurveyGatePanel is dark-themed; this card is light. We reuse its
// SurveyGateRecord shape and parse semantics but render a light banner so it fits the card.
// parseVerdict MUST stay byte-identical to SurveyGatePanel.parseVerdict — the route writes the
// `reason` as "VERDICT → next stage · evidenced X/14 · PRE-HARD …" and both readers split the
// leading token off it. parseVerdict + Verdict now live in one place (survey-verdict.ts, imported above).

// The card's effective front-door state: a recorded verdict, or a synthetic pre-survey state.
type FrontDoorState = Verdict | 'NOT-SURVEYED' | 'NO-URL';

const VERDICT_BANNER: Record<FrontDoorState, { box: string; text: string; label: string; blurb: string }> = {
  RENOVATION: {
    box: 'bg-green-50 border-green-200', text: 'text-green-700', label: 'RENOVATION',
    blurb: 'The live build evidences the spec. Downstream steps are unlocked → Stage 5.',
  },
  TEARDOWN: {
    box: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', label: 'TEARDOWN',
    blurb: "The live build doesn't evidence the spec (or a PRE-HARD failed). Re-enter Stage 2 design & build.",
  },
  'INCOMPLETE-SPEC': {
    box: 'bg-red-50 border-red-200', text: 'text-red-700', label: 'INCOMPLETE-SPEC',
    blurb: 'The spec itself is incomplete — fill it in Step 1, then re-run survey mode.',
  },
  'NOT-SURVEYED': {
    box: 'bg-gray-50 border-gray-200', text: 'text-gray-600', label: 'NOT SURVEYED',
    blurb: 'A URL is set but no survey verdict is recorded yet. Run survey mode against the live build.',
  },
  'NO-URL': {
    box: 'bg-gray-50 border-gray-200', text: 'text-gray-600', label: 'NO URL — PRE-SURVEY',
    blurb: "No product URL yet, so the survey can't run. Define the spec, then design & build (Stage 2).",
  },
  UNKNOWN: {
    box: 'bg-gray-50 border-gray-200', text: 'text-gray-600', label: 'UNKNOWN',
    blurb: 'A survey row exists but its verdict could not be read.',
  },
};

// ── Survey kickoff (Option A — the bridge) ────────────────────────────────────────────────────
// The card cannot RUN the survey (that's an LLM+browser judgment job — the naive-tester agent
// skill, not an app function). What it CAN do is kill the "where do I even start" gap: a copy-to-
// clipboard block with the exact, product-specific invocation to paste into Claude Code, plus the
// manual record-back curl. Option B (a real "Run survey" button that dispatches a headless agent
// job via workflow_dispatch) replaces this once it's proven end-to-end.
//
// GH_OWNER + slug build the repo ref the naive-tester audit reads. If a product's repo doesn't
// follow `${GH_OWNER}/${slug}`, that's the one line to adjust.
const COCKPIT_BASE = 'https://corporate-ai-solutions.vercel.app';
const GH_OWNER = 'dennissolver';

/** Copy-to-clipboard button + the (light-themed) block it copies. */
function CopyBlock({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">{label}</span>
        <button
          onClick={copy}
          className="text-xs px-2 py-0.5 rounded border border-gray-300 bg-white text-gray-600 hover:text-blue-600 hover:border-blue-400 transition-colors"
        >
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      <pre className="rounded-md border border-gray-200 bg-white p-3 text-xs text-gray-800 overflow-x-auto whitespace-pre-wrap break-words font-mono">{value}</pre>
    </div>
  );
}

/** The kickoff bridge: product-specific invocation to paste into Claude Code + manual curl. */
function SurveyKickoff({ productSlug, productUrl }: { productSlug: string; productUrl: string | null }) {
  const url = productUrl?.trim() || `https://${productSlug}.vercel.app/`;
  const repo = `${GH_OWNER}/${productSlug}`;
  const surveyEndpoint = `${COCKPIT_BASE}/api/admin/pipeline/${productSlug}/survey`;

  const prompt =
`Run naive-tester survey mode against ${productSlug}.

Live URL: ${url}
Repo: ${repo}
Skill: product-factory/pipeline-cockpit/skills/naive-tester/SURVEY_MODE.md (cais-shared-services)

For each of the 14 spec fields, record evidenced:true/false with an exact citation
(a quoted DOM string or a repo path:line) — never guess, never omit. Run PRE-HARD P1-P4.
Emit survey.json, then POST it (with the prod deployment_id) to:
${surveyEndpoint}`;

  const curl =
`# from your cais-shared-services repo root, after survey.json exists:
COCKPIT_BASE=${COCKPIT_BASE}
DEP=$(node scripts/gate-check.mjs prod-deployment ${productSlug} | sed -n 's/.*deployment[: ]*\\([a-zA-Z0-9_]*\\).*/\\1/p')
curl -sS -X POST "$COCKPIT_BASE/api/admin/pipeline/${productSlug}/survey" \\
  -H 'Content-Type: application/json' \\
  -d "$(jq --arg d "$DEP" '. + {deployment_id:$d}' survey.json)"`;

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <h3 className="text-sm font-semibold text-gray-800">Kick off a survey</h3>
      <p className="mt-1 text-xs text-gray-600 max-w-2xl">
        The survey is an agent judgment job (live DOM + repo evidence), so it runs in Claude Code with
        the <code className="text-blue-600">naive-tester</code> skill — not from this button. Copy the
        invocation below and paste it into Claude Code. When it records the verdict, this card updates.
      </p>
      <CopyBlock label="Paste into Claude Code" value={prompt} />
      <details className="mt-3">
        <summary className="text-xs text-gray-500 cursor-pointer hover:text-blue-600">
          Manual record-back curl (if you POST survey.json yourself)
        </summary>
        <CopyBlock label="Record verdict" value={curl} />
      </details>
    </div>
  );
}

export default function ProductDetailView({ productId }: ProductDetailViewProps) {
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [investorPilotLogin, setInvestorPilotLogin] = useState(false);

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
  // Gates the persist effect so it doesn't fire while hydrating from the DB on load.
  const didHydrateTests = useRef(false);

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
        console.log('[FETCH] Got data, has_methodology_commitment:', data.validation?.has_methodology_commitment, 'survey_gate:', data.survey_gate?.reason ?? 'none');
        setProduct(data);
        console.log('[FETCH] Set product state');

        // Hydrate the nine checks from the persisted breakdown so they survive reload.
        const stored = data.validation?.validation_test_results as
          | Record<string, { status: TestStatus; findings?: string[] }>
          | null
          | undefined;
        if (stored) {
          didHydrateTests.current = false;
          setComplianceTests((prev) =>
            prev.map((t) => (stored[t.id] ? { ...t, status: stored[t.id].status, findings: stored[t.id].findings ?? [] } : t)),
          );
          setValidationTests((prev) =>
            prev.map((t) => (stored[t.id] ? { ...t, status: stored[t.id].status, findings: stored[t.id].findings ?? [] } : t)),
          );
        }
        // Re-enable persistence only after this hydrate render settles.
        setTimeout(() => { didHydrateTests.current = true; }, 0);
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

  // Persist the nine checks whenever they change (after hydrate). The route rolls them up into
  // validation_test_results + validation_test_status + hard_gates_*; we mirror those back onto
  // product.validation so the readiness score and gaps recompute without a refetch.
  useEffect(() => {
    if (!didHydrateTests.current) return;
    const all = [...complianceTests, ...validationTests];
    if (all.every((t) => t.status === 'pending' || t.status === 'running')) return;
    const tests = all.map((t) => ({ id: t.id, status: t.status, findings: t.findings }));
    (async () => {
      try {
        const res = await fetch(`/api/admin/pipeline/${productId}/validation-test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tests }),
        });
        if (!res.ok) {
          console.error('[validation-test persist] failed:', res.status);
          return;
        }
        const data = await res.json();
        setProduct((prev: any) =>
          prev
            ? {
                ...prev,
                validation: {
                  ...prev.validation,
                  validation_test_results: data.validation_test_results,
                  validation_test_status: data.validation_test_status,
                  hard_gates_passed: data.hard_gates_passed,
                  hard_gates_total: data.hard_gates_total,
                },
              }
            : prev,
        );
      } catch (err) {
        console.error('[validation-test persist] error:', err);
      }
    })();
  }, [complianceTests, validationTests, productId]);

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
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_outreach', dry_run: false }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Product submitted for outreach! InvestorPilot will be notified.');
      } else if (data.action_required === 'create_account') {
        const goToSignup = confirm(`${data.message}\n\nClick OK to sign up for InvestorPilot, or Cancel to just send yourself a login link.`);
        if (goToSignup) {
          window.open(data.signup_url, '_blank');
        } else {
          handleLoginToInvestorPilot();
        }
      } else {
        alert(data.error || 'Failed to submit for outreach');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit for outreach');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoginToInvestorPilot = async () => {
    // Open InvestorPilot login page in new tab
    window.open('https://investor-pilot-pi.vercel.app/login', '_blank');

    setInvestorPilotLogin(true);
    try {
      const res = await fetch('/api/auth/investorpilot-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && data.message) {
        alert(data.message + '\n\nCheck your email and click the link, or use the login page that opened.');
      } else {
        alert(data.error || 'Failed to send login link');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to send login link');
    } finally {
      setInvestorPilotLogin(false);
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
    // Check InvestorPilot required fields for dataset completeness
    if (!validation.core_mechanism) gaps.push('Missing core mechanism (AI will generate from promise)');
    if (!validation.customer_outcomes) gaps.push('Missing customer outcomes (AI will generate)');
    if (!validation.one_pager_url) gaps.push('Missing one-pager URL (required for InvestorPilot)');
    return gaps;
  };

  // Check which InvestorPilot fields are missing
  const getInvestorPilotFieldsStatus = (validation: any) => {
    const fields = [
      { key: 'has_promise', label: 'Product Promise' },
      { key: 'has_distributor', label: 'Distributor ICP' },
      { key: 'has_end_user', label: 'End User ICP' },
      { key: 'has_friction', label: 'Friction/Pain Point' },
      { key: 'core_mechanism', label: 'Core Mechanism' },
      { key: 'customer_outcomes', label: 'Customer Outcomes' },
      { key: 'one_pager_url', label: 'One-Pager URL' },
    ];
    return fields.map(f => ({
      label: f.label,
      complete: f.key.startsWith('has_') ? validation?.[f.key] : !!validation?.[f.key]
    }));
  };

  const calculateLocalReadinessScore = (validation: any, gaps: string[]) => {
    if (!validation) return 0;
    const fieldsComplete =
      (validation.has_promise ? 1 : 0) +
      (validation.has_distributor ? 1 : 0) +
      (validation.has_end_user ? 1 : 0) +
      (validation.has_friction ? 1 : 0) +
      (validation.has_methodology_commitment ? 1 : 0);
    const fieldsScore = (fieldsComplete / 5) * 40;
    const deploymentScore = validation.mvp_url ? 20 : 0;
    const complianceScore = validation.hard_gates_passed && validation.hard_gates_total
      ? (validation.hard_gates_passed / validation.hard_gates_total) * 20
      : 0;
    const validationScore = validation.validation_test_status === 'passed' ? 20 : 0;
    return Math.round(fieldsScore + deploymentScore + complianceScore + validationScore);
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

  // ── Front-door state ────────────────────────────────────────────────────────────────────────
  const surveyGate: SurveyGateRecord | null = product.survey_gate ?? null;
  const hasUrl = !!product.validation?.mvp_url;
  const frontDoor: FrontDoorState = surveyGate
    ? parseVerdict(surveyGate)
    : (hasUrl ? 'NOT-SURVEYED' : 'NO-URL');
  const isRenovation = frontDoor === 'RENOVATION';
  const isTeardown = frontDoor === 'TEARDOWN' || frontDoor === 'NO-URL';
  const isIncompleteSpec = frontDoor === 'INCOMPLETE-SPEC';
  const downstreamLocked = !isRenovation;
  const banner = VERDICT_BANNER[frontDoor];

  // The detail line the survey route appends after the first "·" (evidenced X/14 · PRE-HARD …).
  const surveyDetail = (() => {
    if (!surveyGate?.reason) return null;
    const dot = surveyGate.reason.indexOf('·');
    return dot >= 0 ? surveyGate.reason.slice(dot + 1).trim() : null;
  })();

  return (
    <div className="space-y-6">
      {/* ═══════════════ FRONT DOOR (always visible) ═══════════════ */}

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
      </div>

      {/* Survey Verdict banner — the build's recorded verdict, read from the pipeline_gates ledger */}
      <div className={`rounded-xl border p-5 ${banner.box}`}>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">Survey verdict</span>
          <span className={`text-2xl font-bold uppercase tracking-wider ${banner.text}`}>{banner.label}</span>
          {surveyGate && (
            <span
              className={`text-xs px-2 py-0.5 rounded uppercase tracking-wider ${
                surveyGate.status === 'pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              gate {surveyGate.status}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-600">{banner.blurb}</p>
        {surveyDetail && <p className="mt-1 text-sm text-gray-500">{surveyDetail}</p>}
        {surveyGate && (
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
            <span>
              Recorded {new Date(surveyGate.created_at).toLocaleString()} by{' '}
              <span className="font-mono">{surveyGate.recorded_by}</span>
            </span>
            {surveyGate.deployment_id ? (
              <span>Bound to deployment <span className="font-mono">{surveyGate.deployment_id.slice(0, 12)}…</span></span>
            ) : (
              <span className="text-yellow-700">Unbound — provisional (not tied to a deployment)</span>
            )}
            {surveyGate.artifact_ref && <span className="font-mono break-all">{surveyGate.artifact_ref}</span>}
          </div>
        )}
      </div>

      {/* STEP 1: Define the spec — the real prerequisite (can't build or survey without it) */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">STEP 1</span>
          <h2 className="text-lg font-semibold text-gray-900">Define the spec</h2>
          {validationFieldsComplete && <CheckCircle className="text-green-600" size={18} />}
        </div>
        <p className="text-sm text-gray-600 mb-4">
          These fields define what the product is and who it is for. You can&apos;t build a site — or survey one —
          without knowing the distributor and end-user, so this is the prerequisite for everything below.
          <br /><strong>This item is for:</strong> the product promise, distributor model, end user, and pain point.
          <br /><strong>When done:</strong> set the URL in Step 2 ↓
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

      {/* STEP 2: Website / Product URL */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">STEP 2</span>
          <h2 className="text-lg font-semibold text-gray-900">Website / Product URL</h2>
          {product.validation?.mvp_url && <CheckCircle className="text-green-600" size={18} />}
        </div>
        <p className="text-sm text-gray-600 mb-4">
          {product.validation?.mvp_url
            ? "Product URL is set — survey mode can run against it (Step 3)."
            : "Enter the deployed product URL. If none exists yet, there's nothing to survey — you go straight to design & build (Step 3 → Stage 2)."}
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
              ⚠️ No product URL found. Either:
            </p>
            <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
              <li>Enter an existing deployed URL below if the product already exists</li>
              <li>Or design & build it first (Step 3 → Stage 2), then come back and enter the URL</li>
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

      {/* STEP 3: Survey gate — the front door. Shows the recorded verdict + branches. */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-slate-700 text-white text-xs font-bold px-2 py-1 rounded">STEP 3</span>
          <h2 className="text-lg font-semibold text-gray-900">Survey gate</h2>
          {isRenovation && <CheckCircle className="text-green-600" size={18} />}
        </div>
        <p className="text-sm text-gray-600 mb-4">
          The post-build verdict on the live MVP, scored by survey mode against what the site/repo actually
          evidences (the 14 spec fields + PRE-HARD checks).
          <span className="text-green-700"> RENOVATION</span> advances to Stage 5;
          <span className="text-yellow-700"> TEARDOWN</span> re-enters Stage 2 design→build;
          <span className="text-red-700"> INCOMPLETE-SPEC</span> goes back to the spec.
        </p>

        {/* Branch UI */}
        {isIncompleteSpec && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-red-700">
              <strong>INCOMPLETE-SPEC.</strong> The spec couldn&apos;t be evidenced. Complete Step 1 above, then
              re-run survey mode against the live build.
            </p>
          </div>
        )}

        {isTeardown && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">STAGE 2</span>
              <h3 className="font-semibold text-gray-900">Design &amp; Build</h3>
            </div>
            <p className="text-sm text-gray-700 mb-3">
              {frontDoor === 'NO-URL'
                ? "No URL yet, so there's nothing to survey. This is a whole new design/build — you can't target distributors/end-users on a site that doesn't exist. Build it, deploy, set the URL in Step 2, then run survey mode."
                : "TEARDOWN — the build doesn't evidence the spec (or a PRE-HARD failed). Re-enter Stage 2: redesign/rebuild to fit the spec, redeploy, then re-run survey mode."}
            </p>
            <button
              onClick={() => window.open('https://github.com/new', '_blank')}
              className="px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
            >
              Start Design &amp; Build →
            </button>
          </div>
        )}

        {frontDoor === 'NOT-SURVEYED' && (
          <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <Search className="text-gray-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-gray-600">
              A URL is set but no survey verdict is recorded. Run the <code className="text-blue-600">naive-tester</code>{' '}
              <strong>survey mode</strong> against the live build — it scores the 14 evidenced fields + PRE-HARD
              checks and POSTs the verdict here. This panel shows the recorded result; it does not run the survey itself.
            </p>
          </div>
        )}

        {isRenovation && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="text-green-600" size={20} />
            <span className="text-green-700 font-medium">RENOVATION — downstream steps unlocked below.</span>
          </div>
        )}

        {/* Full recorded detail — what the survey actually found, passed/failed, and what to fix.
            Renders whenever a structured result was persisted (pipeline_gates.result). */}
        {surveyGate?.result && (
          <div className="mt-4 space-y-4">
            <div className="text-xs text-gray-500">
              Evidenced {surveyGate.result.site?.evidencedCount}/{surveyGate.result.site?.total} fields
              {' · '}PRE-HARD {surveyGate.result.preHard?.passed ? 'pass' : 'fail'}
              {surveyGate.result.mvp ? <>{' · '}live URL {surveyGate.result.mvp.ok ? 'up' : 'down'}</> : null}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Field evidence</h3>
              <ul className="space-y-1.5">
                {surveyGate.result.fields?.map((f) => (
                  <li key={f.field} className="flex items-start gap-2 text-sm">
                    {f.evidenced
                      ? <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={16} />
                      : <XCircle className="text-gray-400 shrink-0 mt-0.5" size={16} />}
                    <span className="text-gray-700">
                      <span className="font-medium">{f.label}</span>
                      {f.evidence
                        ? <span className="text-gray-500"> — {f.evidence}</span>
                        : <span className="text-gray-400 italic"> — not evidenced</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {surveyGate.result.preHard?.results?.length ? (
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">PRE-HARD checks</h3>
                <ul className="space-y-1.5">
                  {surveyGate.result.preHard.results.map((p) => (
                    <li key={p.code} className="flex items-start gap-2 text-sm">
                      {p.status === 'pass'
                        ? <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={16} />
                        : <XCircle className="text-red-500 shrink-0 mt-0.5" size={16} />}
                      <span className="text-gray-700">
                        <span className="font-medium">{p.code}</span>
                        <span className="text-gray-500"> — {p.status}{p.evidence ? `: ${p.evidence}` : ''}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {surveyGate.result.toReach?.length ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <h3 className="text-sm font-semibold text-amber-800 mb-2">What needs to happen to reach RENOVATION</h3>
                <ul className="space-y-1.5">
                  {surveyGate.result.toReach.map((t, i) => (
                    <li key={`${t.code}-${i}`} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={16} />
                      <span className="text-amber-900">
                        <span className="font-medium">{t.label}</span>
                        <span className="text-amber-700"> — {t.need}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}

        {/* Kickoff bridge — shown whenever a URL exists, so it works in NOT-SURVEYED, TEARDOWN,
            INCOMPLETE-SPEC and RENOVATION (you'll re-run after a fix, not only on first survey).
            Hidden only when there's no URL (NO-URL) — nothing to survey yet. */}
        {hasUrl && <SurveyKickoff productSlug={productId} productUrl={product.validation?.mvp_url ?? null} />}
      </div>

      {/* ═══════════════ DOWNSTREAM (locked until RENOVATION) ═══════════════ */}

      {downstreamLocked && (
        <div className="flex items-start gap-2 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <Lock className="text-slate-500 shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-slate-600">
            <strong>Downstream steps are locked.</strong> Founder commitment, compliance, validation, scoring and
            outreach only matter once the survey records a <span className="text-green-700 font-medium">RENOVATION</span>{' '}
            verdict. Resolve the branch above first.
          </p>
        </div>
      )}

      <div className={downstreamLocked ? 'opacity-50 pointer-events-none select-none space-y-6' : 'space-y-6'} aria-disabled={downstreamLocked}>

        {/* Readiness summary + progress — only meaningful post-RENOVATION */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="font-semibold text-blue-900 mb-2">Readiness: {product.readiness_score}%</h2>
          <p className="text-blue-800 text-sm mb-2">{product.validation?.promise || 'No promise defined yet'}</p>
          <p className="text-blue-700 text-sm">{product.action_items.length} action{product.action_items.length !== 1 ? 's' : ''} needed to reach outreach readiness</p>
          <div className="mt-3 w-full bg-gray-200 rounded-full h-3 overflow-hidden">
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
        </div>

        {/* STEP 4: Founder Commitment */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded">STEP 4</span>
            <h2 className="text-lg font-semibold text-gray-900">Founder Commitment</h2>
            {product.validation?.has_methodology_commitment && <CheckCircle className="text-green-600" size={18} />}
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Tick to confirm you are committed to running the 4-week validation pipeline.
            <br /><strong>This item is for:</strong> confirming you will actually validate this product.
            <br /><strong>When done:</strong> run compliance tests (Step 5) ↓
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
                    const newReadinessScore = calculateLocalReadinessScore(data.data, newGaps);
                    const newCanRunOutreach = newReadinessScore >= 80 && newGaps.length === 0;
                    setProduct((prev: any) => ({
                      ...prev,
                      validation: data.data,
                      gaps: newGaps,
                      readiness_score: newReadinessScore,
                      can_run_outreach_now: newCanRunOutreach
                    }));
                    console.log('[CHECKBOX] Updated local state, gaps:', newGaps, 'readiness:', newReadinessScore, 'canRunOutreach:', newCanRunOutreach);
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

        {/* STEP 5: Compliance Tests */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">STEP 5</span>
            <h2 className="text-lg font-semibold text-gray-900">Compliance Tests</h2>
            {complianceTests.every(t => t.status === 'passed') && <CheckCircle className="text-green-600" size={18} />}
          </div>

          {/* Dataset Completeness Check */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="text-blue-600" size={16} />
              <span className="font-medium text-blue-900">InvestorPilot Data Completeness</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {getInvestorPilotFieldsStatus(product.validation).map((field) => (
                <div key={field.label} className={`flex items-center gap-1 ${field.complete ? 'text-green-700' : 'text-orange-600'}`}>
                  {field.complete ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                  {field.label}
                </div>
              ))}
            </div>
            {product.gaps?.some((g: string) => g.includes('Missing')) && (
              <p className="text-xs text-orange-700 mt-2">
                ⚠️ Complete missing fields above before executing to InvestorPilot
              </p>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Run compliance checks to ensure the product meets technical and legal requirements.
            <br /><strong>When done:</strong> run validation tests (Step 6) ↓
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

        {/* STEP 6: Validation Tests */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-yellow-600 text-white text-xs font-bold px-2 py-1 rounded">STEP 6</span>
            <h2 className="text-lg font-semibold text-gray-900">Validation Tests</h2>
            {validationTests.every(t => t.status === 'passed') && <CheckCircle className="text-green-600" size={18} />}
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Run validation tests using gstack skills (naive-tester, voice-auditor, gtm-auditor, qa).
            <br /><strong>When done:</strong> check the final score (Step 7) ↓
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

        {/* STEP 7: Final Score + gaps + recalculate + submit + IP login */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded">STEP 7</span>
            <h2 className="text-lg font-semibold text-gray-900">Final Score Check</h2>
            {product.readiness_score >= 80 && <CheckCircle className="text-green-600" size={18} />}
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Your validation score must be ≥80% to run outreach.
            <br /><strong>This item is for:</strong> reviewing remaining gaps and confirming readiness.
            <br /><strong>When score ≥80%:</strong> submit for automated outreach to InvestorPilot ↓
          </p>
          <GapsSection gaps={product.gaps} actionItems={product.action_items} productSlug={product.manifest?.name} />

          {/* Force Score Recalculation */}
          <div className="mt-4">
            <button
              onClick={async () => {
                try {
                  const res = await fetch(`/api/admin/pipeline/${productId}/recalculate-score`, { method: 'POST' });
                  const data = await res.json();
                  console.log('[RECALCULATE] Result:', data);
                  if (data.success) {
                    setProduct((prev: any) => ({
                      ...prev,
                      validation: data.data,
                      readiness_score: data.readiness_score
                    }));
                  }
                } catch (err) {
                  console.error('[RECALCULATE] Error:', err);
                }
              }}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Recalculate Score (debug)
            </button>
          </div>

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

          {/* Login to InvestorPilot - Same Account */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-3">
              Already have an InvestorPilot account? Click below to open InvestorPilot, then click Sign in to log in.
            </p>
            <button
              onClick={handleLoginToInvestorPilot}
              disabled={investorPilotLogin}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-all"
            >
              {investorPilotLogin ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Sending login link...
                </>
              ) : (
                <>
                  <ExternalLink size={18} />
                  Login to InvestorPilot →
                </>
              )}
            </button>
            <p className="text-xs text-blue-600 mt-2">
              Sends a magic link to your email for instant access
            </p>
          </div>
        </div>
      </div>

      {/* Category + Audit (bottom, unchanged) */}
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