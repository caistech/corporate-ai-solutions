import { Metadata } from 'next'
import Link from 'next/link'
import { unstable_noStore as noStore } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { PLATFORMS } from '@/lib/constants'
import { AddChosenProduct, type AvailableProduct } from '@/components/methodology/AddChosenProduct'
import { AddNewIdea } from '@/components/methodology/AddNewIdea'
import { BoardTable, type BoardCard } from '@/components/methodology/BoardTable'
import { IdeationInbox, type InboxCard } from '@/components/methodology/IdeationInbox'
import { computeIntakeGate, type IntakeGateCard } from '@/lib/methodology-intake-gate'

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
  archived_at: string | null
  intake_source: string | null
  inbox: boolean | null
  build_type: string | null
}

export default async function MethodologyIndexPage() {
  noStore()
  const supabase = supabaseAdmin()
  const { data, error } = await supabase
    .from('methodology_hypothesis_cards')
    .select(
      'id, product_slug, origin_summary, status, hypothesis_rows, updated_at, build_status, mvp_ready, mvp_url, monetisation_lane, pipeline_stage, archived_at, intake_source, inbox, build_type'
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

  // Resolve a human display name from PLATFORMS so the board shows the product
  // name, not just the slug (free-form ideas with no PLATFORMS entry fall back
  // to the slug). No schema change — purely a read-side join.
  const nameBySlug = new Map(PLATFORMS.map((p) => [p.slug, p.name]))
  const displayName = (slug: string) => nameBySlug.get(slug) ?? null

  // Ideation-agent deposits not yet promoted sit in the inbox — shown separately
  // and excluded from both the board and the intake gate (Rule 16 carve-out).
  const inboxCards: InboxCard[] = cards
    .filter((c) => c.inbox)
    .map((c) => ({
      id: c.id,
      product_slug: c.product_slug,
      display_name: displayName(c.product_slug),
      origin_summary: c.origin_summary,
      updated_at: c.updated_at,
    }))

  const onBoard = cards.filter((c) => !c.inbox)

  const cardedSlugs = new Set(cards.map((c) => c.product_slug))
  const available: AvailableProduct[] = PLATFORMS.filter(
    (p) => p.type === 'parent' && !cardedSlugs.has(p.slug)
  ).map((p) => ({ slug: p.slug, name: p.name, url: p.url ?? '' }))

  // Every slug already spoken for — carded cards + every PLATFORMS slug. The new-idea
  // form blocks collisions against this so a fresh idea can't duplicate an existing one.
  const existingSlugs = Array.from(
    new Set(cards.map((c) => c.product_slug).concat(PLATFORMS.map((p) => p.slug)))
  )

  const boardCards: BoardCard[] = onBoard.map((c) => ({
    id: c.id,
    product_slug: c.product_slug,
    display_name: displayName(c.product_slug),
    status: c.status,
    pipeline_stage: c.pipeline_stage,
    build_status: c.build_status,
    monetisation_lane: c.monetisation_lane,
    updated_at: c.updated_at,
    mvp_ready: c.mvp_ready,
    mvp_url: c.mvp_url,
    archived_at: c.archived_at,
    build_type: c.build_type,
  }))

  // RULE 16 — the intake WIP gate. Computed from the on-board cards (inbox
  // excluded by construction). Manual intake is open only when zero are untriaged.
  const gate = computeIntakeGate(
    onBoard.map(
      (c): IntakeGateCard => ({
        product_slug: c.product_slug,
        display_name: displayName(c.product_slug),
        status: c.status,
        pipeline_stage: c.pipeline_stage,
        archived_at: c.archived_at,
        inbox: c.inbox,
      })
    )
  )

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Cockpit-local top bar — clear title + a way home that works on mobile
          independent of the global marketing header. */}
      <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-gray-border bg-gray-dark/40 px-4 py-3">
        <span className="text-sm font-semibold text-white">Methodology cockpit</span>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/methodology/readiness"
            className="inline-flex min-h-[44px] items-center text-sm text-accent hover:underline"
          >
            Gate-1 criteria
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center text-sm text-gray-light/70 hover:text-white"
          >
            Home
          </Link>
        </div>
      </div>

      <div className="mb-8">
        <p className="text-sm uppercase tracking-wider text-accent font-medium mb-3">
          Methodology · Pipeline cockpit
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Pipeline cockpit</h1>
        <p className="text-base text-gray-light max-w-2xl">
          The pipeline front door. Add a chosen product to the workflow, set Gate 1 (thin-MVP
          ready), and kick off dual-stream research on InvestorPilot — the outreach embeds the
          MVP link. New ideas also arrive here from the ideation agent. Each card moves
          through the stages toward the Gate 2 go/no-go.
        </p>
      </div>

      {/* Gate 0 — the intake WIP gate (Rule 16). Open only when the board is
          fully triaged. Blocked → manual intake is disabled below until the
          backlog is drained (or force-admitted with a logged reason). */}
      {gate.open ? (
        <div className="mb-6 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
          <p className="text-sm text-emerald-200">
            <span className="font-semibold">Intake open</span> — the board is triaged. Every card is
            in research or terminally decided. Add a new product or idea below.
          </p>
        </div>
      ) : (
        <div className="mb-6 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3">
          <p className="text-sm font-semibold text-yellow-200">
            Intake blocked — drain the backlog first ({gate.untriagedCount} untriaged)
          </p>
          <p className="mt-1 text-sm text-yellow-100/80">
            Rule 16: no new product until every card is in research or terminally decided
            (kill / personal-interest / redesign). Triage these, then intake reopens — or force one
            through below with a logged reason.
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {gate.untriaged.map((u) => (
              <li key={u.product_slug}>
                <Link
                  href={`/admin/methodology/${u.product_slug}`}
                  className="inline-flex items-center rounded border border-yellow-500/30 bg-black/20 px-2 py-1 font-mono text-sm text-yellow-100 hover:border-yellow-400"
                >
                  {u.display_name ?? u.product_slug}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-8 space-y-4">
        <AddChosenProduct available={available} gateOpen={gate.open} untriaged={gate.untriaged} />
        <AddNewIdea existing={existingSlugs} gateOpen={gate.open} untriaged={gate.untriaged} />
      </div>

      <IdeationInbox cards={inboxCards} />

      {boardCards.length === 0 ? (
        <div className="rounded-lg border border-gray-border bg-gray-dark/40 p-8 text-center">
          <p className="text-base text-gray-light mb-2">No cards in the pipeline yet.</p>
          <p className="text-base text-gray-light/70">
            Add a chosen product or a brand-new idea above to start the first card.
          </p>
        </div>
      ) : (
        <BoardTable cards={boardCards} />
      )}

      <p className="mt-8 text-sm text-gray-light/60">
        Gate 0 (intake triaged) lets you add a product; Gate 1 (MVP-ready) releases the research;
        Gate 2 (validated demand) releases the full build. Seeded products start{' '}
        <span className="text-gray-light">blocked</span> — open a card to set its MVP link and flip
        Gate 1, then launch the dual-stream kick-off.
      </p>
    </div>
  )
}
