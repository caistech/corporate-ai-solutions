// Server-side loader for the Gate-1 readiness score.
//
// Fetches the ratified catalogue (readiness_criteria), the card's declared `features`,
// and its latest per-check verdicts (readiness_results), then runs the pure scorer
// (score.ts). Always fresh — recomputed from the catalogue + the latest verdicts each
// call (cheap; a single-operator cockpit doesn't need a persisted snapshot yet — defer
// that until an external reader needs the score without recomputing).
//
// Used by BOTH the /score route and the card detail page (direct import, no HTTP round-trip).

import { supabaseAdmin } from '@/lib/supabase'
import { scoreCard, type Criterion, type CheckVerdict, type ScoreResult } from './score'

export interface CardScore {
  found: boolean
  slug: string
  features: string[]
  score?: ScoreResult
}

export async function loadCardScore(slug: string): Promise<CardScore> {
  const supabase = supabaseAdmin()

  const { data: card } = await supabase
    .from('methodology_hypothesis_cards')
    .select('product_slug, features')
    .eq('product_slug', slug)
    .maybeSingle()

  if (!card) return { found: false, slug, features: [] }

  const features: string[] = (card.features as string[] | null) ?? []

  const [{ data: criteria }, { data: results }] = await Promise.all([
    supabase
      .from('readiness_criteria')
      .select('code, check_label, tier, weight, method, applies_when, notes')
      .order('sort_order', { ascending: true }),
    supabase
      .from('readiness_results')
      .select('check_code, status, source, evidence, scored_at')
      .eq('product_slug', slug)
      .order('scored_at', { ascending: false }),
  ])

  const score = scoreCard({
    features,
    criteria: (criteria ?? []) as Criterion[],
    verdicts: (results ?? []) as CheckVerdict[],
  })

  return { found: true, slug, features, score }
}
