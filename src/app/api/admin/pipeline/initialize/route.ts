/**
 * POST /api/admin/pipeline/initialize
 * 
 * Initialize products from portfolio-manifest.yaml into the validation pipeline.
 * Creates rows in product_validation_status table for each product.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import YAML from 'yaml';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Read portfolio-manifest.yaml
    const possiblePaths = [
      path.resolve(process.cwd(), 'cais-shared-services/portfolio-manifest.yaml'),
      path.resolve(process.cwd(), '../../cais-shared-services/portfolio-manifest.yaml'),
    ];

    let manifest: any = null;
    for (const p of possiblePaths) {
      try {
        if (fs.existsSync(p)) {
          const content = fs.readFileSync(p, 'utf-8');
          manifest = YAML.parse(content);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    // Fallback: hardcoded portfolio list (for Vercel where filesystem access is limited)
    if (!manifest?.projects) {
      console.log('Manifest file not found, using hardcoded portfolio list');
      manifest = {
        projects: [
          { name: 'platform-trust', display_name: 'Platform Trust' },
          { name: 'property-services', display_name: 'Property Services' },
          { name: 'storefront-mcp', display_name: 'Storefront MCP' },
          { name: 'preflight', display_name: 'Preflight' },
          { name: 'mmcbuild', display_name: 'MMC Build' },
          { name: 'pipeline', display_name: 'Pipeline' },
          { name: 'deal-findrs', display_name: 'DealFindrs' },
          { name: 'f2k-checkpoint-new', display_name: 'F2K Checkpoint' },
          { name: 'investorpilot', display_name: 'InvestorPilot' },
          { name: 'ndissda-automate', display_name: 'NDIS SDAA Automate' },
          { name: 'r-and-d-tax', display_name: 'R&D Tax' },
          { name: 'tenderwatch', display_name: 'TenderWatch' },
          { name: 'f2k-fund-tokenisation', display_name: 'F2K Fund Tokenisation' },
          { name: 'easy-claude-code', display_name: 'Easy Claude Code' },
          { name: 'sayfix', display_name: 'SayFix' },
          { name: 'connexions', display_name: 'Connexions' },
          { name: 'kira', display_name: 'Kira' },
          { name: 'launchready', display_name: 'LaunchReady' },
          { name: 'universal-interviews', display_name: 'Universal Interviews' },
          { name: 'raiseready-template', display_name: 'RaiseReady' },
          { name: 'partner-pilot', display_name: 'PartnerPilot' },
          { name: 'outreach-ready', display_name: 'Outreach Ready' },
          { name: 'smart-board', display_name: 'Smart Board' },
          { name: 'hair-stylist-ai', display_name: 'Hair Stylist AI' },
          { name: 'lessonslearned', display_name: 'Lessons Learned' },
          { name: 'community-question-responder', display_name: 'Community Question Responder' },
          { name: 'disaster-support', display_name: 'Disaster Support' },
          { name: 'lingo-pure-ai', display_name: 'Lingo Pure AI' },
          { name: 'mova', display_name: 'Mova' },
          { name: 'rehearsals-ai', display_name: 'RehearsalsAI' },
          { name: 'singify', display_name: 'Singify' },
          { name: 'tourlingo', display_name: 'TourLingo' },
          { name: 'universal-lingo', display_name: 'Universal Lingo' },
        ]
      };
    }

    // Get existing products
    const { data: existing } = await supabase
      .from('product_validation_status')
      .select('product_slug');

    const existingSlugs = new Set((existing || []).map((r: any) => r.product_slug));

    // Insert missing products
    const toInsert = manifest.projects
      .filter((p: any) => !existingSlugs.has(p.name))
      .map((p: any) => ({
        product_slug: p.name,
        display_name: p.display_name || p.name.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        has_promise: false,
        has_distributor: false,
        has_end_user: false,
        has_friction: false,
        has_methodology_commitment: false,
        gate1_ready: false,
        can_run_outreach: false,
        hard_gates_passed: 0,
        hard_gates_total: 0,
        validation_test_status: 'not_run',
        is_draft: true,
        is_paused: false,
        last_scoring_run: new Date().toISOString(),
      }));

    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('product_validation_status')
        .insert(toInsert);

      if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json(
          { error: 'Failed to insert products', details: insertError },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Initialized ${toInsert.length} products`,
      total: manifest.projects.length,
      initialized: toInsert.length,
      existing: existingSlugs.size,
    });

  } catch (error) {
    console.error('Initialize error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize pipeline', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
