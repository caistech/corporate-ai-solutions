/**
 * POST /api/admin/pipeline/[productId]/market-validate
 *
 * Phase 4: Market Validation Rubric + Automated LIVE/DIE Verdict
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 60;

interface MarketValidationConfig {
  weights: {
    cta_click: number;
    form_submit: number;
    meeting_booked: number;
    reply_received: number;
  };
  thresholds: {
    live: number;
    die: number;
  };
}

const DEFAULT_CONFIG: MarketValidationConfig = {
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

interface MarketValidationResult {
  verdict: 'LIVE' | 'DIE' | 'PENDING';
  score: number;
  signals: {
    cta_clicks: number;
    form_submits: number;
    meetings_booked: number;
    replies_received: number;
    total: number;
  };
  config: MarketValidationConfig;
  channels_affected?: string[];
  metadata: {
    product_slug: string;
    evaluated_at: string;
    previous_verdict?: string;
    previous_signal_count?: number;
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const productSlug = params.productId;

    const body = await request.json().catch(() => ({}));
    const dryRun = body.dry_run !== false;
    const config: MarketValidationConfig = body.config || DEFAULT_CONFIG;

    const { data: product, error: fetchError } = await supabase
      .from('product_validation_status')
      .select('*')
      .eq('product_slug', productSlug)
      .single();

    if (fetchError || !product) {
      return NextResponse.json(
        { error: 'Product not found', detail: fetchError?.message },
        { status: 404 }
      );
    }

    const signals = {
      cta_clicks: product.cta_clicks || 0,
      form_submits: product.form_submits || 0,
      meetings_booked: product.meetings_booked || 0,
      replies_received: product.replies_received || 0,
      total: (product.cta_clicks || 0) + (product.form_submits || 0) + (product.meetings_booked || 0) + (product.replies_received || 0),
    };

    const score =
      (signals.cta_clicks * config.weights.cta_click) +
      (signals.form_submits * config.weights.form_submit) +
      (signals.meetings_booked * config.weights.meeting_booked) +
      (signals.replies_received * config.weights.reply_received);

    let verdict: 'LIVE' | 'DIE' | 'PENDING';
    if (signals.total === 0) {
      verdict = 'PENDING';
    } else if (score >= config.thresholds.live) {
      verdict = 'LIVE';
    } else if (score <= config.thresholds.die) {
      verdict = 'DIE';
    } else {
      verdict = 'PENDING';
    }

    const result: MarketValidationResult = {
      verdict,
      score,
      signals,
      config,
      metadata: {
        product_slug: productSlug,
        evaluated_at: new Date().toISOString(),
        previous_verdict: product.last_market_verdict || undefined,
        previous_signal_count: product.last_signal_count || undefined,
      },
    };

    if (dryRun) {
      return NextResponse.json({
        success: true,
        mode: 'DRY_RUN',
        result,
        next_step: 'Call with dry_run: false to execute verdict',
      });
    }

    if (verdict === 'PENDING') {
      await supabase
        .from('product_validation_status')
        .update({
          last_market_verdict: 'PENDING',
          last_market_score: score,
          last_market_evaluation: new Date().toISOString(),
          last_signal_count: signals.total,
        })
        .eq('product_slug', productSlug);

      await supabase.from('validation_events').insert({
        product_slug: productSlug,
        event_type: 'market_validation',
        field_name: 'verdict',
        new_value: JSON.stringify({ verdict, score, signals }),
        actor_type: 'system',
        reason: 'Market validation: PENDING (insufficient signals)',
        context_data: { score, signals, config },
      });

      return NextResponse.json({
        success: true,
        result,
        message: 'Verdict: PENDING - not enough market signals yet',
      });
    }

    const channelsToPause: string[] = [];

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
            const pauseRes = await fetch(`${investorPilotApiUrl}/api/channels/${channel.id}/pause`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${investorPilotApiKey}`,
              },
              body: JSON.stringify({ reason: 'Market validation: DIE', score }),
            });

            if (pauseRes.ok) {
              channelsToPause.push(channel.id);
            }
          }
        }
      }

      await supabase
        .from('product_validation_status')
        .update({
          last_market_verdict: 'DIE',
          last_market_score: score,
          last_market_evaluation: new Date().toISOString(),
          last_signal_count: signals.total,
          is_paused: true,
          pause_reason: `Market validation failed: score ${score} below threshold ${config.thresholds.die}`,
        })
        .eq('product_slug', productSlug);

      await supabase.from('validation_events').insert({
        product_slug: productSlug,
        event_type: 'market_validation',
        field_name: 'verdict',
        new_value: JSON.stringify({ verdict, score, signals, channels_paused: channelsToPause }),
        actor_type: 'system',
        reason: 'Market validation: DIE - automated pause',
        context_data: { score, signals, config, channels_paused: channelsToPause },
      });

      result.channels_affected = channelsToPause;
    }

    if (verdict === 'LIVE') {
      await supabase
        .from('product_validation_status')
        .update({
          last_market_verdict: 'LIVE',
          last_market_score: score,
          last_market_evaluation: new Date().toISOString(),
          last_signal_count: signals.total,
        })
        .eq('product_slug', productSlug);

      await supabase.from('validation_events').insert({
        product_slug: productSlug,
        event_type: 'market_validation',
        field_name: 'verdict',
        new_value: JSON.stringify({ verdict, score, signals }),
        actor_type: 'system',
        reason: 'Market validation: LIVE - continuing outreach',
        context_data: { score, signals, config },
      });
    }

    return NextResponse.json({
      success: true,
      result,
      message: verdict === 'DIE'
        ? `Verdict: DIE - ${channelsToPause.length} channels paused`
        : `Verdict: LIVE - continuing outreach`,
    });
  } catch (error) {
    console.error('Error in market-validation:', error);
    return NextResponse.json(
      {
        error: 'Market validation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  const productSlug = params.productId;

  const { data: product, error } = await supabase
    .from('product_validation_status')
    .select('cta_clicks, form_submits, meetings_booked, replies_received, last_market_verdict, last_market_score, last_market_evaluation, last_signal_count')
    .eq('product_slug', productSlug)
    .single();

  if (error || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json({
    product_slug: productSlug,
    current_signals: {
      cta_clicks: product.cta_clicks || 0,
      form_submits: product.form_submits || 0,
      meetings_booked: product.meetings_booked || 0,
      replies_received: product.replies_received || 0,
    },
    last_verdict: {
      verdict: product.last_market_verdict,
      score: product.last_market_score,
      evaluated_at: product.last_market_evaluation,
      signal_count: product.last_signal_count,
    },
    config: DEFAULT_CONFIG,
  });
}
