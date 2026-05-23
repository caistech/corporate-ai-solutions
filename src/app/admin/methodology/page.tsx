// @explanatory-header-exempt — admin-internal page (Session 1 stub); operator-only surface
import { Metadata } from 'next'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'

export const metadata: Metadata = {
  title: 'Methodology — Hypothesis Cards',
  description: 'Phase Zero backfill index — distributor-discovery methodology.',
}

export const dynamic = 'force-dynamic'

interface HypothesisCard {
  id: string
  product_slug: string
  origin_summary: string | null
  status: string
  hypothesis_rows: unknown[] | null
  updated_at: string
}

export default async function MethodologyIndexPage() {
  const supabase = supabaseAdmin()
  const { data, error } = await supabase
    .from('methodology_hypothesis_cards')
    .select('id, product_slug, origin_summary, status, hypothesis_rows, updated_at')
    .order('updated_at', { ascending: false })

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-4 text-red-300">Could not load Hypothesis Cards</h1>
        <p className="text-sm text-gray-light">
          Supabase returned: <code className="text-red-300">{error.message}</code>. Make sure migration
          <code>20260523000001_methodology.sql</code> has been pushed (<code>supabase db push</code>).
        </p>
      </div>
    )
  }

  const cards = (data ?? []) as HypothesisCard[]

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-wider text-accent font-medium mb-3">
          Methodology · Phase Zero backfill
        </p>
        <h1 className="text-3xl font-bold mb-4">Hypothesis Cards</h1>
        <p className="text-base text-gray-light max-w-2xl">
          One card per portfolio product in <code>constants.ts</code>. Each captures the
          Phase Zero-A dialogue output (origin, end-user, hypothesised distributors) and
          links to the Phase Zero-B validation campaigns running on InvestorPilot.
        </p>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-lg border border-gray-border bg-gray-dark/40 p-8 text-center">
          <p className="text-gray-light mb-2">No Hypothesis Cards yet.</p>
          <p className="text-sm text-gray-light/70">
            Run Phase Zero-A dialogue sessions per product and POST to
            <code className="ml-1">/api/methodology/cards</code>.
          </p>
        </div>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-border text-left text-xs uppercase tracking-wider text-gray-light/70">
              <th className="py-3 px-3">Product slug</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Hypotheses</th>
              <th className="py-3 px-3">Updated</th>
              <th className="py-3 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {cards.map((card) => (
              <tr key={card.id} className="border-b border-gray-border/40">
                <td className="py-3 px-3 font-mono text-white">{card.product_slug}</td>
                <td className="py-3 px-3">
                  <span className="text-xs px-2 py-1 rounded bg-accent/10 text-accent uppercase tracking-wider">
                    {card.status}
                  </span>
                </td>
                <td className="py-3 px-3 text-gray-light">
                  {Array.isArray(card.hypothesis_rows) ? card.hypothesis_rows.length : 0} rows
                </td>
                <td className="py-3 px-3 text-gray-light/70 text-xs">
                  {new Date(card.updated_at).toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right">
                  <Link
                    href={`/admin/methodology/${card.product_slug}`}
                    className="text-accent hover:underline text-xs"
                  >
                    Open →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="mt-8 text-xs text-gray-light/60">
        Session 1 stub. Session 2 adds per-card detail view, classification pipeline, and live
        campaign-status badges from the InvestorPilot sync.
      </p>
    </div>
  )
}
