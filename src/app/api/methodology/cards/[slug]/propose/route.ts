import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  proposeDecision,
  type StreamEvidence,
  type DecisionProposal,
  type SuggestedAction,
} from '@/lib/methodology/decision-proposer'

/**
 * POST /api/methodology/cards/[slug]/propose  — Build #3.
 *
 * The harness PROPOSES the decision instead of the operator asserting it by gut. Runs the §5
 * scorer (via the LLM-judge bridge) in two passes:
 *   - hypothesis (Gate 0)  — always; judges the idea card's desk research → triage proposal.
 *   - evidence  (Gate 2)   — only when interview responses exist; judges the two validation
 *                            streams → go/no-go, carrying build_fit from the desk pass (build_fit
 *                            is factory-internal, not an interview question).
 *
 * Read-only on the card: computes + RETURNS the proposal(s); it never writes a decision. The
 * operator confirms (or overrides) in DecisionControls, which PATCHes the status as before
 * (human-in-the-loop, per the locked engine policy). Incurs LLM cost; fires NO outreach.
 *
 * Requires ANTHROPIC_API_KEY (the judge). Same gated /admin posture as the sibling routes.
 */

// The proposer's domain vocabulary → the card's status enum (the cockpit's existing decisions).
const ACTION_TO_STATUS: Record<SuggestedAction['action'], string> = {
  'move-to-research': 'validation-in-flight',
  'go-full-build': 'redesign-to-fit', // the cockpit's terminal GO ("GO (redesign to fit)" per Rule 15)
  'redesign-to-fit': 'validation-in-flight', // REDESIGN band — not yet a GO; keep iterating
  'no-go': 'kill',
  kill: 'kill',
}

const MAX_SUMMARIES = 8
const SUMMARY_CAP = 320

interface ResponseRow {
  classification: string | null
  classification_reasoning: string | null
  response_raw_text: string
}

function buildStreamEvidence(
  campaign_type: StreamEvidence['campaign_type'],
  responses: ResponseRow[]
): StreamEvidence {
  const signal_counts = { confirms: 0, contradicts: 0, refines: 0 }
  const summaries: string[] = []
  for (const r of responses) {
    if (r.classification === 'confirms') signal_counts.confirms++
    else if (r.classification === 'contradicts') signal_counts.contradicts++
    else if (r.classification === 'refines') signal_counts.refines++
    if (summaries.length < MAX_SUMMARIES) {
      const text = (r.classification_reasoning || r.response_raw_text || '').trim()
      if (text) summaries.push(text.slice(0, SUMMARY_CAP))
    }
  }
  return { campaign_type, interview_count: responses.length, signal_counts, summaries }
}

// The idea-card fields that make up the desk-research notes for the hypothesis (Gate-0) pass.
const DESK_KEYS = [
  'problem',
  'demand_evidence',
  'wedge',
  'scope',
  'architecture',
  'distributor',
  'end_user_pool',
  'decisions_needed',
] as const

function deskNotes(ideaCard: Record<string, string>, originSummary: string | null): string {
  const lines = DESK_KEYS.map((k) => {
    const v = (ideaCard[k] ?? '').trim()
    return v ? `${k}: ${v}` : null
  }).filter(Boolean) as string[]
  if (originSummary && originSummary.trim()) lines.unshift(`origin: ${originSummary.trim()}`)
  return lines.join('\n')
}

function withRecommendedStatus(p: DecisionProposal) {
  return { ...p, recommended_status: ACTION_TO_STATUS[p.suggested.action] }
}

export async function POST(_request: NextRequest, { params }: { params: { slug: string } }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY must be set on the server to propose a decision' },
      { status: 503 }
    )
  }

  const supabase = supabaseAdmin()

  const { data: card, error: cardErr } = await supabase
    .from('methodology_hypothesis_cards')
    .select('id, product_slug, origin_summary, idea_card')
    .eq('product_slug', params.slug)
    .maybeSingle()

  if (cardErr) {
    console.error('[propose] card lookup failed:', cardErr)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
  if (!card) {
    return NextResponse.json({ error: 'Hypothesis Card not found' }, { status: 404 })
  }

  const ideaCard = (card.idea_card ?? {}) as Record<string, string>
  const whatItIs = (ideaCard.one_liner ?? card.origin_summary ?? '').trim()
  const notes = deskNotes(ideaCard, card.origin_summary)

  // ── hypothesis (Gate 0) pass — always; also yields build_fit for the evidence pass. ──
  let hypothesis: DecisionProposal
  try {
    hypothesis = await proposeDecision({
      mode: 'hypothesis',
      product_slug: card.product_slug,
      what_it_is: whatItIs,
      desk_notes: notes,
    })
  } catch (e) {
    console.error('[propose] hypothesis pass failed:', e)
    return NextResponse.json({ error: `Hypothesis scoring failed: ${(e as Error).message}` }, { status: 502 })
  }

  // ── evidence (Gate 2) pass — only when interview responses exist. ──
  // Load the two campaigns + their classified responses.
  const { data: campaigns, error: campErr } = await supabase
    .from('methodology_campaigns')
    .select('id, campaign_type')
    .eq('card_id', card.id)

  if (campErr) {
    console.error('[propose] campaigns lookup failed:', campErr)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  const byType = new Map((campaigns ?? []).map((c) => [c.campaign_type as string, c.id as string]))
  const distId = byType.get('distributor-candidate')
  const euId = byType.get('target-user')
  const campaignIds = [distId, euId].filter(Boolean) as string[]

  let distResponses: ResponseRow[] = []
  let euResponses: ResponseRow[] = []
  if (campaignIds.length) {
    const { data: responses, error: respErr } = await supabase
      .from('methodology_responses')
      .select('campaign_id, classification, classification_reasoning, response_raw_text')
      .in('campaign_id', campaignIds)
    if (respErr) {
      console.error('[propose] responses lookup failed:', respErr)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
    distResponses = (responses ?? []).filter((r) => r.campaign_id === distId) as ResponseRow[]
    euResponses = (responses ?? []).filter((r) => r.campaign_id === euId) as ResponseRow[]
  }

  const totalResponses = distResponses.length + euResponses.length

  let evidence: DecisionProposal | null = null
  if (totalResponses > 0) {
    // build_fit is factory-internal — carry the desk pass's read into the evidence score.
    const carriedBuildFit = hypothesis.judged.build_fit
    try {
      evidence = await proposeDecision({
        mode: 'evidence',
        product_slug: card.product_slug,
        what_it_is: whatItIs,
        distributor: buildStreamEvidence('distributor-candidate', distResponses),
        endUser: buildStreamEvidence('target-user', euResponses),
        buildFit: {
          score: carriedBuildFit?.score ?? 5,
          rationale: carriedBuildFit?.rationale ?? 'carried from the desk (hypothesis) pass',
        },
      })
    } catch (e) {
      console.error('[propose] evidence pass failed:', e)
      // The hypothesis proposal still stands — surface it, flag the evidence failure.
      return NextResponse.json(
        {
          hypothesis: withRecommendedStatus(hypothesis),
          evidence: null,
          evidence_error: `Evidence scoring failed: ${(e as Error).message}`,
          interview_counts: { distributor: distResponses.length, end_user: euResponses.length },
        },
        { status: 207 }
      )
    }
  }

  return NextResponse.json({
    hypothesis: withRecommendedStatus(hypothesis),
    evidence: evidence ? withRecommendedStatus(evidence) : null,
    interview_counts: { distributor: distResponses.length, end_user: euResponses.length },
  })
}
