// Survey-gate panel — the build's verdict, rendered transparently.
//
// Server component. The post-build twin of ReadinessPanel: where that renders the Gate-1
// readiness score, this renders the result of the pure survey scorer (lib/methodology/survey.ts),
// loaded server-side via loadCardSurvey. It shows the three-door verdict
// (RENOVATION / TEARDOWN / INCOMPLETE-SPEC), the spec-presence count, the site-evidence
// percentage (survey_pct), the live-MVP check, the PRE-HARD gate, the "what to fix to reach
// RENOVATION" list, and the full per-field breakdown (present + evidenced + the citation).
// This is what makes the survey verdict PROVEN by what the build actually evidences, not asserted.

import type { CardSurvey } from '@/lib/methodology/load-card-survey'
import { MIN_EVIDENCED, SURVEY_FIELD_COUNT, type SurveyVerdict } from '@/lib/methodology/survey'

const VERDICT: Record<SurveyVerdict, { box: string; text: string; blurb: string }> = {
  RENOVATION: {
    box: 'border-emerald-500/40 bg-emerald-500/10',
    text: 'text-emerald-300',
    blurb: 'Spec complete, the live build evidences it, and the PRE-HARD checks pass — proceed to Stage 5.',
  },
  TEARDOWN: {
    box: 'border-yellow-500/40 bg-yellow-500/10',
    text: 'text-yellow-300',
    blurb: 'Spec is complete but the build does not yet evidence it (no live site, < 80% evidenced, or a PRE-HARD fails) — re-enter Stage 2 design→build.',
  },
  'INCOMPLETE-SPEC': {
    box: 'border-red-500/40 bg-red-500/10',
    text: 'text-red-300',
    blurb: 'Fewer than 14 fields are filled — there is no complete spec to survey a build against yet. Back to Stage 1/2 to fill the card.',
  },
}

const CHECK_PILL: Record<string, string> = {
  pass: 'bg-emerald-500/20 text-emerald-300',
  fail: 'bg-red-500/20 text-red-300',
  unknown: 'bg-yellow-500/20 text-yellow-300',
}

const CHECK_WORD: Record<string, string> = {
  pass: 'pass',
  fail: 'fail',
  unknown: 'not tested',
}

const fieldPill = (present: boolean, evidenced: boolean): { cls: string; word: string } => {
  if (!present) return { cls: 'bg-gray-mid/40 text-gray-light/50', word: 'no spec' }
  if (evidenced) return { cls: 'bg-emerald-500/20 text-emerald-300', word: 'evidenced' }
  return { cls: 'bg-yellow-500/20 text-yellow-300', word: 'no evidence' }
}

