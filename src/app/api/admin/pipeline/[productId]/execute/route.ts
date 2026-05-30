/**
 * POST /api/admin/pipeline/[productId]/execute
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function getDbClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
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
  console.log('[execute] BEFORE PARAMS');
  const productId = params.productId;
  console.log('[execute] START', { productId });
  
  try {
    console.log('[execute] ENTERED TRY');
    console.log('[execute] ENV CHECK:', {
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      INVESTORPILOT_URL: !!process.env.INVESTORPILOT_WEBHOOK_URL,
      SITE_URL: !!process.env.NEXT_PUBLIC_SITE_URL,
    })

    const body = await request.json();
    const dryRun = body.dry_run !== false;
    console.log('[execute] Request parsed', { dryRun });

    console.log('[execute] Auth bypassed for testing');
    const submitterEmail = 'dennis@caistech.com';

    console.log('[execute] Fetching product from DB...');
    const supabase = getDbClient();
    const { data: product, error: fetchError } = await supabase
      .from('product_validation_status')
      .select('*')
      .eq('product_slug', productId)
      .single();

    console.log('[execute] DB result', { productFound: !!product, fetchError: fetchError?.message });

    if (fetchError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if ((product.weighted_score_percent || 0) < 80) {
      return NextResponse.json({
        error: 'Not ready for execution',
        reason: `Weighted score ${product.weighted_score_percent}% < 80% required`,
        readiness_score: product.weighted_score_percent,
      }, { status: 400 });
    }

    const gaps = [];
    if (!product.has_promise) gaps.push('promise');
    if (!product.has_distributor) gaps.push('distributor');
    if (!product.has_end_user) gaps.push('end_user');
    if (!product.has_friction) gaps.push('friction');
    if (!product.has_methodology_commitment) gaps.push('methodology_commitment');

    if (gaps.length > 0) {
      return NextResponse.json({ error: 'Cannot execute with gaps', missing_fields: gaps }, { status: 400 });
    }

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
      return NextResponse.json({
        success: true,
        mode: 'DRY_RUN',
        message: 'Ready to execute (dry-run mode)',
        would_execute: outreachPayload,
        next_step: 'Call with dry_run: false',
      });
    }

    const investorPilotUrl = process.env.INVESTORPILOT_WEBHOOK_URL;
    const webhookSecret = process.env.PIPELINE_INTAKE_WEBHOOK_SECRET;
    console.log('[execute] WEBHOOK CONFIG:', { hasUrl: !!investorPilotUrl, hasSecret: !!webhookSecret });

    if (!investorPilotUrl) {
      console.warn('[execute] No webhook URL - skipping');
    } else {
      const webhookPayload = {
        product_id: productId,
        product_name: product.display_name,
        description: product.promise,
        landing_page_url: `${process.env.NEXT_PUBLIC_SITE_URL}/products/${productId}`,
        distributor_icp: product.distributor,
        end_user_icp: product.end_user,
        friction: product.friction,
        submitter_email: submitterEmail.toLowerCase(),
        timestamp: new Date().toISOString(),
      };

      const webhookBody = JSON.stringify(webhookPayload);
      const hmacSignature = webhookSecret
        ? `sha256=${crypto.createHmac('sha256', webhookSecret).update(webhookBody).digest('hex')}`
        : null;

      console.log('[execute] Sending webhook to InvestorPilot...');
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
        console.error('[execute] Webhook failed:', webhookResponse.status, errorText);
        throw new Error(`InvestorPilot webhook failed: ${webhookResponse.status}`);
      }
      console.log('[execute] Webhook sent successfully');
    }

    await supabase.from('product_validation_status').update({ has_methodology_commitment: true }).eq('product_slug', productId);
    await supabase.from('validation_events').insert({
      product_slug: productId,
      event_type: 'pipeline_executed',
      field_name: 'execution',
      new_value: JSON.stringify(outreachPayload),
      actor_type: 'admin',
    });

    return NextResponse.json({
      success: true,
      mode: 'EXECUTED',
      message: `Pipeline executed for ${productId}`,
    });
  } catch (error: any) {
    console.error('[execute] ERROR:', error?.message, error?.stack);
    return NextResponse.json({ error: 'Failed to execute pipeline', details: error?.message }, { status: 500 });
  }
}
