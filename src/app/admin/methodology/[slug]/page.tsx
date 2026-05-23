// @explanatory-header-exempt — admin-internal page (operator-only surface; Session 2 detail view)
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { DecisionControls } from '@/components/methodology/DecisionControls'

interface PageProps {
  params: { slug: string }
}

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

interface HypothesisRow {
  field: string
  hypothesis_text: string
  validation_status?: string
  notes?: string
}

interface Card {
  id: string
  product_slug: string
  origin_summary: string | null
  original_end_user: string | null
  hypothesis_rows: HypothesisRow[] | null
  status: string
  decision_reason: string | null
  decision_made_at: string | null
  updated_at: string
}

interface Campaign {
  id: string
  campaign_type: 'target-user' | 'distributor-candidate'
  icp_description: string
  questions: string[] | null
  expected_response_count: number
  status: string
  ip_campaign_id: string | null
}

interface Response {
  id: string
  campaign_id: string
  prospect_name: string | null
  prospect_role: string | null
  prospect_org: string | null
  response_received_at: string | null
  response_raw_text: string
  response_channel: string | null
  classification: string | null
  classification_reasoning: string | null
  per_question_signal: Record<string, string> | null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `${params.slug} — Hypothesis Card`,
    description: `Phase Zero backfill detail view for ${params.slug}`,
  }
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'pending',
  'in-flight': 'in-flight',
  confirmed: 'confirmed',
  contradicted: 'contradicted',
  refined: 'refined',
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-gray-mid/40 text-gray-light',
  'in-flight': 'bg-yellow-500/20 text-yellow-300',
  confirmed: 'bg-emerald-500/20 text-emerald-300',
  contradicted: 'bg-red-500/20 text-red-300',
  refined: 'bg-blue-500/20 text-blue-300',
}

const CARD_STATUS_COLOR: Record<string, string> = {
  'dialogue-complete': 'bg-gray-mid/40 text-gray-light',
  'validation-in-flight': 'bg-yellow-500/20 text-yellow-300',
  validated: 'bg-emerald-500/20 text-emerald-300',
  'redesign-to-fit': 'bg-blue-500/20 text-blue-300',
  'personal-interest-override': 'bg-purple-500/20 text-purple-300',
  kill: 'bg-red-500/20 text-red-300',
}

