/**
 * POST /api/admin/pipeline/[productId]/recalculate-score
 *
 * RETIRED FORMULA (plan §2.1). This route no longer computes its own score. The old body —
 * 30% hard-gates(9) + 30% test A/B/C/D + 20% fields(4) + 10% methodology bonus, writing
 * testScore into weighted_score_percent — was the broken five-boolean math that DISAGREED with
 * score.ts. It is gone. This route is now a thin adapter: it runs the single canonical scorer
 * (score.ts via loadCardScore) and writes that one result into the legacy columns, so the number
 * in weighted_score_percent comes from score.ts and nowhere else.
 *
 * score.ts scores 0–10 (null until the HARD gate passes); the legacy column is an INT 0–100, so
 * the 0–10 is ×10'd into it. When the HARD gate hasn't passed, score is null → 0% (not "ready").
 *
 * ⚠ OTHER WRITER TO RECONCILE: the mandated grep (plan §2.1) found a second live writer of
 * weighted_score_percent — src/app/api/admin/pipeline/[productId]/run-test/route.ts (writes
 * `weighted_score_percent: newScore`). For a true single source it must also stop computing its
 * own number and either call this route or loadCardScore. That edit is outside this file; flagged
 * here so it isn't forgotten.
 *
 * Caller: src/components/admin/ProductDetailView.tsx (the "recalculate" button) — kept working,
 * so this route is gutted, not deleted.
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadCardScore } from '@/lib/methodology/readiness';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  _request: NextRequest,
  { params }: { params: { productId: string } },
) {
  console.log('[RECALCULATE] ========== START (score.ts-backed) ==========');
  try {
    const slug = params.productId.trim().toLowerCase();

    // The single canonical scorer. Reads the ratified criteria + the card's features + the
    // latest recorded verdicts, runs score.ts. No formula here.
    const card = await loadCardScore(slug);

    if (!card.found) {
      // Not in the methodology system → score.ts has no input. Don't fabricate a number.
      return NextResponse.json(
        { error: `No methodology card for "${slug}" — score.ts cannot score it. (weighted_score_percent left unchanged.)` },
        { status: 404 },
      );
    }

    const s = card.score;
    if (!s) {
      return NextResponse.json(
        { error: 'No score yet — the criteria catalogue or the card verdicts are missing.' },
        { status: 422 },
      );
    }

    // 0–10 (null pre-HARD-gate) → legacy 0–100 INT.
    const weighted = Math.round((s.score ?? 0) * 10);
    const hardPassed = s.hardGate.total - s.hardGate.failing.length;

    const supabase = supabaseAdmin();
    const { data: updated, error } = await supabase
      .from('product_validation_status')
      .update({
        weighted_score_percent: weighted,
        hard_gates_passed: hardPassed,
        hard_gates_total: s.hardGate.total,
        gate1_ready: card.mvpReady,
        last_scoring_run: new Date().toISOString(),
      })
      .eq('product_slug', slug)
      .select()
      .single();

    if (error) {
      console.error('[RECALCULATE] update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[RECALCULATE] score.ts →', { score: s.score, band: s.band, weighted, gate1_ready: card.mvpReady });
    console.log('[RECALCULATE] ========== END ==========');

    return NextResponse.json({
      success: true,
      slug,
      source: 'score.ts',
      score: s.score,
      band: s.band,
      gate1_ready: card.mvpReady,
      weighted_score_percent: weighted,
      data: updated,
    });
  } catch (error) {
    console.error('[RECALCULATE] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
