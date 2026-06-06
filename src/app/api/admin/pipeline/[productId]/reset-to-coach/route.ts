/**
 * POST /api/admin/pipeline/[productId]/reset-to-coach
 *
 * SOFT RESET — send an admitted product back behind the coach gate.
 *
 * The ONLY thing that controls "in the coach phase vs admitted with a card" is the single boolean
 * product_validation_status.is_draft (one-door guard, [productId]/page.tsx:35). admit_product()
 * flips it false on a gate-PASS; this route flips it back to true so the guard bounces the card to
 * the coach, who resumes with welcome-back recall.
 *
 * NON-DESTRUCTIVE by design: the 14 graded spec fields, feasibility, has_* flags, the methodology
 * card, the manifest row and the convai conversation are ALL preserved. Re-passing the coach's
 * admit gate re-opens the card with everything intact (and re-scores it). This is the reset for
 * "I want to re-run this product through Morgan", not "wipe it to a blank idea".
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  _request: NextRequest,
  { params }: { params: { productId: string } },
) {
  const slug = params.productId.trim().toLowerCase();
  console.log('[RESET-TO-COACH] ========== START ==========', { slug });

  try {
    const supabase = supabaseAdmin();

    // Existence check first so we 404 cleanly rather than silently no-op'ing an unknown slug.
    const { data: row, error: lookupErr } = await supabase
      .from('product_validation_status')
      .select('product_slug, is_draft')
      .eq('product_slug', slug)
      .maybeSingle();

    if (lookupErr) {
      console.error('[RESET-TO-COACH] lookup error:', lookupErr.message);
      return NextResponse.json({ error: lookupErr.message }, { status: 500 });
    }
    if (!row) {
      return NextResponse.json({ error: `No product "${slug}".` }, { status: 404 });
    }
    if (row.is_draft) {
      // Already behind the coach gate — idempotent success, nothing to do.
      console.log('[RESET-TO-COACH] already draft — no-op', { slug });
      return NextResponse.json({ success: true, slug, alreadyDraft: true });
    }

    const { error: updateErr } = await supabase
      .from('product_validation_status')
      .update({ is_draft: true, last_validation_update: new Date().toISOString() })
      .eq('product_slug', slug);

    if (updateErr) {
      console.error('[RESET-TO-COACH] update error:', updateErr.message);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    console.log('[RESET-TO-COACH] is_draft → true (spec/card/manifest/conversation preserved)', { slug });
    console.log('[RESET-TO-COACH] ========== END ==========');
    return NextResponse.json({ success: true, slug, alreadyDraft: false });
  } catch (error) {
    console.error('[RESET-TO-COACH] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
