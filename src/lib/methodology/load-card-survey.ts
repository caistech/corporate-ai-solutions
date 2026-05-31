// Server-side loader for the survey-gate verdict — the post-build twin of loadCardScore.
//
// Fetches the product's 14 synched field values + mvp_url from product_validation_status,
// does the live mvp_url reachability check (HTTP 200?), then runs the pure scorer (survey.ts)
// against the evidence the survey skill read off the build. Always fresh — recomputed each
// call, mirroring loadCardScore's compute-on-read stance.
//
// One deliberate difference from loadCardScore: the per-field EVIDENCE + PRE-HARD results are
// the survey skill's output (survey.json), supplied by the caller — there is no
// `survey_results` table yet (the readiness side has readiness_results; the survey side defers
// persistence exactly as readiness.ts defers a persisted snapshot — add a survey_results table
// only when an external reader needs the verdict without re-running the skill). The POST route
// passes the freshly-run survey.json in; this loader supplies the DB-side half (the columns +
// the live-URL check) and runs the scorer.

import { supabaseAdmin } from '@/lib/supabase'
import {
  survey,
  isRenovation,
  SURVEY_FIELDS,
  type SurveyField,
  type FieldEvidence,
  type PreHardResult,
  type SurveyResult,
} from './survey'

/** The skill-supplied half: per-field evidence + the PRE-HARD results (survey.json). */
export interface SurveyEvidence {
  evidence: Partial<Record<SurveyField, FieldEvidence>>
  preHard: PreHardResult[]
}

export interface CardSurvey {
  found: boolean
  slug: string
  /** survey-PASSED (RENOVATION) — the value a Stage-5 gate derives from. */
  renovation: boolean
  result?: SurveyResult
}

/** Best-effort live check: does the build answer HTTP 200? HEAD first, GET fallback (some
 *  hosts reject HEAD). Any error / non-200 / timeout ⇒ not ok — which forces TEARDOWN. */
async function urlReturns200(url: string | null): Promise<boolean> {
  if (!url || !/^https?:\/\//i.test(url)) return false
  const probe = async (method: 'HEAD' | 'GET') => {
    try {
      const r = await fetch(url, { method, signal: AbortSignal.timeout(10_000), redirect: 'follow' })
      return r.status === 200
    } catch {
      return false
    }
  }
  return (await probe('HEAD')) || (await probe('GET'))
}

export async function loadCardSurvey(slug: string, skill: SurveyEvidence): Promise<CardSurvey> {
  const supabase = supabaseAdmin()

  const columns = ['mvp_url', ...SURVEY_FIELDS.map((f) => f.field)].join(', ')
  const { data: row } = await supabase
    .from('product_validation_status')
    .select(columns)
    .eq('product_slug', slug)
    .maybeSingle()

  if (!row) return { found: false, slug, renovation: false }

  // The dynamic .select(columns) string widens the row type (it can't be inferred from a
  // runtime-built column list), so narrow through unknown to the flat string columns we read.
  const record = row as unknown as Record<string, string | null>
  const fields: Partial<Record<SurveyField, string | null>> = {}
  for (const { field } of SURVEY_FIELDS) fields[field] = record[field] ?? null

  const mvpUrl = record.mvp_url ?? null
  const mvpUrlOk = await urlReturns200(mvpUrl)

  const result = survey({
    fields,
    evidence: skill.evidence,
    preHard: skill.preHard,
    mvpUrl,
    mvpUrlOk,
  })

  return { found: true, slug, renovation: isRenovation(result), result }
}
