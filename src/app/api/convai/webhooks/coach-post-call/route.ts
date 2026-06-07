/**
 * POST /api/convai/webhooks/coach-post-call
 *
 * The ElevenLabs post-call webhook bound to the Morgan coach agent (provision-coach-agent.ts).
 * HMAC-verified (ELEVENLABS_WEBHOOK_SECRET) and acknowledged. The functional completion backstop
 * runs CLIENT-side (/api/admin/pipeline/new-ideas/backstop, cookie-authed) because this repo's
 * voice is client-tool + authed-browser, and the post-call payload carries no product_slug (we
 * never bound the conversation to a slug — that would need the convai memory loop this coach
 * deliberately skips). This route exists so the bound webhook resolves cleanly (no 404 retry
 * storm) and the HMAC secret is exercised; a server-side backstop (robust to browser-close) is a
 * documented follow-on that would require a conversation→slug binding.
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature, parsePostCallPayload } from '@caistech/elevenlabs-convai'

export async function POST(request: NextRequest) {
  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET
  if (!secret) {
    console.error('[coach-post-call] ELEVENLABS_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'webhook not configured' }, { status: 500 })
  }

  const rawBody = await request.text()
  const signature = request.headers.get('elevenlabs-signature')
  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  const payload = parsePostCallPayload(rawBody)
  if (!payload) {
    return NextResponse.json({ error: 'malformed payload' }, { status: 400 })
  }

  console.log('[coach-post-call] ack conversation=%s turns=%d', payload.data.conversation_id, payload.data.transcript?.length ?? 0)
  return NextResponse.json({ ok: true })
}
