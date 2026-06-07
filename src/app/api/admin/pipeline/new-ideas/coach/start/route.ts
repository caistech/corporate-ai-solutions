/**
 * POST /api/admin/pipeline/new-ideas/coach/start
 *
 * Opens (persists) a coach conversation in the hub memory loop and returns welcome-back recall.
 * Called CLIENT-side from VoiceCoach.onConnect (the operator browser, cookie-authed) — the coach
 * does voice via client tools + the authed browser, not a server webhook, so this drives the hub's
 * handleStartConversation directly. Binds the conversation to the card it's filling (product_slug).
 *
 * Body: { productSlug, elevenlabsConversationId, elevenlabsAgentId }
 * Auth: requireOperator() — /api/admin/* is not middleware-gated, so it gates itself.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { handleStartConversation } from '@caistech/elevenlabs-convai'
import { requireOperator } from '@/lib/pipeline/require-operator'
import { ensureCoachAgent, COACH_TABLES } from '@/lib/methodology/coach-persistence'

export async function POST(request: NextRequest) {
  const operator = await requireOperator()
  if (!operator) {
    return NextResponse.json({ error: 'Operator authentication required' }, { status: 401 })
  }

  let body: { productSlug?: string; elevenlabsConversationId?: string; elevenlabsAgentId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }
  const { productSlug, elevenlabsConversationId, elevenlabsAgentId } = body
  if (!productSlug || !elevenlabsConversationId || !elevenlabsAgentId) {
    return NextResponse.json(
      { error: 'productSlug, elevenlabsConversationId and elevenlabsAgentId are required' },
      { status: 400 },
    )
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // The convai_agents row must exist or the hub handlers refuse — self-heal it (idempotent).
  const ensured = await ensureCoachAgent(supabase, {
    elevenlabsAgentId,
    ownerUserId: operator.id,
  })
  if (!ensured.ok) {
    console.error('[coach/start] ensureCoachAgent failed:', ensured.error)
    return NextResponse.json({ error: `coach agent registry: ${ensured.error}` }, { status: 500 })
  }

  // Create the conversation row (binds user_id = operator) and pull recall context (welcome-back).
  const res = await handleStartConversation(
    supabase,
    { elevenlabsConversationId, elevenlabsAgentId, userId: operator.id },
    COACH_TABLES,
  )
  if (!res.success) {
    console.error('[coach/start] handleStartConversation failed:', res.error)
    return NextResponse.json({ error: res.error }, { status: 500 })
  }

  // Bind to the card this walk is filling (migration delta #2 — product_slug, set once at start).
  const { error: bindErr } = await supabase
    .from(COACH_TABLES.conversations)
    .update({ product_slug: productSlug, title: `Onboarding — ${productSlug}` })
    .eq('elevenlabs_conversation_id', elevenlabsConversationId)
  if (bindErr) console.warn('[coach/start] product_slug bind failed (non-fatal):', bindErr.message)

  console.log(
    '[coach/start] op=%s slug=%s conv=%s returning=%s',
    operator.email,
    productSlug,
    res.conversationId,
    res.isReturningUser,
  )

  return NextResponse.json({
    ok: true,
    conversationId: res.conversationId,
    isReturningUser: res.isReturningUser,
    timeGapCategory: res.timeGapCategory,
    context: res.context,
  })
}
