/**
 * POST /api/convai/webhooks/coach-post-call
 *
 * The ElevenLabs post-call webhook bound to the Morgan coach agent (provision-coach-agent.ts).
 * HMAC-verified, then runs the loop's PERSIST+DISTIL leg server-side (VOICE_MEMORY_STANDARD §F leg 1):
 * handlePostCallWebhook persists the transcript exactly-once and, on the winning claim, calls our
 * onConversationComplete → distillConversationToMemory → convai_memory. This is what fills the memory
 * the next session recalls; the prior version only ack'd (storage, not memory). Robust to browser
 * close (server-side), so it complements the client backstop (which fills card FIELDS, not memory).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  verifyWebhookSignature,
  parsePostCallPayload,
  handlePostCallWebhook,
  distillConversationToMemory,
} from '@caistech/elevenlabs-convai'
import { COACH_TABLES } from '@/lib/methodology/coach-persistence'
import { coachMemoryExtractor } from '@/lib/methodology/distil-coach-memory'

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

  const d = payload.data
  const startSecs = d.metadata?.start_time_unix_secs ?? 0
  const toIso = (secs: number | undefined) => (secs ? new Date(secs * 1000).toISOString() : new Date().toISOString())

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const result = await handlePostCallWebhook(
    supabase,
    {
      elevenlabsAgentId: d.agent_id,
      conversationId: d.conversation_id,
      userId: '', // conversation was bound at coach/start — its user_id is kept, never overwritten
      topic: d.analysis?.transcript_summary?.slice(0, 200) ?? '',
      status: d.status,
      startedAt: toIso(startSecs),
      endedAt: toIso(d.metadata?.end_time_unix_secs),
      durationSecs: d.metadata?.call_duration_secs ?? 0,
      messages: (d.transcript ?? []).map((t) => ({
        role: t.role === 'agent' ? 'assistant' : 'user',
        content: t.message,
        timestamp: toIso(startSecs + (t.time_in_call_secs ?? 0)),
      })),
    },
    COACH_TABLES,
    // Exactly-once (behind the processed_at gate): distil the transcript into convai_memory.
    async (conversation, sb) => {
      const { saved } = await distillConversationToMemory(sb, {
        elevenlabsConversationId: conversation.elevenlabsConversationId,
        conversationId: conversation.id,
        extract: coachMemoryExtractor,
        tables: COACH_TABLES,
      })
      console.log('[coach-post-call] distilled %d memories for conv=%s', saved, conversation.elevenlabsConversationId)
    },
  )

  if (!result.success) {
    console.error('[coach-post-call] persist failed:', result.error)
    // Ack anyway so ElevenLabs doesn't retry-storm; the client backstop still covers field capture.
    return NextResponse.json({ ok: false, error: result.error })
  }

  console.log('[coach-post-call] conv=%s processed=%s', d.conversation_id, result.processed)
  return NextResponse.json({ ok: true })
}
