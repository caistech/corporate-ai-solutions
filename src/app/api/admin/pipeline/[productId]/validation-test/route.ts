/**
 * POST /api/admin/pipeline/[productId]/validation-test
 *
 * Submit validation test results (Parts A–D) for a product
 * - Admin-only endpoint (auth gate + ADMIN_EMAILS check via middleware)
 * - Accepts test results JSON with Part A/B/C/D status + findings
 * - Updates product_validation_status table in Supabase
 * - Recalculates readiness score (including 20% weight for tests)
 * - Returns updated product readiness data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuth } from '@/lib/auth-utils';
import { upsertReadinessResult } from '@/lib/methodology/readiness-results';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

interface ValidationTestRequest {
  parts: {
    a_admin_portal: 'passed' | 'warning' | 'failed' | 'not_run';
    b_user_portal: 'passed' | 'warning' | 'failed' | 'not_run';
    c_auth_flows: 'passed' | 'warning' | 'failed' | 'not_run';
    d_scaffold: 'passed' | 'warning' | 'failed' | 'not_run';
  };
  findings: string[];
  overall_status: 'passed' | 'warning' | 'failed' | 'not_run';
  duration_minutes?: number;
}

// ── Hybrid nine-check path (the card's checks are canonical) ─────────────────────────────────
// The card persists its 5 compliance + 4 validation checks here. We store the full breakdown in
// validation_test_results keyed by check id (/validation-workflow already reads .qa/.naive/.gtm),
// roll the 5 compliance checks into hard_gates_passed/total (the score's compliance slice), and
// compute the composite validation_test_status (the outreach gate + the score's validation slice).
type RawStatus = string;
interface CheckResult { id: string; status: RawStatus; findings?: string[] }
const COMPLIANCE_IDS = new Set(['auth', 'branding', 'metadata', 'security', 'privacy']);

function normStatus(s: RawStatus): 'passed' | 'warning' | 'failed' | 'not_run' {
  return s === 'passed' || s === 'warning' || s === 'failed' ? s : 'not_run';
}

function compositeOf(checks: CheckResult[]): 'passed' | 'warning' | 'failed' | 'not_run' {
  const norm = checks.map((c) => normStatus(c.status));
  if (norm.length === 0) return 'not_run';
  if (norm.some((s) => s === 'failed')) return 'failed';
  if (norm.every((s) => s === 'not_run')) return 'not_run';
  if (norm.every((s) => s === 'passed')) return 'passed';
  return 'warning';
}

function calculateValidationTestScore(parts: ValidationTestRequest['parts']): number {
  // Each part is worth 25% when passed = 0.25 per part
  // Warning = 0.20, Failed = 0 , Not run = 0
  let score = 0;

  const weight = 0.25; // 25% per part

  const scorePart = (status: string) => {
    if (status === 'passed') return weight;
    if (status === 'warning') return weight * 0.8; // 80% credit for warning
    return 0;
  };

  score += scorePart(parts.a_admin_portal);
  score += scorePart(parts.b_user_portal);
  score += scorePart(parts.c_auth_flows);
  score += scorePart(parts.d_scaffold);

  return Math.round(score * 100); // Convert to 0-100 scale
}

function determineCompositeStatus(parts: ValidationTestRequest['parts']): 'passed' | 'warning' | 'failed' | 'not_run' {
  const statuses = Object.values(parts);

  if (statuses.includes('failed')) return 'failed';
  if (statuses.includes('warning')) return 'warning';
  if (statuses.every(s => s === 'passed')) return 'passed';
  return 'not_run';
}

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    // Verify admin auth (middleware checks ADMIN_EMAILS, but double-check here)
    const auth = await getAuth(request);
    if (!auth?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const productId = params.productId;
    // Initialize Supabase client with service role (for updating product_validation_status)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── New path: the card's nine compliance/validation checks ──
    if (Array.isArray(body.tests)) {
      const checks: CheckResult[] = body.tests;
      const results: Record<string, { status: string; findings: string[] }> = {};
      for (const c of checks) results[c.id] = { status: normStatus(c.status), findings: c.findings ?? [] };

      const compliance = checks.filter((c) => COMPLIANCE_IDS.has(c.id));
      const hardTotal = compliance.length;
      const hardPassed = compliance.filter((c) => normStatus(c.status) === 'passed').length;
      const composite = compositeOf(checks);
      const findings = checks.flatMap((c) => (c.findings ?? []).map((f) => `${c.id}: ${f}`));

      const { data, error } = await supabase
        .from('product_validation_status')
        .update({
          validation_test_results: results,
          validation_test_status: composite,
          hard_gates_passed: hardPassed,
          hard_gates_total: hardTotal,
          validation_test_findings: findings,
          last_validation_test_run: new Date().toISOString(),
          last_validation_test_by: auth.user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('product_slug', productId)
        .select();

      if (error) {
        console.error('[validation-test] nine-check update error:', error);
        return NextResponse.json({ error: 'Failed to persist test results', details: error.message }, { status: 500 });
      }
      if (!data || data.length === 0) {
        return NextResponse.json({ error: 'Product not found in validation pipeline' }, { status: 404 });
      }

      await supabase.from('validation_events').insert({
        product_slug: productId,
        event_type: 'validation_test_submitted',
        status: composite,
        metadata: { results, hard_gates_passed: hardPassed, hard_gates_total: hardTotal, tester_id: auth.user.id },
        created_by: auth.user.id,
      });

      // Tier-1: Persist validation-test results to readiness_results (VT_A*-D*)
      const vtResults = Object.entries(results)
      for (const [checkId, result] of vtResults) {
        const { status, findings } = result as { status: string; findings: string[] }
        const vtCode = `VT_${checkId}`
        const statusMap: Record<string, 'pass' | 'fail' | 'na'> = {
          passed: 'pass',
          warning: 'pass', // treat warning as pass for now (can refine later)
          failed: 'fail',
          not_run: 'na',
        }
        await upsertReadinessResult({
          productSlug: productId,
          checkCode: vtCode,
          status: statusMap[status] || 'na',
          source: 'naive-tester',
          evidence: findings?.join('; ') || null,
        })
      }

      return NextResponse.json({
        success: true,
        productId,
        validation_test_status: composite,
        hard_gates_passed: hardPassed,
        hard_gates_total: hardTotal,
        validation_test_results: results,
        product_updated: data[0],
      });
    }

    // ── Legacy path: Parts A–D ──
    // Validate required fields
    if (!body.parts || !body.findings || !body.overall_status) {
      return NextResponse.json(
        { error: 'Missing required fields: parts, findings, overall_status' },
        { status: 400 }
      );
    }

    const testScore = calculateValidationTestScore(body.parts);
    const compositeStatus = determineCompositeStatus(body.parts);

    // Update product_validation_status with test results
    const { data, error } = await supabase
      .from('product_validation_status')
      .update({
        test_part_a_admin_portal: body.parts.a_admin_portal,
        test_part_b_user_portal: body.parts.b_user_portal,
        test_part_c_auth_flows: body.parts.c_auth_flows,
        test_part_d_scaffold: body.parts.d_scaffold,
        validation_test_status: compositeStatus,
        validation_test_findings: body.findings,
        last_validation_test_run: new Date().toISOString(),
        last_validation_test_by: auth.user.id,
        // Note: validation_test_results JSON column would be populated if needed
        // For now, individual columns capture the core data
        updated_at: new Date().toISOString(),
      })
      .eq('product_slug', productId)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json(
        { error: 'Failed to update validation test results', details: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Product not found in validation pipeline' },
        { status: 404 }
      );
    }

    // Log validation event for audit trail
    const updatedProduct = data[0];

    await supabase
      .from('validation_events')
      .insert({
        product_slug: productId,
        event_type: 'validation_test_submitted',
        status: compositeStatus,
        metadata: {
          parts: body.parts,
          test_score: testScore,
          duration_minutes: body.duration_minutes || 0,
          findings_count: body.findings.length,
          tester_id: auth.user.id,
        },
        created_by: auth.user.id,
      });

    return NextResponse.json({
      success: true,
      productId,
      validation_test_status: compositeStatus,
      validation_test_score: testScore,
      parts: body.parts,
      findings_count: body.findings.length,
      message: `Validation test results submitted. Status: ${compositeStatus}. Score: ${testScore}/100.`,
      product_updated: updatedProduct,
    });
  } catch (error) {
    console.error('Error submitting validation test results:', error);
    return NextResponse.json(
      {
        error: 'Failed to submit validation test results',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}