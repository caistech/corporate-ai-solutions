import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  console.log('[RECALCULATE] ========== START ==========');
  try {
    const productSlug = params.productId;

    // Fetch current validation data
    const { data: validation, error } = await supabase
      .from('product_validation_status')
      .select('*')
      .eq('product_slug', productSlug)
      .single();

    if (error || !validation) {
      console.log('[RECALCULATE] No validation found');
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    console.log('[RECALCULATE] Current data:', {
      has_promise: validation.has_promise,
      has_distributor: validation.has_distributor,
      has_end_user: validation.has_end_user,
      has_friction: validation.has_friction,
      has_methodology_commitment: validation.has_methodology_commitment,
      test_part_a: validation.test_part_a_admin_portal,
      test_part_b: validation.test_part_b_user_portal,
      test_part_c: validation.test_part_c_auth_flows,
      test_part_d: validation.test_part_d_scaffold_verify,
    });

    // Calculate hard gates passed
    let hardGatesPassed = 0;
    if (validation.has_promise) hardGatesPassed++;
    if (validation.has_distributor) hardGatesPassed++;
    if (validation.has_end_user) hardGatesPassed++;
    if (validation.has_friction) hardGatesPassed++;
    if (validation.has_methodology_commitment) hardGatesPassed++;
    if (validation.test_part_a_admin_portal === 'passed') hardGatesPassed++;
    if (validation.test_part_b_user_portal === 'passed') hardGatesPassed++;
    if (validation.test_part_c_auth_flows === 'passed') hardGatesPassed++;
    if (validation.test_part_d_scaffold_verify === 'passed') hardGatesPassed++;

    // Calculate weighted score
    const calcScore = (status: string) => {
      if (status === 'passed') return 25;
      if (status === 'warning') return 20;
      return 0;
    };

    const testScore = 
      calcScore(validation.test_part_a_admin_portal) +
      calcScore(validation.test_part_b_user_portal) +
      calcScore(validation.test_part_c_auth_flows) +
      calcScore(validation.test_part_d_scaffold_verify);

    // Validation fields score (20 points)
    const fieldsScore = 
      (validation.has_promise ? 5 : 0) +
      (validation.has_distributor ? 5 : 0) +
      (validation.has_end_user ? 5 : 0) +
      (validation.has_friction ? 5 : 0);

    // Calculate final readiness score (same formula as frontend)
    let readinessScore = 0;
    readinessScore += (hardGatesPassed / 9) * 30; // 30 pts for hard gates
    readinessScore += (testScore / 100) * 30; // 30 pts for tests
    readinessScore += fieldsScore; // 20 pts for fields
    if (validation.has_methodology_commitment) readinessScore = Math.min(100, readinessScore + 10); // 10 pt bonus

    console.log('[RECALCULATE] Calculated:', { hardGatesPassed, testScore, fieldsScore, readinessScore });

    // Update DB
    const { data: updated, error: updateError } = await supabase
      .from('product_validation_status')
      .update({
        hard_gates_passed: hardGatesPassed,
        hard_gates_total: 9,
        weighted_score_percent: testScore,
        last_scoring_run: new Date().toISOString()
      })
      .eq('product_slug', productSlug)
      .select()
      .single();

    if (updateError) {
      console.error('[RECALCULATE] Update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log('[RECALCULATE] Updated:', { 
      hard_gates_passed: updated.hard_gates_passed,
      weighted_score_percent: updated.weighted_score_percent,
      readiness_score: Math.round(readinessScore)
    });

    return NextResponse.json({ 
      success: true, 
      data: updated,
      readiness_score: Math.round(readinessScore)
    });
  } catch (error) {
    console.error('[RECALCULATE] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
