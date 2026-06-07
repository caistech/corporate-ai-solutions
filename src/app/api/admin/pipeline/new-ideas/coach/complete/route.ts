/**
 * POST /api/admin/pipeline/new-ideas/coach/complete
 *
 * Finalises a coach conversation when the call ends (VoiceCoach.onDisconnect, operator browser).
 * Marks it completed, stamps ended_at, and writes a transcript_text snapshot for the card's
 * conversation panel. Per-turn rows were already saved by /coach/message; this is the finaliser,
 * not the primary writer (so it never re-inserts messages / risks an index conflict).
 *
 * Body: { elevenlabsConversationId, transcript?: { role: 'user'|'assistant'; text: string }[] }
 * Auth: requireOperator().
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireOperator } from '@/lib/pipeline/require-operator'
import { COACH_TABLES } from '@/lib/methodology/coach-persistence'

interface Turn {
  role: 'user' | 'assistant'
  text: string
}

export async function POST(request: NextRequest) {
  const operator = await requireOperator()
  if (!operator) {
    return NextResponse.json({ error: 'Operator authentication required' }, { status: 401 })
  }

  let body: { elevenlabsConversationId?: string; transcript?: Turn[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }
  const { elevenlabsConversationId, transcript } = body
  if (!elevenlabsConversationId) {
    return NextResponse.json({ error: 'elevenlabsConversationId required' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const transcriptText = Array.isArray(transcript)
    ? transcript
        .filter((t) => t && typeof t.text === 'string' && t.text.trim())
        .map((t) => `${t.role === 'user' ? 'Operator' : 'Morgan'}: ${t.text.trim()}`)
        .join('\n')
    : null

  const update: Record<string, unknown> = {
    status: 'completed',
    ended_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  if (transcriptText) {
    update.transcript_text = transcriptText
    update.transcript_json = transcript
  }

  const { error } = await supabase
    .from(COACH_TABLES.conversations)
    .update(update)
    .eq('elevenlabs_conversation_id', elevenlabsConversationId)
  if (error) {
    console.error('[coach/complete] update failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log('[coach/complete] op=%s conv=%s finalised', operator.email, elevenlabsConversationId)
  return NextResponse.json({ ok: true })
}
