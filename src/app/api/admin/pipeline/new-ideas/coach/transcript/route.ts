/**
 * GET /api/admin/pipeline/new-ideas/coach/transcript?slug=<productSlug>
 *
 * Reloads the saved conversation for a product so a returning operator can RESUME where they left
 * off — the field values already reload via card-state, this brings the *conversation* back too.
 * Reads the most-recent convai_conversations row for the slug and returns its transcript: the
 * transcript_json snapshot (written by /coach/complete on pause/end) if present, otherwise
 * reconstructed from convai_messages so a pause that never finalised still restores.
 *
 * Auth: requireOperator() — /api/admin/* is NOT middleware-gated, so this gates itself.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireOperator } from '@/lib/pipeline/require-operator'
import { COACH_TABLES } from '@/lib/methodology/coach-persistence'

interface SavedTurn {
  role?: string
  text?: string
}
interface Line {
  source: 'user' | 'ai'
  text: string
}

function toLine(role: string | undefined, text: string | undefined): Line | null {
  const t = (text ?? '').trim()
  if (!t) return null
  return { source: role === 'user' ? 'user' : 'ai', text: t }
}

export async function GET(request: NextRequest) {
  const operator = await requireOperator()
  if (!operator) {
    return NextResponse.json({ error: 'Operator authentication required' }, { status: 401 })
  }

  const slug = request.nextUrl.searchParams.get('slug')?.trim()
  if (!slug) {
    return NextResponse.json({ error: 'slug query param required' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // The latest walk for this card (scoped to this operator's conversations).
  const { data: conv, error } = await supabase
    .from(COACH_TABLES.conversations)
    .select('id, status, ended_at, transcript_json')
    .eq('product_slug', slug)
    .eq('user_id', operator.id)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) {
    console.error('[coach/transcript] read failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!conv) {
    return NextResponse.json({ hasPrior: false, status: null, endedAt: null, transcript: [] })
  }

  // Prefer the finalised snapshot; fall back to the per-turn message rows.
  let transcript: Line[] = []
  const snapshot = conv.transcript_json as SavedTurn[] | null
  if (Array.isArray(snapshot) && snapshot.length > 0) {
    transcript = snapshot.map((t) => toLine(t.role, t.text)).filter((l): l is Line => l !== null)
  } else {
    const { data: msgs, error: msgErr } = await supabase
      .from(COACH_TABLES.messages)
      .select('role, content, message_index')
      .eq('conversation_id', conv.id)
      .order('message_index', { ascending: true })
    if (msgErr) {
      console.error('[coach/transcript] messages read failed:', msgErr.message)
      return NextResponse.json({ error: msgErr.message }, { status: 500 })
    }
    transcript = (msgs ?? [])
      .map((m) => toLine(m.role as string, m.content as string))
      .filter((l): l is Line => l !== null)
  }

  console.log('[coach/transcript] op=%s slug=%s lines=%d status=%s', operator.email, slug, transcript.length, conv.status)
  return NextResponse.json({
    hasPrior: transcript.length > 0,
    status: conv.status,
    endedAt: conv.ended_at,
    transcript,
  })
}
