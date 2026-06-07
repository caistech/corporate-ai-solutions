/**
 * GET /api/admin/pipeline/[productId]
 *
 * Fetch detailed validation status for a single product
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProductPipeline } from '@/lib/portfolio-scanner';
import { createClient } from '@supabase/supabase-js';
import { loadCardFreshness } from '@/lib/methodology/freshness';

// Force this route to run fresh on every request — never statically cached, and
// no Next.js data-cache on the server-side Supabase reads. Without this, the
// pipeline_gates query can return a cached stale verdict even though the DB has newer rows.
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

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

    // Attach the CANONICAL readiness_results verdicts (newest-first) so the client derives Step 5/6
    // test state from the GATE, not from the validation_test_status mirror cell. Without this the UI
    // falls back to optimistic client state — the fake-green source (a green banner over an empty
    // readiness_results table). The component reads VT_<id> per test via validation-test-state.ts.
    const { data: readinessRows } = await supabase
      .from('readiness_results')
      .select('check_code, status, source, evidence, scored_at')
      .eq('product_slug', productId)
      .order('scored_at', { ascending: false });
    product.readiness_results = readinessRows ?? [];
    console.log('[GET] readiness_results:', readinessRows?.length ?? 0, 'rows');

    // Derived per-check freshness (no schema change): for every APPLICABLE check, is its
    // latest verdict scored against the current deploy (current), an older one (stale —
    // pending a re-score / an agent re-run), or never scored (missing)? Reference deploy =
    // the newest verdict's deployment_id. Best-effort: a freshness failure must not break
    // the card load. See lib/methodology/freshness.ts + the /rescore trigger.
    try {
      product.readiness_freshness = await loadCardFreshness(productId);
      console.log('[GET] readiness_freshness:', product.readiness_freshness.summary);
    } catch (e) {
      console.error('[GET] freshness derive failed (non-fatal):', e);
      product.readiness_freshness = null;
    }

    // Attach the coach (Morgan) conversation bound to this card — the onboarding walk that filled
    // the spec fields, now persisted via the hub memory loop (convai_*). Newest conversation +
    // its messages, so the card can surface the transcript. Best-effort: never break the load.
    try {
      const { data: coachConv } = await supabase
        .from('convai_conversations')
        .select('id, status, started_at, ended_at, message_count, last_topic, title, transcript_text')
        .eq('product_slug', productId)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (coachConv) {
        const { data: msgs } = await supabase
          .from('convai_messages')
          .select('role, content, message_index, timestamp')
          .eq('conversation_id', coachConv.id)
          .order('message_index', { ascending: true });
        product.coach_conversation = { ...coachConv, messages: msgs ?? [] };
      } else {
        product.coach_conversation = null;
      }
      console.log('[GET] coach_conversation:', coachConv ? `${coachConv.status} · ${coachConv.message_count} msgs` : 'none');
    } catch (e) {
      console.error('[GET] coach_conversation fetch failed (non-fatal):', e);
      product.coach_conversation = null;
    }

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
