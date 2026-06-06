/**
 * POST /api/admin/pipeline/new-ideas/coach/message
 *
 * Persists one conversation turn into the hub memory loop (convai_messages), live as the call runs.
 * Called CLIENT-side from VoiceCoach.onMessage (operator browser, cookie-authed). Per-turn (rather
 * than only at call-end) so an abandoned/tab-closed call still leaves the transcript on the card.
 *
 * Body: { elevenlabsConversationId, role: 'user'|'assistant', content, timestamp? }
 * Auth: requireOperator().
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { handleSaveMessage } from '@caistech/elevenlabs-convai'
import { requireOperator } from '@/lib/pipeline/require-operator'
import { COACH_TABLES } from '@/lib/methodology/coach-persistence'

export async function POST(request: NextRequest) {
  const operator = await requireOperator()
  if (!operator) {
    return NextResponse.json({ error: 'Operator authentication required' }, { status: 401 })
  }

  let body: {
    elevenlabsConversationId?: string
    role?: string
    content?: string
    timestamp?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }
  const { elevenlabsConversationId, role, content, timestamp } = body
  if (!elevenlabsConversationId || (role !== 'user' && role !== 'assistant') || !content?.trim()) {
    return NextResponse.json(
      { error: 'elevenlabsConversationId, role (user|assistant) and content are required' },
      { status: 400 },
    )
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const res = await handleSaveMessage(
    supabase,
    { elevenlabsConversationId, role, content: content.trim(), timestamp },
    COACH_TABLES,
  )
  if (!res.success) {
    // 'Conversation not found' = a turn arrived before /coach/start committed; the client buffers
    // and retries these, so this is expected-and-handled, not an error worth a 500.
    return NextResponse.json({ ok: false, error: res.error }, { status: 409 })
  }
  return NextResponse.json({ ok: true, messageIndex: res.messageIndex })
}
