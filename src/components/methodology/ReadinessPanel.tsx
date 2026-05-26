// Gate-1 readiness panel — the harness's verdict, rendered transparently.
//
// Server component. Renders the result of the pure scorer (lib/methodology/score.ts),
// loaded server-side via loadCardScore: the HARD-gate state, the GO/REDESIGN/NO-GO band
// (only once the HARD gate passes), the "what to fix to reach GO" list, and the full
// per-check breakdown (status + source + evidence). This is what makes Gate-1 readiness
// PROVEN by the rubric + recorded audits, not asserted by an operator tickbox.

import type { CardScore } from '@/lib/methodology/readiness'

const STATUS_PILL: Record<string, string> = {
  pass: 'bg-emerald-500/20 text-emerald-300',
  fail: 'bg-red-500/20 text-red-300',
  unknown: 'bg-yellow-500/20 text-yellow-300',
  na: 'bg-gray-mid/40 text-gray-light/50',
}

const STATUS_WORD: Record<string, string> = {
  pass: 'pass',
  fail: 'fail',
  unknown: 'not tested',
  na: 'n/a',
}

const BAND: Record<string, { box: string; text: string }> = {
  GO: { box: 'border-emerald-500/40 bg-emerald-500/10', text: 'text-emerald-300' },
  REDESIGN: { box: 'border-yellow-500/40 bg-yellow-500/10', text: 'text-yellow-300' },
  'NO-GO': { box: 'border-red-500/40 bg-red-500/10', text: 'text-red-300' },
}

export function ReadinessPanel({ data }: { data: CardScore }) {
  const s = data.score
  if (!s) return null

  const headline = s.gate1Ready && s.band
    ? BAND[s.band]
    : { box: 'border-red-500/40 bg-red-500/10', text: 'text-red-300' }

  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold mb-2">Gate-1 readiness (the score)</h2>
      <p className="mb-4 text-sm text-gray-light/80 max-w-2xl">
        The harness&rsquo;s verdict on whether the thin MVP is ready — computed from the ratified
        rubric and the recorded audits, not a tickbox. Every applicable <strong className="text-white">HARD</strong>{' '}
        check must pass before a score is even computed; then the weighted checks set the band
        (<span className="text-emerald-300">GO ≥6.5</span> · <span className="text-yellow-300">REDESIGN 5.0–6.4</span> · <span className="text-red-300">NO-GO &lt;5.0</span>).
      </p>

      {data.features.length === 0 && (
        <p className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-200">
          This card has no features set, so every conditional check (voice / auth / Supabase / …) reads
          N/A. Set the product&rsquo;s features in Pipeline fields below so its conditional checks apply.
        </p>
      )}

      {/* Headline — band + score, or the HARD-gate block. */}
      <div className={`rounded-lg border p-5 ${headline.box}`}>
        {s.gate1Ready && s.band ? (
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className={`text-2xl font-bold uppercase tracking-wider ${headline.text}`}>{s.band}</span>
            <span className="text-2xl font-bold text-white">{s.score?.toFixed(1)}<span className="text-base text-gray-light/60">/10</span></span>
            <span className="text-sm text-gray-light/70">
              HARD gate passed · {s.weighted.earned}/{s.weighted.possible} weighted pts
            </span>
          </div>
        ) : (
          <div>
            <p className={`text-lg font-bold ${headline.text}`}>Not Gate-1-ready — HARD gate not passed</p>
            <p className="mt-1 text-sm text-gray-light/80">
              {s.hardGate.total - s.hardGate.failing.length} of {s.hardGate.total} applicable HARD checks
              pass. No score is computed until every HARD check passes.
            </p>
            <ul className="mt-3 space-y-1">
              {s.hardGate.failing.map((f) => (
                <li key={f.code} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded uppercase tracking-wider ${STATUS_PILL[f.status] ?? STATUS_PILL.unknown}`}>
                    {STATUS_WORD[f.status] ?? f.status}
                  </span>
                  <span className="font-mono text-xs text-gray-light/60">{f.code}</span>
                  <span className="text-gray-light">{f.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* TOO-MUCH guard — scale-infra present pre-GO. */}
      {s.tooMuch.flagged && (
        <div className="mt-4 rounded-lg border border-orange-500/40 bg-orange-500/10 p-4">
          <p className="text-sm font-semibold text-orange-300">Over-build flag — scale-infra present pre-GO</p>
          <ul className="mt-2 space-y-1">
            {s.tooMuch.checks.map((c) => (
              <li key={c.code} className="text-sm text-gray-light">
                <span className="font-mono text-xs text-gray-light/60">{c.code}</span> {c.label}
                {c.evidence && <span className="text-gray-light/60 italic"> — {c.evidence}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* What to fix to reach GO. */}
      {s.toReachGo.length > 0 && (
        <div className="mt-4 rounded-lg border border-gray-border bg-gray-dark/40 p-4">
          <p className="text-xs uppercase tracking-wider text-accent font-medium mb-2">To reach GO</p>
          <ul className="space-y-1.5">
            {s.toReachGo.slice(0, 8).map((t) => (
              <li key={t.code} className="flex flex-wrap items-baseline gap-2 text-sm">
                <span className="font-mono text-xs text-gray-light/60">{t.code}</span>
                <span className="text-white">{t.label}</span>
                <span className="text-gray-light/70">— {t.need}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Full per-check breakdown. */}
      <details className="mt-4 rounded-lg border border-gray-border bg-gray-dark/40 p-4">
        <summary className="text-sm text-accent cursor-pointer hover:underline">
          All {s.checks.length} checks — full breakdown
        </summary>
        <div className="mt-3 space-y-1.5">
          {s.checks.map((c) => (
            <div key={c.code} className="flex flex-wrap items-center gap-2 text-sm">
              <span className={`shrink-0 text-xs px-2 py-0.5 rounded uppercase tracking-wider ${STATUS_PILL[c.status] ?? STATUS_PILL.na}`}>
                {STATUS_WORD[c.status] ?? c.status}
              </span>
              <span className="font-mono text-xs text-gray-light/50">{c.code}</span>
              <span className={c.applicable ? 'text-gray-light' : 'text-gray-light/50'}>{c.label}</span>
              <span className="text-xs text-gray-light/40">{c.tier}{c.weight ? ` · ${c.weight}` : ''}</span>
              {!c.applicable && c.reason && (
                <span className="text-xs text-gray-light/40 italic">— {c.reason}</span>
              )}
              {c.applicable && c.source && (
                <span className="ml-auto text-xs text-gray-light/40 font-mono">{c.source}</span>
              )}
              {c.applicable && c.evidence && (
                <p className="w-full text-xs text-gray-light/50 italic pl-2">{c.evidence}</p>
              )}
            </div>
          ))}
        </div>
      </details>
    </section>
  )
}

export default ReadinessPanel