export default async function HypothesisCardDetailPage({ params }: PageProps) {
  noStore()
  const supabase = supabaseAdmin()

  const { data: cardData, error: cardErr } = await supabase
    .from('methodology_hypothesis_cards')
    .select('*')
    .eq('product_slug', params.slug)
    .maybeSingle()

  if (cardErr) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-4 text-red-300">Error loading card</h1>
        <p className="text-sm text-gray-light"><code className="text-red-300">{cardErr.message}</code></p>
      </div>
    )
  }
  if (!cardData) notFound()

  const card = cardData as Card

  const { data: campaignsData } = await supabase
    .from('methodology_campaigns')
    .select('*')
    .eq('card_id', card.id)
    .order('campaign_type', { ascending: true })

  const campaigns = (campaignsData ?? []) as Campaign[]

  const { data: responsesData } = await supabase
    .from('methodology_responses')
    .select('*')
    .in('campaign_id', campaigns.map((c) => c.id))
    .order('response_received_at', { ascending: false })

  const responses = (responsesData ?? []) as Response[]

  const hypothesisRows = card.hypothesis_rows ?? []
  const responsesByCampaign = new Map<string, Response[]>()
  for (const r of responses) {
    if (!responsesByCampaign.has(r.campaign_id)) responsesByCampaign.set(r.campaign_id, [])
    responsesByCampaign.get(r.campaign_id)!.push(r)
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/methodology" className="text-xs text-accent hover:underline">
          ← All Hypothesis Cards
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold font-mono">{card.product_slug}</h1>
          <span
            className={`text-xs px-2 py-1 rounded uppercase tracking-wider ${
              CARD_STATUS_COLOR[card.status] ?? 'bg-gray-mid/40 text-gray-light'
            }`}
          >
            {card.status}
          </span>
        </div>
        <p className="mt-2 text-xs text-gray-light/70">
          Last updated {new Date(card.updated_at).toLocaleString()}
          {card.decision_made_at && ` · decided ${new Date(card.decision_made_at).toLocaleString()}`}
        </p>
      </div>

      {/* Origin block */}
      {(card.origin_summary || card.original_end_user) && (
        <section className="mb-8 rounded-lg border border-gray-border bg-gray-dark/40 p-5">
          <p className="text-xs uppercase tracking-wider text-accent font-medium mb-3">
            Origin (from dialogue)
          </p>
          {card.origin_summary && (
            <p className="text-sm text-gray-light mb-3">{card.origin_summary}</p>
          )}
          {card.original_end_user && (
            <p className="text-sm">
              <strong className="text-white">Original end-user:</strong>{' '}
              <span className="text-gray-light">{card.original_end_user}</span>
            </p>
          )}
        </section>
      )}

      {/* Hypothesis rows */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Hypothesis rows</h2>
        {hypothesisRows.length === 0 ? (
          <p className="text-sm text-gray-light/70">No hypothesis rows on this card yet.</p>
        ) : (
          <div className="space-y-3">
            {hypothesisRows.map((row, idx) => (
              <div
                key={`${row.field}-${idx}`}
                className="rounded-lg border border-gray-border bg-gray-dark/40 p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-xs uppercase tracking-wider text-accent font-medium font-mono">
                    {row.field}
                  </p>
                  <span
                    className={`text-xs px-2 py-1 rounded uppercase tracking-wider ${
                      STATUS_COLOR[row.validation_status ?? 'pending'] ?? STATUS_COLOR.pending
                    }`}
                  >
                    {STATUS_LABEL[row.validation_status ?? 'pending']}
                  </span>
                </div>
                <p className="text-sm text-white">{row.hypothesis_text}</p>
                {row.notes && (
                  <p className="mt-2 text-xs text-gray-light/70">{row.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Campaigns + responses */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Validation campaigns</h2>
        {campaigns.length === 0 ? (
          <p className="text-sm text-gray-light/70">
            No campaigns configured yet. POST to InvestorPilot&apos;s{' '}
            <code>/api/methodology/campaigns</code> + mirror to{' '}
            <code>methodology_campaigns</code> via your sync flow.
          </p>
        ) : (
          <div className="space-y-6">
            {campaigns.map((campaign) => {
              const camResponses = responsesByCampaign.get(campaign.id) ?? []
              const counts = camResponses.reduce<Record<string, number>>((acc, r) => {
                const k = r.classification ?? 'unclassified'
                acc[k] = (acc[k] ?? 0) + 1
                return acc
              }, {})
              return (
                <div
                  key={campaign.id}
                  className="rounded-lg border border-gray-border bg-gray-dark/40 p-5"
                >
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold capitalize">
                      {campaign.campaign_type.replace('-', ' ')}
                    </h3>
                    <span className="text-xs px-2 py-1 rounded bg-accent/10 text-accent uppercase tracking-wider">
                      {campaign.status}
                    </span>
                    {campaign.ip_campaign_id && (
                      <span className="text-xs text-gray-light/60 font-mono">
                        ip:{campaign.ip_campaign_id.slice(0, 8)}…
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-light mb-3">{campaign.icp_description}</p>
                  {Array.isArray(campaign.questions) && campaign.questions.length > 0 && (
                    <ol className="list-decimal ml-5 text-sm text-gray-light/80 space-y-1 mb-3">
                      {campaign.questions.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ol>
                  )}
                  <p className="text-xs text-gray-light/70 mb-2">
                    Responses: {camResponses.length} / {campaign.expected_response_count} expected
                    {Object.entries(counts).length > 0 && ' · '}
                    {Object.entries(counts).map(([k, v]) => (
                      <span key={k} className="ml-1">
                        {v} {k}
                      </span>
                    ))}
                  </p>
                  {camResponses.length > 0 && (
                    <details className="mt-3">
                      <summary className="text-xs text-accent cursor-pointer hover:underline">
                        Show responses
                      </summary>
                      <div className="mt-3 space-y-3">
                        {camResponses.slice(0, 20).map((r) => (
                          <div
                            key={r.id}
                            className="rounded border border-gray-border/60 bg-black/20 p-3"
                          >
                            <div className="flex items-center gap-2 text-xs mb-2">
                              <span className="text-white font-medium">
                                {r.prospect_name ?? '(anonymous)'}
                              </span>
                              {r.prospect_role && (
                                <span className="text-gray-light/70">· {r.prospect_role}</span>
                              )}
                              {r.prospect_org && (
                                <span className="text-gray-light/70">@ {r.prospect_org}</span>
                              )}
                              {r.classification && (
                                <span
                                  className={`ml-auto px-2 py-0.5 rounded uppercase tracking-wider ${
                                    r.classification === 'confirms'
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : r.classification === 'contradicts'
                                      ? 'bg-red-500/20 text-red-300'
                                      : 'bg-yellow-500/20 text-yellow-300'
                                  }`}
                                >
                                  {r.classification}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-light whitespace-pre-wrap">
                              {r.response_raw_text}
                            </p>
                            {r.classification_reasoning && (
                              <p className="mt-2 text-xs text-gray-light/60 italic">
                                {r.classification_reasoning}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Decision controls (client component) */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">Decision</h2>
        <DecisionControls
          productSlug={card.product_slug}
          currentStatus={card.status}
          currentReason={card.decision_reason}
        />
      </section>
    </div>
  )
}
