/**
 * PATCH /api/admin/pipeline/[productId]/validation
 * Update validation fields.
 *
 * 2026-05-31 (Path 2): added the six ICP-targeting fields InvestorPilot needs
 * for full onboarding — icp_partner_type, icp_buyer_title, icp_verticals,
 * icp_company_size, icp_stage, exclusions. These are ICP refinements, NOT hard
 * gates, so they are added to skipHasFlag: the route stores the value but does
 * NOT write a has_<field> flag (those flag columns don't exist and aren't part
 * of the readiness/gate calc — writing them would 500 on a missing column,
 * exactly the failure we hit before with core_mechanism/geography).
 *
 * Requires the matching migration (adds the six text columns to
 * product_validation_status) to be applied first.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  global: { headers: { 'Cache-Control': 'no-cache' } },
});

// Fields the PATCH body may write. Existing validation fields plus the six
// Path 2 ICP-targeting fields.
const ALLOWED_FIELDS = [
  'promise',
  'distributor',
  'end_user',
  'friction',
  'distributor_outcomes',
  'end_user_outcomes',
  'core_mechanism',
  'icp_geography',
  'has_methodology_commitment',
  'mvp_url',
  // Path 2 — ICP targeting (no has_* flag; see skipHasFlag).
  'icp_partner_type',
  'icp_buyer_title',
  'icp_verticals',
  'icp_company_size',
  'icp_stage',
  'exclusions',
];

// Fields that must NOT get an auto-generated has_<field> flag written. mvp_url
// never had one; the Path 2 ICP fields are refinements (not gates) and have no
// flag columns, so writing has_icp_partner_type etc. would 500 on a missing
// column.
const SKIP_HAS_FLAG = [
  'mvp_url',
  'icp_partner_type',
  'icp_buyer_title',
  'icp_verticals',
  'icp_company_size',
  'icp_stage',
  'exclusions',
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { productId: string } },
) {
  console.log('[PATCH] ========== START ==========');
  try {
    const productSlug = params.productId.trim().toLowerCase();
    const body = await request.json();
    console.log('[PATCH] productSlug:', productSlug, 'body:', JSON.stringify(body));

    const update: Record<string, any> = {};

    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) {
        const value = body[field];
        if (typeof value === 'boolean') {
          update[field] = value;
          console.log('[PATCH] Boolean field:', field, '=', value);
        } else {
          update[field] = value;
          if (!SKIP_HAS_FLAG.includes(field)) {
            // Only string-typed gate fields get a has_ flag. Guard the
            // .trim() so a null/non-string value doesn't throw.
            update[`has_${field}`] =
              typeof value === 'string' && value.trim().length > 0;
          }
        }
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields' }, { status: 400 });
    }

    console.log('[PATCH] Update payload:', JSON.stringify(update));

    const { data: updated, error: updateError } = await supabase
      .from('product_validation_status')
      .update(update)
      .eq('product_slug', productSlug);

    console.log('[PATCH] Update result - updated:', updated, 'error:', updateError);

    if (updateError) {
      console.error('[PATCH] Update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Brief pause so the subsequent SELECT reads the committed row.
    await new Promise((resolve) => setTimeout(resolve, 100));

    const { data: fresh, error: fetchError } = await supabase
      .from('product_validation_status')
      .select('*')
      .eq('product_slug', productSlug)
      .single();

    if (fetchError) {
      console.error('[PATCH] Fetch-after-update error:', fetchError);
      // The update itself succeeded; surface the row we have rather than 500.
      return NextResponse.json({ success: true, data: null, warning: fetchError.message });
    }

    console.log('[PATCH] Fresh data:', JSON.stringify(fresh));
    console.log('[PATCH] ========== END ==========');

    return NextResponse.json({ success: true, data: fresh });
  } catch (error) {
    console.error('[PATCH] EXCEPTION:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}