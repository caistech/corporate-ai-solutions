/**
 * GET /api/admin/pipeline/[productId]
 *
 * Fetch detailed validation status for a single product
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProductPipeline } from '@/lib/portfolio-scanner';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  console.log('[GET] ========== START GET PRODUCT ==========');
  try {
    const productId = params.productId;
    console.log('[GET] productId:', productId);

    console.log('[GET] Calling getProductPipeline...');
    const product = await getProductPipeline(productId);
    console.log('[GET] getProductPipeline result:', { found: !!product, name: product?.manifest?.name });

    if (!product) {
      console.log('[GET] Product not found');
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Direct exact-match query for fresh validation data
    console.log('[GET] Creating Supabase client...');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('[GET] Querying product_validation_status for product_slug:', productId);

    // First do a raw count query to see what's in the table
    const { count } = await supabase
      .from('product_validation_status')
      .select('*', { count: 'exact', head: true })
      .eq('product_slug', productId);
    console.log('[GET] Row count for', productId, ':', count);

    const { data: freshValidation, error: freshError } = await supabase
      .from('product_validation_status')
      .select('*')
      .eq('product_slug', productId)
      .single();

    console.log('[GET] DB query result:', {
      found: !!freshValidation,
      error: freshError,
      commitment: freshValidation?.has_methodology_commitment,
      mvp_url: freshValidation?.mvp_url,
      promise: freshValidation?.promise,
      distributor: freshValidation?.distributor,
      allFields: freshValidation ? Object.keys(freshValidation) : 'none'
    });

    if (freshValidation) {
      console.log('[GET] Setting product.validation = freshValidation');
      product.validation = freshValidation;
    } else {
      console.log('[GET] No fresh validation found, using cached');
    }

    // Attach the latest recorded SURVEY verdict from the pipeline_gates ledger so the client
    // can surface RENOVATION / TEARDOWN / INCOMPLETE-SPEC. Same query the methodology card uses
    // (src/app/admin/methodology/[slug]/page.tsx): product_slug === productId, gate === 'survey',
    // newest first. The verdict itself is parsed client-side from `reason` (see SurveyGatePanel).
    const { data: surveyGate } = await supabase
      .from('pipeline_gates')
      .select('status, reason, deployment_id, artifact_ref, recorded_by, created_at, result')
      .eq('product_slug', productId)
      .eq('gate', 'survey')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    product.survey_gate = surveyGate ?? null;
    console.log('[GET] survey_gate:', surveyGate ? `${surveyGate.status} · ${surveyGate.reason}` : 'none');

    // Attach the latest recorded DESIGN-BUILD outcome from the pipeline_gates ledger so the
    // client can surface the PR link (artifact_ref) + the agent's logged decision forks (result).
    // Same shape as survey_gate above: product_slug === productId, gate === 'design-build', newest.
    const { data: designBuild } = await supabase
      .from('pipeline_gates')
      .select('status, reason, deployment_id, artifact_ref, recorded_by, created_at, result')
      .eq('product_slug', productId)
      .eq('gate', 'design-build')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    product.design_build = designBuild ?? null;
    console.log('[GET] design_build:', designBuild ? `${designBuild.status} · ${designBuild.reason}` : 'none');

    console.log('[GET] Returning product with validation:', {
      has_validation: !!product.validation,
      commitment: product.validation?.has_methodology_commitment,
      mvp_url: product.validation?.mvp_url
    });
    console.log('[GET] ========== END GET SUCCESS ==========');

    return NextResponse.json(product, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('[GET] ========== END GET ERROR ==========', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch product details',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}