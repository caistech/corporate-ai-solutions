import { NextRequest, NextResponse } from 'next/server'
import { loadCardScore } from '@/lib/methodology/readiness'

/**
 * GET /api/methodology/cards/[slug]/score
 *
 * Computes the card's Gate-1 readiness on demand — always fresh from the ratified
 * readiness_criteria catalogue + the card's latest recorded per-check verdicts
 * (readiness_results), via the pure scorer (lib/methodology/score.ts).
 *
 * Read-only: no side effects, no cost. Returns the full ScoreResult (HARD-gate state,
 * the GO/REDESIGN/NO-GO band once the gate passes, the per-check breakdown, and the
 * "what to fix to reach GO" list) so the cockpit can render the transparent score.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const result = await loadCardScore(params.slug)
    if (!result.found) {
      return NextResponse.json({ error: 'Hypothesis Card not found' }, { status: 404 })
    }
    return NextResponse.json(result)
  } catch (e) {
    console.error('API error (GET /api/methodology/cards/[slug]/score):', e)
    return NextResponse.json({ error: 'Failed to compute readiness score' }, { status: 500 })
  }
}
