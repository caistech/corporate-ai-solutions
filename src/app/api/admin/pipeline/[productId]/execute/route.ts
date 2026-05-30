/**
 * POST /api/admin/pipeline/[productId]/execute
 *
 * Mark product as ready and prepare for outreach
 * Phase 2: Dry-run mode (no actual outreach)
 * Phase 6: Will integrate with InvestorPilot API
 *
 * Does:
 * 1. Verify all gates passed + all fields filled (readiness ≥80%)
 * 2. Mark as "committed to pipeline"
 * 3. Log execution event
 * 4. Return what WOULD be sent (dry-run)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUserEmail(): Promise<string | null> {
  const cookieStore = cookies();
  const supabaseServer = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set() {},
        remove() {},
      },
    },
  );
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user?.email) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single();
  return profile?.email || user.email;
}

function extractVerticals(distributorText: string | null): string | null {
  if (!distributorText) return null;
  const verticals = ['construction', 'manufacturing', 'logistics', 'healthcare', 'finance', 'retail', 'technology', 'real estate', 'education', 'government'];
  const found = verticals.filter(v => distributorText.toLowerCase().includes(v));
  return found.length > 0 ? found.join(', ') : null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = params.productId;
    const body = await request.json();
    const dryRun = body.dry_run !== false; // Default to dry-run

    // Check authentication first
    const submitterEmail = await getUserEmail();
    if (!submitterEmail) {
      return NextResponse.json(
        { error: 'Must be logged in to submit for outreach', requires_login: true },
        { status: 401 }
      );
    }

    // Fetch current product
    const { data: product, error: fetchError } = await supabase
      .from('product_validation_status')
      .select('*')
      .eq('product_slug', productId)
      .single();

    if (fetchError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check readiness
    if ((product.weighted_score_percent || 0) < 80) {
      return NextResponse.json(
        {
          error: 'Not ready for execution',
          reason: `Weighted score ${product.weighted_score_percent}% < 80% required`,
          readiness_score: product.weighted_score_percent,
        },
        { status: 400 }
      );
    }

    // Check all fields filled
    const gaps = [];
    if (!product.has_promise) gaps.push('promise');
    if (!product.has_distributor) gaps.push('distributor');
    if (!product.has_end_user) gaps.push('end_user');
    if (!product.has_friction) gaps.push('friction');
    if (!product.has_methodology_commitment) gaps.push('methodology_commitment');

    if (gaps.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot execute with gaps',
          missing_fields: gaps,
        },
        { status: 400 }
      );
    }

    // Build outreach payload (what would be sent to InvestorPilot)
    const outreachPayload = {
      product_id: productId,
      product_name: product.display_name,
      promise: product.promise,
      distributor_target: product.distributor,
      end_user: product.end_user,
      friction: product.friction,
      validation_summary: {
        hard_gates_passed: product.hard_gates_passed,
        weighted_score: product.weighted_score_percent,
        gates_ready: product.gate1_ready,
      },
      timestamp: new Date().toISOString(),
    };

    if (dryRun) {
      // Dry-run: Don't actually execute, just show what would happen
      return NextResponse.json({
        success: true,
        mode: 'DRY_RUN',
        message: 'Ready to execute (dry-run mode)',
        would_execute: outreachPayload,
        next_step: 'Call with dry_run: false to actually execute',
        note: 'Phase 6 will wire this to InvestorPilot API',
      });
    }

    // Check if user has InvestorPilot access (is org member)
    const investorPilotSupabase = createClient(
      process.env.INVESTORPILOT_SUPABASE_URL!,
      process.env.INVESTORPILOT_SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: membership } = await investorPilotSupabase
      .from('memberships')
      .select('id, profiles!inner(email)')
      .eq('profiles.email', submitterEmail.toLowerCase())
      .limit(1)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        {
          error: 'InvestorPilot account required',
          message: 'You need an InvestorPilot account to submit products for outreach.',
          action_required: 'create_account',
          signup_url: process.env.NEXT_PUBLIC_INVESTORPILOT_URL + '/signup',
          login_url: process.env.NEXT_PUBLIC_INVESTORPILOT_URL + '/login',
        },
        { status: 403 }
      );
    }

    // Real execution: Send to InvestorPilot
    const investorPilotUrl = process.env.INVESTORPILOT_WEBHOOK_URL;
    const webhookSecret = process.env.PIPELINE_INTAKE_WEBHOOK_SECRET;
    console.log('[execute] INVESTORPILOT_WEBHOOK_URL:', investorPilotUrl ? 'SET' : 'NOT SET');
    console.log('[execute] PIPELINE_INTAKE_WEBHOOK_SECRET:', webhookSecret ? 'SET' : 'NOT SET');

    if (!investorPilotUrl) {
      console.warn('[execute] INVESTORPILOT_WEBHOOK_URL not set, skipping webhook');
    } else {
      const webhookPayload = {
        product_id: productId,
        product_name: product.display_name,
        description: product.promise,
        landing_page_url: `${process.env.NEXT_PUBLIC_SITE_URL}/products/${productId}`,
        distributor_icp: product.distributor,
        distributor_pitch: product.pitch || null,
        end_user_icp: product.end_user,
        friction: product.friction,
        customer_outcomes: product.promise,
        core_mechanism: product.promise,
        target_verticals: product.distributor ? extractVerticals(product.distributor) : null,
        regulated_flag: product.regulated || false,
        cta_spec: {
          destination: `${process.env.NEXT_PUBLIC_SITE_URL}/products/${productId}`,
          events: ['cta_click', 'form_submit'],
        },
        validation_summary: {
          hard_gates_passed: product.hard_gates_passed,
          weighted_score: product.weighted_score_percent,
          gates_ready: product.gate1_ready,
        },
        timestamp: new Date().toISOString(),
        // New ICP fields for tight targeting
        icp_company_size: product.icp_company_size || null,
        icp_stage: product.icp_stage || null,
        icp_buyer_title: product.icp_buyer_title || null,
        icp_user_title: product.icp_user_title || null,
        icp_stack_tools: product.icp_stack_tools || null,
        traction_arr: product.traction_arr || null,
        traction_customers: product.traction_customers || null,
        // Email verification - tied to submitter's account
        submitter_email: submitterEmail.toLowerCase(),
      };

      const webhookBody = JSON.stringify(webhookPayload);
      const webhookSecret = process.env.PIPELINE_INTAKE_WEBHOOK_SECRET;
      const hmacSignature = webhookSecret
        ? `sha256=${crypto.createHmac('sha256', webhookSecret).update(webhookBody).digest('hex')}`
        : null;

      const webhookResponse = await fetch(investorPilotUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(hmacSignature && { 'x-pipeline-signature': hmacSignature }),
        },
        body: webhookBody,
      });

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        console.error('[execute] InvestorPilot webhook failed:', webhookResponse.status, errorText);
        throw new Error(`InvestorPilot webhook failed: ${webhookResponse.status}`);
      }

      console.log('[execute] Sent to InvestorPilot:', webhookPayload.product_id);
    }
    const { error: updateError } = await supabase
      .from('product_validation_status')
      .update({
        has_methodology_commitment: true,
      })
      .eq('product_slug', productId);

    if (updateError) {
      throw updateError;
    }

    // Log execution event
    await supabase.from('validation_events').insert({
      product_slug: productId,
      event_type: 'pipeline_executed',
      field_name: 'execution',
      new_value: JSON.stringify(outreachPayload),
      actor_type: 'admin',
      actor_id: null,
      reason: 'Executed pipeline (Phase 2)',
      context_data: {
        dry_run: false,
        payload: outreachPayload,
      },
    });

    return NextResponse.json({
      success: true,
      mode: 'EXECUTED',
      message: `Pipeline executed for ${productId}`,
      executed_payload: outreachPayload,
      note: 'Phase 6 will send this to InvestorPilot for actual outreach',
    });
  } catch (error) {
    console.error('Error executing pipeline:', error);
    return NextResponse.json(
      {
        error: 'Failed to execute pipeline',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
