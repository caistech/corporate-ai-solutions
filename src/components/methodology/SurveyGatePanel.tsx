// Survey-gate panel (ledger-backed) — the latest recorded survey verdict for this product.
//
// The companion to ReadinessPanel on the card detail page. ReadinessPanel shows the Gate-1
// readiness SCORE (recomputed live from the rubric). This shows the post-build SURVEY VERDICT
// (RENOVATION / TEARDOWN / INCOMPLETE-SPEC) as last recorded to the pipeline_gates ledger by the
// survey route. It reads the ledger row the page already fetched — no recompute, no extra query.
//
// (The full per-field breakdown lives in components/admin/SurveyPanel.tsx; it renders from a
// complete CardSurvey. Surfacing that here would mean persisting each run's survey.json — a
// survey_results table — which is deferred. Until then this panel surfaces the recorded verdict.)

/** The subset of a pipeline_gates row this panel renders (structurally a GateRecord). */
export interface SurveyGateRecord {
  status: 'pass' | 'fail'
  reason: string | null
  deployment_id: string | null
  artifact_ref: string | null
  recorded_by: string
  created_at: string
}

type Verdict = 'RENOVATION' | 'TEARDOWN' | 'INCOMPLETE-SPEC' | 'UNKNOWN'

const VERDICT_STYLE: Record<Verdict, { box: string; text: string }> = {
  RENOVATION: { box: 'border-emerald-500/40 bg-emerald-500/10', text: 'text-emerald-300' },
  TEARDOWN: { box: 'border-yellow-500/40 bg-yellow-500/10', text: 'text-yellow-300' },
  'INCOMPLETE-SPEC': { box: 'border-red-500/40 bg-red-500/10', text: 'text-red-300' },
  UNKNOWN: { box: 'border-gray-border bg-gray-dark/40', text: 'text-gray-light' },
}

/** The route records reason as "VERDICT → next stage · evidenced X/14 · PRE-HARD …".
 *  Recover the verdict from the leading token; fall back to the pass/fail status. */
function parseVerdict(rec: SurveyGateRecord): Verdict {
  const head = (rec.reason ?? '').trim().split(/[\s→]/)[0]?.toUpperCase()
  if (head === 'RENOVATION' || head === 'TEARDOWN' || head === 'INCOMPLETE-SPEC') return head
  return rec.status === 'pass' ? 'RENOVATION' : 'UNKNOWN'
}

export function SurveyGatePanel({ gate }: { gate: SurveyGateRecord | null }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold mb-2">Survey gate (the build&rsquo;s verdict)</h2>
      <p className="mb-4 text-sm text-gray-light/80 max-w-2xl">
        The post-build verdict on the live MVP — recorded by survey mode against what the site/repo
        actually evidences. <span className="text-emerald-300">RENOVATION</span> advances to Stage 5;{' '}
        <span className="text-yellow-300">TEARDOWN</span> re-enters Stage 2 design&rarr;build;{' '}
        <span className="text-red-300">INCOMPLETE-SPEC</span> goes back to fill the card.
      </p>

      {!gate ? (
        <p className="rounded-lg border border-gray-border bg-gray-dark/40 p-4 text-sm text-gray-light/70">
          No survey recorded yet. Run <code className="text-accent">survey mode</code> against the live
          build — it scores the 14 evidenced fields + the PRE-HARD checks and records the verdict here.
        </p>
      ) : (
        (() => {
          const verdict = parseVerdict(gate)
          const s = VERDICT_STYLE[verdict]
          const when = new Date(gate.created_at)
          const dot = (gate.reason ?? '').indexOf('·')
          const detail = dot >= 0 ? (gate.reason ?? '').slice(dot + 1).trim() : null // after the first "·"
          return (
            <div className={`rounded-lg border p-5 ${s.box}`}>
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className={`text-2xl font-bold uppercase tracking-wider ${s.text}`}>{verdict}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded uppercase tracking-wider ${
                    gate.status === 'pass' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  gate {gate.status}
                </span>
              </div>
              {detail && <p className="mt-2 text-sm text-gray-light/80">{detail}</p>}
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-light/60">
                <span>
                  Recorded {when.toLocaleString()} by <span className="font-mono">{gate.recorded_by}</span>
                </span>
                {gate.deployment_id ? (
                  <span>
                    Bound to deployment <span className="font-mono">{gate.deployment_id.slice(0, 12)}…</span>
                  </span>
                ) : (
                  <span className="text-yellow-300/70">Unbound — provisional (not tied to a deployment)</span>
                )}
                {gate.artifact_ref && (
                  <span className="font-mono break-all">{gate.artifact_ref}</span>
                )}
              </div>
            </div>
          )
        })()
      )}
    </section>
  )
}

export default SurveyGatePanel
