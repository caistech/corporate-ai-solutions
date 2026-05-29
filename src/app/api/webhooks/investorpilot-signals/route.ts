/**
 * POST /api/webhooks/investorpilot-signals
 *
 * Receives market engagement signals from InvestorPilot after a product
 * is sent to market. Signals inform the pipeline's LIVE/DIE decision.
 *
 * Signal types:
 * - cta_click: User clicked CTA on landing page
 * - form_submit: User submitted a form on landing page
 * - meeting_booked: Meeting scheduled with distributor
 * - reply_received: Reply received from outreach
 *
 * Contract: cais-shared-services/product-factory/cross-cutting/PIPELINE_INVESTORPILOT_INTEGRATION.md
 */

import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 30;

interface MarketSignal {
  product_id: string;
  signal_type: 'cta_click' | 'form_submit' | 'meeting_booked' | 'reply_received';
  source: 'distributor' | 'end_user';
  contact_email?: string;
  contact_name?: string;
  company_name?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

function verifySignature(rawBody: string, signatureHeader: string | null): { ok: boolean; reason?: string } {
  if (!signatureHeader) return { ok: false, reason: 'missing X-Signal-Signature' };
  const secret = process.env.INVESTORPILOT_SIGNAL_WEBHOOK_SECRET;
  if (!secret) return { ok: false, reason: 'INVESTORPILOT_SIGNAL_WEBHOOK_SECRET not configured' };

  const match = signatureHeader.match(/^sha256=([a-f0-9]+)$/i);
  if (!match) return { ok: false, reason: 'signature header must be "sha256=<hex>"' };

  const expected = match[1].toLowerCase();
  const computed = createHmac('sha256', secret).update(rawBody).digest('hex');

  if (expected.length !== computed.length) return { ok: false, reason: 'signature length mismatch' };

  let safeEqual = false;
  try {
    safeEqual = timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(computed, 'hex'));
  } catch {
    return { ok: false, reason: 'signature parse failed' };
  }
  return safeEqual ? { ok: true } : { ok: false, reason: 'signature mismatch' };
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get('x-signal-signature');

  const sigResult = verifySignature(rawBody, signatureHeader);
  if (!sigResult.ok) {
    console.warn(`[webhooks/investorpilot-signals] signature rejected: ${sigResult.reason}`);
    return NextResponse.json({ error: sigResult.reason || 'signature invalid' }, { status: 401 });
  }

  let signal: MarketSignal;
  try {
    signal = JSON.parse(rawBody) as MarketSignal;
  } catch {
    return NextResponse.json({ error: 'body is not valid JSON' }, { status: 400 });
  }

  if (!signal.product_id || !signal.signal_type) {
    return NextResponse.json({ error: 'product_id and signal_type are required' }, { status: 400 });
  }

  const validSignalTypes = ['cta_click', 'form_submit', 'meeting_booked', 'reply_received'];
  if (!validSignalTypes.includes(signal.signal_type)) {
    return NextResponse.json({ error: `invalid signal_type: ${signal.signal_type}` }, { status: 400 });
  }

  // Store signal as validation event
  const { data: event, error: insertErr } = await supabase
    .from('validation_events')
    .insert({
      product_slug: signal.product_id,
      event_type: 'market_signal',
      field_name: signal.signal_type,
      new_value: JSON.stringify({
        source: signal.source,
        contact_email: signal.contact_email,
        contact_name: signal.contact_name,
        company_name: signal.company_name,
        metadata: signal.metadata,
      }),
      actor_type: 'system',
      actor_name: 'investorpilot',
      reason: `Market signal: ${signal.signal_type} from ${signal.source}`,
      context_data: {
        signal_type: signal.signal_type,
        source: signal.source,
        contact_email: signal.contact_email,
        contact_name: signal.contact_name,
        company_name: signal.company_name,
        metadata: signal.metadata,
        received_at: signal.timestamp,
      },
    })
    .select('id')
    .single();

  if (insertErr) {
    console.error(`[webhooks/investorpilot-signals] insert failed:`, insertErr);
    return NextResponse.json({ error: 'storage failed', detail: insertErr.message }, { status: 500 });
  }

  // Update product_validation_status with signal counts
  await updateSignalCounts(signal.product_id);

  console.log(
    `[webhooks/investorpilot-signals] received ${signal.signal_type} for ${signal.product_id}`,
  );

  return NextResponse.json({
    ok: true,
    event_id: event?.id,
    signal_type: signal.signal_type,
  });
}

async function updateSignalCounts(productSlug: string) {
  // Count signals by type
  const { data: signals } = await supabase
    .from('validation_events')
    .select('field_name, context_data')
    .eq('product_slug', productSlug)
    .eq('event_type', 'market_signal');

  const counts = {
    cta_clicks: 0,
    form_submits: 0,
    meetings_booked: 0,
    replies_received: 0,
  };

  signals?.forEach((s) => {
    if (s.field_name === 'cta_click') counts.cta_clicks++;
    else if (s.field_name === 'form_submit') counts.form_submits++;
    else if (s.field_name === 'meeting_booked') counts.meetings_booked++;
    else if (s.field_name === 'reply_received') counts.replies_received++;
  });

  // Update product_validation_status
  await supabase
    .from('product_validation_status')
    .update({
      cta_clicks: counts.cta_clicks,
      form_submits: counts.form_submits,
      meetings_booked: counts.meetings_booked,
      replies_received: counts.replies_received,
      last_signal_at: new Date().toISOString(),
    })
    .eq('product_slug', productSlug);
}