export function SurveyPanel({ data }: { data: CardSurvey }) {
  const r = data.result
  if (!r) return null

  const v = VERDICT[r.verdict]
  const pctText = `${Math.round(r.site.pct * 100)}%`

  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold mb-2">Survey gate (the build&rsquo;s verdict)</h2>
      <p className="mb-4 text-sm text-gray-light/80 max-w-2xl">
        The survey&rsquo;s verdict on the live build — does it evidence the spec on the site/repo,
        or not? The spec must be complete first; then the build must show a live MVP,
        evidence <span className="text-emerald-300">&ge; {MIN_EVIDENCED}/{SURVEY_FIELD_COUNT}</span> fields,
        and pass <span className="text-emerald-300">PRE-HARD P1/P2/P3</span> to be a{' '}
        <span className="text-emerald-300">RENOVATION</span> (else{' '}
        <span className="text-yellow-300">TEARDOWN</span>; an incomplete spec is{' '}
        <span className="text-red-300">INCOMPLETE-SPEC</span>).
      </p>

      {/* Headline — the verdict. */}
      <div className={`rounded-lg border p-5 ${v.box}`}>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className={`text-2xl font-bold uppercase tracking-wider ${v.text}`}>{r.verdict}</span>
          <span className="text-sm text-gray-light/70">&rarr; {r.nextStage}</span>
        </div>
        <p className="mt-2 text-sm text-gray-light/80">{v.blurb}</p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-light/70">
          <span>
            Spec: <span className="text-white">{r.spec.present}/{r.spec.total}</span> filled
          </span>
          <span>
            Evidenced: <span className={r.site.meetsThreshold ? 'text-emerald-300' : 'text-yellow-300'}>{r.site.evidencedCount}/{r.site.total}</span> ({pctText})
          </span>
          <span>
            Live MVP: <span className={r.mvp.ok ? 'text-emerald-300' : 'text-red-300'}>{r.mvp.ok ? 'reachable' : 'not reachable'}</span>
          </span>
          <span>
            PRE-HARD: <span className={r.preHard.passed ? 'text-emerald-300' : 'text-red-300'}>{r.preHard.passed ? 'pass' : 'fail'}</span>
          </span>
        </div>
        {r.mvp.url && (
          <p className="mt-2 text-xs text-gray-light/50 font-mono break-all">{r.mvp.url}</p>
        )}
      </div>

      {/* PRE-HARD checks. */}
      <div className="mt-4 rounded-lg border border-gray-border bg-gray-dark/40 p-4">
        <p className="text-xs uppercase tracking-wider text-accent font-medium mb-2">PRE-HARD checks (P1/P2/P3 gate · P4 informational)</p>
        <ul className="space-y-1.5">
          {r.preHard.results.length === 0 && (
            <li className="text-sm text-gray-light/60">No PRE-HARD results recorded by the survey skill yet.</li>
          )}
          {r.preHard.results.map((p) => (
            <li key={p.code} className="flex flex-wrap items-center gap-2 text-sm">
              <span className={`shrink-0 text-xs px-2 py-0.5 rounded uppercase tracking-wider ${CHECK_PILL[p.status] ?? CHECK_PILL.unknown}`}>
                {CHECK_WORD[p.status] ?? p.status}
              </span>
              <span className="font-mono text-xs text-gray-light/60">{p.code}</span>
              {p.evidence && <span className="text-gray-light/60 italic">{p.evidence}</span>}
            </li>
          ))}
        </ul>
      </div>

      {/* What to fix to reach RENOVATION. */}
      {r.toReach.length > 0 && (
        <div className="mt-4 rounded-lg border border-gray-border bg-gray-dark/40 p-4">
          <p className="text-xs uppercase tracking-wider text-accent font-medium mb-2">To reach RENOVATION</p>
          <ul className="space-y-1.5">
            {r.toReach.slice(0, 10).map((t) => (
              <li key={t.code} className="flex flex-wrap items-baseline gap-2 text-sm">
                <span className="font-mono text-xs text-gray-light/60">{t.code}</span>
                <span className="text-white">{t.label}</span>
                <span className="text-gray-light/70">&mdash; {t.need}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Full per-field breakdown — present (spec) + evidenced (site) + the citation. */}
      <details className="mt-4 rounded-lg border border-gray-border bg-gray-dark/40 p-4">
        <summary className="text-sm text-accent cursor-pointer hover:underline">
          All {r.fields.length} fields — full breakdown
        </summary>
        <div className="mt-3 space-y-1.5">
          {r.fields.map((f) => {
            const pill = fieldPill(f.present, f.evidenced)
            return (
              <div key={f.field} className="flex flex-wrap items-center gap-2 text-sm">
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded uppercase tracking-wider ${pill.cls}`}>
                  {pill.word}
                </span>
                <span className="font-mono text-xs text-gray-light/50">{f.field}</span>
                <span className={f.present ? 'text-gray-light' : 'text-gray-light/50'}>{f.label}</span>
                {f.evidence && (
                  <p className="w-full text-xs text-gray-light/50 italic pl-2">{f.evidence}</p>
                )}
              </div>
            )
          })}
        </div>
      </details>
    </section>
  )
}

export default SurveyPanel
