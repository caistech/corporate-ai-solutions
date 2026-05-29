/**
 * Cron: /api/cron/market-validation
 *
 * Runs market validation for all active products in the pipeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 120;

const VALIDATION_CONFIG = {
  weights: {
    cta_click: 10,
    form_submit: 25,
    meeting_booked: 50,
    reply_received: 15,
  },
  thresholds: {
    live: 30,
    die: 10,
  },
};

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: products, error: fetchError } = await supabase
      .from('product_validation_status')
      .select('*')
      .in('validation_stage', ['stage_4_market_validation', 'stage_5_mvp_testing'])
      .eq('is_paused', false)
      .or('last_market_verdict.is.null,last_market_verdict.eq.PENDING');

    if (fetchError) {
      console.error('Error fetching products:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch products', detail: fetchError.message },
        { status: 500 }
      );
    }

    if (!products || products.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No products require market validation',
        evaluated: 0,
      });
    }

    const results = [];

    for (const product of products) {
      const signals = {
        cta_clicks: product.cta_clicks || 0,
        form_submits: product.form_submits || 0,
        meetings_booked: product.meetings_booked || 0,
        replies_received: product.replies_received || 0,
      };

      const totalSignals = Object.values(signals).reduce((a, b) => a + b, 0);

      if (totalSignals === 0) {
        results.push({
          product_slug: product.product_slug,
          verdict: 'PENDING',
          reason: 'No signals yet',
        });
        continue;
      }

      const score =
        (signals.cta_clicks * VALIDATION_CONFIG.weights.cta_click) +
        (signals.form_submits * VALIDATION_CONFIG.weights.form_submit) +
        (signals.meetings_booked * VALIDATION_CONFIG.weights.meeting_booked) +
        (signals.replies_received * VALIDATION_CONFIG.weights.reply_received);

      let verdict: 'LIVE' | 'DIE' | 'PENDING';
      if (score >= VALIDATION_CONFIG.thresholds.live) {
        verdict = 'LIVE';
      } else if (score <= VALIDATION_CONFIG.thresholds.die) {
        verdict = 'DIE';
      } else {
        verdict = 'PENDING';
      }

      const updateData: Record<string, unknown> = {
        last_market_verdict: verdict,
        last_market_score: score,
        last_market_evaluation: new Date().toISOString(),
        last_signal_count: totalSignals,
      };

      if (verdict === 'DIE') {
        updateData.is_paused = true;
        updateData.pause_reason = `Market validation failed: score ${score} below threshold ${VALIDATION_CONFIG.thresholds.die}`;
      }

      await supabase
        .from('product_validation_status')
        .update(updateData)
        .eq('product_slug', product.product_slug);

      await supabase.from('validation_events').insert({
        product_slug: product.product_slug,
        event_type: 'market_validation_cron',
        field_name: 'verdict',
        new_value: JSON.stringify({ verdict, score, signals }),
        actor_type: 'system',
        reason: `Cron job: ${verdict}`,
        context_data: { score, signals, config: VALIDATION_CONFIG },
      });

      if (verdict === 'DIE') {
        const investorPilotApiUrl = process.env.INVESTORPILOT_API_URL;
        const investorPilotApiKey = process.env.INVESTORPILOT_API_KEY;

        if (investorPilotApiUrl && investorPilotApiKey) {
          const { data: channels } = await supabase
            .from('channels')
            .select('id')
            .eq('product_id', product.investorpilot_product_id)
            .in('channel_type', ['distributor_outreach', 'end_user_feedback'])
            .eq('status', 'active');

          if (channels) {
            for (const channel of channels) {
              await fetch(`${investorPilotApiUrl}/api/channels/${channel.id}/pause`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${investorPilotApiKey}`,
                },
                body: JSON.stringify({ reason: 'Market validation: DIE', score }),
              });
            }
          }
        }
      }

      results.push({
        product_slug: product.product_slug,
        verdict,
        score,
        signals,
        total_signals: totalSignals,
      });
    }

    return NextResponse.json({
      success: true,
      evaluated: products.length,
      results,
    });
  } catch (error) {
    console.error('Market validation cron error:', error);
    return NextResponse.json(
      { error: 'Cron job failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
