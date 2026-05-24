// @explanatory-header-exempt — admin-internal page (Session 1 stub); operator-only surface
import { Metadata } from 'next'
import Link from 'next/link'
import { unstable_noStore as noStore } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { PLATFORMS } from '@/lib/constants'
import { AddChosenProduct, type AvailableProduct } from '@/components/methodology/AddChosenProduct'
import { AddNewIdea } from '@/components/methodology/AddNewIdea'

export const metadata: Metadata = {
  title: 'Pipeline cockpit — Methodology',
  description: 'The pipeline front door: chosen products, Gate 1, and dual-stream research kick-off.',
}

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

interface HypothesisCard {
  id: string
  product_slug: string
  origin_summary: string | null
  status: string
  hypothesis_rows: unknown[] | null
  updated_at: string
  build_status: string | null
  mvp_ready: boolean | null
  mvp_url: string | null
  monetisation_lane: string | null
  pipeline_stage: string | null
}

export default async function MethodologyIndexPage() {
  noStore()
  const supabase = supabaseAdmin()
  const { data, error } = await supabase
    .from('methodology_hypothesis_cards')
    .select(
      'id, product_slug, origin_summary, status, hypothesis_rows, updated_at, build_status, mvp_ready, mvp_url, monetisation_lane, pipeline_stage'
    )
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

  const cardedSlugs = new Set(cards.map((c) => c.product_slug))
  const available: AvailableProduct[] = PLATFORMS.filter(
    (p) => p.type === 'parent' && !cardedSlugs.has(p.slug)
  ).map((p) => ({ slug: p.slug, name: p.name, url: p.url ?? '' }))

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-wider text-accent font-medium mb-3">
          Methodology · Pipeline cockpit
        </p>
        <h1 className="text-3xl font-bold mb-4">Pipeline cockpit</h1>
        <p className="text-base text-gray-light max-w-2xl">
          The pipeline front door. Add a chosen product to the workflow, set Gate 1 (thin-MVP
          ready), and kick off dual-stream research on InvestorPilot — the outreach embeds the
          MVP link. New ideas also arrive here from the ideation agent. Each row is a card moving
          through the stages toward the Gate 2 go/no-go.
        </p>
      </div>

      <div className="mb-8 space-y-4">
        <AddChosenProduct available={available} />
        <AddNewIdea />
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-gray-border text-left text-xs uppercase tracking-wider text-gray-light/70">
                <th className="py-3 px-3">Product</th>
                <th className="py-3 px-3">Stage</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Build</th>
                <th className="py-3 px-3">Gate 1</th>
                <th className="py-3 px-3">Lane</th>
                <th className="py-3 px-3">Updated</th>
                <th className="py-3 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => {
                const gate1Open = Boolean(card.mvp_ready && card.mvp_url)
                return (
                  <tr key={card.id} className="border-b border-gray-border/40">
                    <td className="py-3 px-3 font-mono text-white">{card.product_slug}</td>
                    <td className="py-3 px-3 text-gray-light text-xs">
                      {card.pipeline_stage ?? 'ideation'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-xs px-2 py-1 rounded bg-accent/10 text-accent uppercase tracking-wider">
                        {card.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-light text-xs">
                      {card.build_status ?? 'none'}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-xs px-2 py-1 rounded uppercase tracking-wider ${
                          gate1Open
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-gray-mid/40 text-gray-light/70'
                        }`}
                        title={
                          gate1Open
                            ? 'MVP ready — research kick-off unlocked'
                            : 'No MVP link / not marked ready — kick-off blocked'
                        }
                      >
                        {gate1Open ? 'ready' : 'blocked'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-light/70 text-xs">
                      {card.monetisation_lane ?? '—'}
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
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-8 text-xs text-gray-light/60">
        Gate 1 (MVP-ready) releases the research; Gate 2 (validated demand) releases the full build.
        Seeded products start <span className="text-gray-light">blocked</span> — open a card to set
        its MVP link and flip Gate 1, then launch the dual-stream kick-off.
      </p>
    </div>
  )
}
