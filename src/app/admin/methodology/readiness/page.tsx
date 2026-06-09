import { Metadata } from 'next'
import Link from 'next/link'
import { unstable_noStore as noStore } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'

export const metadata: Metadata = {
  title: 'Gate-1 readiness criteria — Methodology',
  description: 'The ratified 46-check thin-MVP / Gate-1 readiness classification.',
}

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

interface Criterion {
  code: string
  check_label: string
  source: string | null
  method: string | null
  relevance: string | null
  tier: string
  weight: string | null
  notes: string | null
  sort_order: number
}

// Tier presentation — order = how they read down the page, blocking first.
const TIER_ORDER = [
  'HARD',
  'CONDITIONAL-HARD',
  'WEIGHTED',
  'CONDITIONAL-WEIGHTED',
  'TOO-MUCH',
  'DEFER',
] as const

const TIER_META: Record<
  string,
  { label: string; blurb: string; color: string }
> = {
  HARD: {
    label: 'HARD',
    blurb: 'Blocks the Gate-1 Launch button. No waiver.',
    color: 'border-red-500/40 bg-red-500/10 text-red-200',
  },
  'CONDITIONAL-HARD': {
    label: 'CONDITIONAL-HARD',
    blurb: 'Blocks only when that feature is in scope (auth / voice / IP / Supabase).',
    color: 'border-orange-500/40 bg-orange-500/10 text-orange-200',
  },
  WEIGHTED: {
    label: 'WEIGHTED',
    blurb: 'Feeds the GO / REDESIGN / NO-GO score (waivable). Carries a weight.',
    color: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-200',
  },
  'CONDITIONAL-WEIGHTED': {
    label: 'CONDITIONAL-WEIGHTED',
    blurb: 'Weighted only when that feature exists.',
    color: 'border-amber-500/30 bg-amber-500/5 text-amber-200',
  },
  'TOO-MUCH': {
    label: 'TOO-MUCH',
    blurb: 'Inverse guard — its presence pre-GO is itself an over-build flag.',
    color: 'border-purple-500/40 bg-purple-500/10 text-purple-200',
  },
  DEFER: {
    label: 'DEFER',
    blurb: 'Scale-infra; not scored at Gate 1 (re-enters at Gate 2 / Tier-1).',
    color: 'border-gray-border bg-gray-dark/40 text-gray-light/70',
  },
}

const WEIGHT_COLOR: Record<string, string> = {
  High: 'bg-emerald-500/20 text-emerald-300',
  Med: 'bg-blue-500/20 text-blue-300',
  Low: 'bg-gray-mid/40 text-gray-light',
}

export default async function ReadinessCriteriaPage() {
  noStore()
  const supabase = supabaseAdmin()
  const { data, error } = await supabase
    .from('readiness_criteria')
    .select('code, check_label, source, method, relevance, tier, weight, notes, sort_order')
    .order('sort_order', { ascending: true })

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-4 text-red-300">Could not load readiness criteria</h1>
        <p className="text-sm text-gray-light">
          Supabase returned: <code className="text-red-300">{error.message}</code>. Make sure migration{' '}
          <code>20260526000000_readiness_criteria.sql</code> has been pushed.
        </p>
      </div>
    )
  }

  const criteria = (data ?? []) as Criterion[]
  const byTier = new Map<string, Criterion[]>()
  for (const c of criteria) {
    if (!byTier.has(c.tier)) byTier.set(c.tier, [])
    byTier.get(c.tier)!.push(c)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-gray-border bg-gray-dark/40 px-4 py-3">
        <Link
          href="/admin/methodology"
          className="inline-flex min-h-[44px] items-center text-sm text-accent hover:underline"
        >
          ← Pipeline cockpit
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center text-sm text-gray-light/70 hover:text-white"
        >
          Home
        </Link>
      </div>

      {/* Explanatory header — what / do / why. */}
      <div className="mb-8">
        <p className="text-sm uppercase tracking-wider text-accent font-medium mb-3">
          Methodology · Gate-1 readiness
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Gate-1 readiness criteria</h1>
        <p className="text-base text-gray-light max-w-2xl">
          The {criteria.length} checks that decide whether a thin MVP is ready for the validation
          outreach link. Each was ratified in the GATE_READINESS_REVIEW sign-off. Read it to know what
          will <span className="text-white">block</span> a launch versus what merely{' '}
          <span className="text-white">scores</span> it — so you fix the right things before flipping
          Gate&nbsp;1 on a card. This is the policy the cockpit applies; it is not editable here.
        </p>
      </div>

      {/* How the gate runs */}
      <section className="mb-8 rounded-lg border border-accent/30 bg-accent/5 p-5">
        <p className="text-xs uppercase tracking-wider text-accent font-medium mb-3">How the gate runs</p>
        <ol className="list-decimal ml-5 space-y-1 text-sm text-gray-light">
          <li>Decide which CONDITIONAL-* checks are in scope for this slice (else N/A).</li>
          <li>
            Every applicable HARD + CONDITIONAL-HARD check must pass, or the slice is{' '}
            <span className="text-white">not Gate-1-ready</span> and the Launch button stays blocked.
          </li>
          <li>TOO-MUCH (P4) trips if scale-infra is present pre-GO — an over-build flag.</li>
          <li>
            With the HARD gate passed, the WEIGHTED checks form a weighted composite →{' '}
            <span className="text-white">GO ≥ 6.5 · REDESIGN 5.0–6.4 · NO-GO &lt; 5.0</span> (bands
            calibrated on the first real run).
          </li>
        </ol>
      </section>

      {TIER_ORDER.filter((t) => byTier.has(t)).map((tier) => {
        const meta = TIER_META[tier]
        const items = byTier.get(tier)!
        return (
          <section key={tier} className="mb-8">
            <div className={`mb-3 rounded-lg border px-4 py-2 ${meta.color}`}>
              <span className="font-mono text-sm font-semibold uppercase tracking-wider">
                {meta.label}
              </span>
              <span className="ml-2 text-sm opacity-90">· {items.length}</span>
              <p className="mt-1 text-sm opacity-90">{meta.blurb}</p>
            </div>
            <div className="space-y-2">
              {items.map((c) => (
                <div
                  key={c.code}
                  className="rounded-lg border border-gray-border bg-gray-dark/40 p-3 sm:p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 font-mono text-xs text-accent w-8 pt-0.5">{c.code}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white">{c.check_label}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                        {c.weight && (
                          <span
                            className={`px-2 py-0.5 rounded uppercase tracking-wider ${
                              WEIGHT_COLOR[c.weight] ?? 'bg-gray-mid/40 text-gray-light'
                            }`}
                          >
                            {c.weight}
                          </span>
                        )}
                        {c.relevance && (
                          <span className="px-2 py-0.5 rounded bg-gray-mid/30 text-gray-light/70 font-mono">
                            {c.relevance}
                          </span>
                        )}
                        {c.method && (
                          <span className="text-gray-light/50 font-mono">{c.method}</span>
                        )}
                        {c.source && <span className="text-gray-light/50">· {c.source}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
