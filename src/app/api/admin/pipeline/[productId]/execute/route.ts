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
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = params.productId;
    const body = await request.json();
    const dryRun = body.dry_run !== false; // Default to dry-run

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

    // Real execution: Send to InvestorPilot
    const investorPilotUrl = process.env.INVESTORPILOT_WEBHOOK_URL;
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
      };

      const webhookResponse = await fetch(investorPilotUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
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
