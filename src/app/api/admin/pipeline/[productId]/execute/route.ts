/**
 * POST /api/admin/pipeline/[productId]/execute
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import crypto from 'crypto';

function generateProductPitch(
  promise: string | null,
  coreMechanism: string | null,
  customerOutcomes: string | null
): string {
  const parts: string[] = [];

  if (promise) {
    parts.push(`We solve: ${promise}`);
  }

  if (coreMechanism) {
    parts.push(`Our approach: ${coreMechanism}`);
  }

  if (customerOutcomes) {
    parts.push(`Clients get: ${customerOutcomes}`);
  }

  return parts.join(' | ');
}

function getServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getAuthClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
      },
    }
  );
}

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
  { params }: { params: Promise<{ productId: string }> }
) {
  console.log('[execute] BEFORE PARAMS');
  const resolvedParams = await params;
  console.log('[execute] raw params:', JSON.stringify(resolvedParams));
  const productId = resolvedParams.productId;
  console.log('[execute] extracted productId:', productId);
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

    const authClient = getAuthClient();
    console.log('[execute] Getting user from auth...');
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    console.log('[execute] Auth result:', { userId: user?.id, email: user?.email, authError: authError?.message });
    
    if (authError || !user?.email) {
      console.log('[execute] AUTH FAILED - returning 401');
      return NextResponse.json({ error: 'Unauthorized - must be logged in' }, { status: 401 });
    }
    
    const submitterEmail = user.email;
    console.log('[execute] Logged in user email:', submitterEmail);

    console.log('[execute] Fetching product from DB...');
    const supabase = getDbClient();
    
    // Get user's organisation from Pipeline's DB
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_organisation_id')
      .eq('id', user.id)
      .single();
    
    const organisationId = profile?.active_organisation_id;
    console.log('[execute] User org ID:', organisationId);

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

    // Generate product_pitch from promise + core_mechanism + customer_outcomes
    const productPitch = generateProductPitch(
      product.promise,
      product.core_mechanism,
      product.customer_outcomes
    );

    const outreachPayload = {
      product_id: productId,
      product_name: product.display_name,
      promise: product.promise,
      distributor_target: product.distributor,
      end_user: product.end_user,
      friction: product.friction,
      // Additional fields for InvestorPilot
      product_pitch: productPitch,
      core_mechanism: product.core_mechanism || null,
      distributor_outcomes: product.distributor_outcomes || null,
      end_user_outcomes: product.end_user_outcomes || null,
      icp_company_size: product.icp_company_size || null,
      icp_stage: product.icp_stage || null,
      icp_verticals: product.icp_verticals || null,
      icp_geography: product.icp_geography || null,
      one_pager_url: product.mvp_url || null,
      pitch_deck_url: product.pitch_deck_url || null,
      partner_types: product.partner_types || 'referral',
      // Validation scores
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
          product_pitch: productPitch,
          distributor_pitch: null,
          core_mechanism: product.core_mechanism || null,
          distributor_outcomes: product.distributor_outcomes || null,
          end_user_outcomes: product.end_user_outcomes || null,
          icp_company_size: product.icp_company_size || null,
          icp_stage: product.icp_stage || null,
          icp_verticals: product.icp_verticals || null,
          target_verticals: product.icp_verticals || null, // receiving insert reads this key
          icp_geography: product.icp_geography || null,
          one_pager_url: product.mvp_url || null,
          pitch_deck_url: product.pitch_deck_url || null,
          partner_types: product.partner_types || 'referral',
          regulated_flag: product.regulated_flag ?? false,
          cta_spec: {
              destination: `${process.env.NEXT_PUBLIC_SITE_URL}/products/${productId}`,
              events: ['click'],
          },
          validation_summary: {
              hard_gates_passed: product.hard_gates_passed,
              weighted_score: product.weighted_score_percent,
              gates_ready: product.gate1_ready,
          },
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
