// @explanatory-header-exempt — admin-internal page (operator-only surface; Session 2 detail view)
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { DecisionControls } from '@/components/methodology/DecisionControls'
import { CockpitControls } from '@/components/methodology/CockpitControls'
import { CockpitClarifier } from '@/components/methodology/CockpitClarifier'
import type { CardClarifierState } from '@/lib/methodology/clarifier-context'

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
  pipeline_stage: string | null
  monetisation_lane: string | null
  engine_cluster: string | null
  build_status: string | null
  mvp_url: string | null
  mvp_ready: boolean | null
  build_type: string | null
  gate2_go: boolean | null
  idea_card: Record<string, string> | null
}

interface GateRecord {
  id: string
  gate: string
  status: 'pass' | 'fail'
  deployment_id: string | null
  commit_sha: string | null
  artifact_ref: string | null
  reason: string | null
  is_override: boolean
  recorded_by: string
  created_at: string
}

interface Campaign {
  id: string
  campaign_type: 'target-user' | 'distributor-candidate'
  icp_description: string
  questions: string[] | null
  expected_response_count: number
  status: string
  ip_campaign_id: string | null
  connexions_panel_slug: string | null
  connexions_panel_url: string | null
}

interface PromiseAttribute {
  id: string
  attribute: string
  quality_bar: string
  verify: string | null
  promise: string | null
  distributor: string | null
  sort_order: number
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
  ideation: 'bg-gray-mid/40 text-gray-light/70',
  'dialogue-complete': 'bg-gray-mid/40 text-gray-light',
  'validation-in-flight': 'bg-yellow-500/20 text-yellow-300',
  validated: 'bg-emerald-500/20 text-emerald-300',
  'redesign-to-fit': 'bg-blue-500/20 text-blue-300',
  'personal-interest-override': 'bg-purple-500/20 text-purple-300',
  kill: 'bg-red-500/20 text-red-300',
}

// The first gate — the build-type tick-box routes the whole gate path.
const BUILD_TYPE_LABEL: Record<string, string> = {
  'product': 'Product',
  'shared-service': 'Shared service',
  'infra-product-candidate': 'Infra · product-candidate',
}
const BUILD_TYPE_COLOR: Record<string, string> = {
  'product': 'bg-accent/20 text-accent',
  'shared-service': 'bg-blue-500/20 text-blue-300',
  'infra-product-candidate': 'bg-purple-500/20 text-purple-300',
}

// The idea-card fields, in display order. ⚑ = gate-critical (a card can't pass the
// relevant gate while these are blank/hand-wavy — see THIN_MVP/BUSINESS_MODEL §5).
const IDEA_CARD_FIELDS: { key: string; label: string; critical?: boolean }[] = [
  { key: 'problem', label: 'Problem' },
  { key: 'demand_evidence', label: 'Demand evidence', critical: true },
  { key: 'wedge', label: 'Wedge' },
  { key: 'scope', label: 'Scope' },
  { key: 'architecture', label: 'Architecture (build vs buy)', critical: true },
  { key: 'build_sequence', label: 'Build sequence' },
  { key: 'shared_layers', label: 'Shared layers' },
  { key: 'lane', label: 'Lane' },
  { key: 'distributor', label: 'Distributor', critical: true },
  { key: 'risks_open_questions', label: 'Risks & open questions' },
  { key: 'decisions_needed', label: 'Decisions needed', critical: true },
  { key: 'commercial_structure', label: 'Commercial structure' },
  { key: 'source_artifact', label: 'Source' },
]

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

  const { data: promiseData } = await supabase
    .from('promise_attributes')
    .select('id, attribute, quality_bar, verify, promise, distributor, sort_order')
    .eq('product_slug', params.slug)
    .order('sort_order', { ascending: true })

  const promiseAttributes = (promiseData ?? []) as PromiseAttribute[]

  // The gate ledger for this product — the PASS/FAIL record the execution actions read.
  const { data: gateData } = await supabase
    .from('pipeline_gates')
    .select('*')
    .eq('product_slug', params.slug)
    .order('created_at', { ascending: false })

  const gateRecords = (gateData ?? []) as GateRecord[]

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

  // Compact, serialisable snapshot for the in-context voice clarifier. The clarifier pulls
  // this on demand (get_card_state) rather than having it pushed into the agent prompt.
  const responseCounts = responses.reduce<Record<string, number>>((acc, r) => {
    const key = r.classification ?? 'unclassified'
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
  const clarifierState: CardClarifierState = {
    product_slug: card.product_slug,
    status: card.status,
    pipeline_stage: card.pipeline_stage,
    monetisation_lane: card.monetisation_lane,
    engine_cluster: card.engine_cluster,
    build_status: card.build_status,
    mvp_url: card.mvp_url,
    mvp_ready: card.mvp_ready,
    origin_summary: card.origin_summary,
    original_end_user: card.original_end_user,
    hypotheses: hypothesisRows.map((h) => ({
      field: h.field,
      status: h.validation_status ?? 'pending',
    })),
    campaigns: campaigns.map((c) => ({
      type: c.campaign_type,
      status: c.status,
      responses: (responsesByCampaign.get(c.id) ?? []).length,
      expected: c.expected_response_count,
    })),
    response_counts: responseCounts,
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Cockpit-local top bar — gives the operator a clear title + a way home on
          mobile without depending on the global marketing header. */}
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

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold font-mono break-all">{card.product_slug}</h1>
          <span
            className={`text-sm px-2 py-1 rounded uppercase tracking-wider ${
              CARD_STATUS_COLOR[card.status] ?? 'bg-gray-mid/40 text-gray-light'
            }`}
          >
            {card.status}
          </span>
          {card.build_type && (
            <span
              className={`text-sm px-2 py-1 rounded uppercase tracking-wider ${
                BUILD_TYPE_COLOR[card.build_type] ?? 'bg-gray-mid/40 text-gray-light'
              }`}
              title="Build type — the first gate. It routes the whole gate path."
            >
              {BUILD_TYPE_LABEL[card.build_type] ?? card.build_type}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-light/70">
          Last updated {new Date(card.updated_at).toLocaleString()}
          {card.decision_made_at && ` · decided ${new Date(card.decision_made_at).toLocaleString()}`}
        </p>
        {/* Explanatory header — what this is / what you do here / why it matters. */}
        <p className="mt-4 text-base text-gray-light max-w-2xl">
          This is a Hypothesis Card — one product moving through the pipeline. Here you set Gate 1
          (thin-MVP ready), launch dual-stream research, read the validated responses, and record the
          Gate 2 go/no-go decision. The decision you make here is what advances the card to build or
          archives it.
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

      {/* Idea card — the structured intake one-pager (gate-critical fields marked ⚑). */}
      {card.idea_card && Object.keys(card.idea_card).length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2">Idea card (intake one-pager)</h2>
          <p className="mb-4 text-sm text-gray-light/80 max-w-2xl">
            The structured intake for this idea. The ⚑ fields are gate-critical: a card cannot pass
            its review gates while they are blank or hand-wavy — a named demand_evidence (not &ldquo;a
            market&rdquo;), build-vs-buy architecture, lane + distributor (Rule&nbsp;15), and the
            go/no-go decisions.
          </p>
          <dl className="space-y-3">
            {IDEA_CARD_FIELDS.filter((f) => card.idea_card?.[f.key]).map((f) => (
              <div
                key={f.key}
                className={`rounded-lg border p-4 ${
                  f.critical ? 'border-accent/30 bg-accent/5' : 'border-gray-border bg-gray-dark/40'
                }`}
              >
                <dt className="text-xs uppercase tracking-wider text-accent font-medium mb-1">
                  {f.critical && <span title="Gate-critical">⚑ </span>}
                  {f.label}
                </dt>
                <dd className="text-sm text-gray-light whitespace-pre-wrap">{card.idea_card![f.key]}</dd>
              </div>
            ))}
          </dl>
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

      {/* Pipeline & kick-off */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Pipeline &amp; kick-off</h2>
        <CockpitControls
          productSlug={card.product_slug}
          initial={{
            pipeline_stage: card.pipeline_stage,
            monetisation_lane: card.monetisation_lane,
            engine_cluster: card.engine_cluster,
            build_status: card.build_status,
            mvp_url: card.mvp_url,
            mvp_ready: card.mvp_ready,
          }}
        />
      </section>

      {/* Gate ledger — the PASS/FAIL record the EXECUTION actions read + refuse against. */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-2">Gate ledger</h2>
        <p className="mb-4 text-sm text-gray-light/80 max-w-2xl">
          The recorded gate results for this product — the single source of truth the execution path
          reads. The thin-MVP creator runs freely; <strong className="text-white">scale-infra</strong>{' '}
          (multi-tenant / billing / white-label / domain) is refused until a Gate-2 GO, and{' '}
          <strong className="text-white">sharing a product URL</strong> is refused until a{' '}
          <code className="text-accent">naive-tester</code> PASS is bound to what production is serving now.
        </p>
        {/* Derived "what's unlocked" summary from the card flags. */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border border-gray-border bg-gray-dark/40 p-4">
            <p className="text-xs uppercase tracking-wider text-gray-light/70 mb-1">Scale-infra (multi-tenant / domain)</p>
            <p className={`text-sm font-semibold ${card.gate2_go ? 'text-emerald-300' : 'text-red-300'}`}>
              {card.gate2_go ? 'UNLOCKED — Gate-2 GO recorded' : 'BLOCKED — no Gate-2 GO'}
            </p>
          </div>
          <div className="rounded-lg border border-gray-border bg-gray-dark/40 p-4">
            <p className="text-xs uppercase tracking-wider text-gray-light/70 mb-1">Thin-MVP build &amp; deploy</p>
            <p className="text-sm font-semibold text-emerald-300">
              Always allowed — its live link is the Gate-1 outreach payload
            </p>
          </div>
        </div>
        {gateRecords.length === 0 ? (
          <p className="rounded-lg border border-gray-border bg-gray-dark/40 p-4 text-sm text-gray-light/70">
            No gate results recorded yet. Each gate writes its PASS/FAIL here as the card advances
            (office-hours design doc, CEO/eng/design review logs, the thin-MVP Gate-1, the Gate-2 GO,
            and the <code className="text-accent">naive-tester</code> Standards Check).
          </p>
        ) : (
          <div className="space-y-2">
            {gateRecords.map((g) => (
              <div
                key={g.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-gray-border bg-gray-dark/40 px-4 py-3"
              >
                <span className="text-sm font-mono text-white">{g.gate}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded uppercase tracking-wider ${
                    g.status === 'pass' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  {g.status}
                </span>
                {g.is_override && (
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 uppercase tracking-wider">
                    override
                  </span>
                )}
                {g.deployment_id && (
                  <span className="text-xs text-gray-light/60 font-mono" title="Bound to this production deployment">
                    {g.deployment_id.slice(0, 16)}…
                  </span>
                )}
                {g.commit_sha && (
                  <span className="text-xs text-gray-light/60 font-mono">{g.commit_sha.slice(0, 7)}</span>
                )}
                <span className="ml-auto text-xs text-gray-light/50">
                  {new Date(g.created_at).toLocaleString()} · {g.recorded_by}
                </span>
                {(g.artifact_ref || g.reason) && (
                  <p className="w-full text-xs text-gray-light/70 mt-1">
                    {g.artifact_ref && <span className="font-mono">{g.artifact_ref}</span>}
                    {g.reason && <span className="italic"> — {g.reason}</span>}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Promise bars — the ratified "I want that" definition (THIN_MVP_RUBRIC v2 §7,
          scores check #9). Read-only fold-in from the GATE_READINESS_REVIEW_V4 sign-off. */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-2">Promise bars — the &ldquo;I want that&rdquo; test</h2>
        <p className="mb-4 text-sm text-gray-light/80 max-w-2xl">
          The ratified quality bars for this product&rsquo;s promise, in &ldquo;X, not Y&rdquo; form. A thin
          MVP is Gate-1-ready only when each bar is met at demo quality (a present-but-weak attribute
          fails as surely as a missing one). These score readiness check&nbsp;#9.
        </p>
        {promiseAttributes.length === 0 ? (
          <p className="rounded-lg border border-gray-border bg-gray-dark/40 p-4 text-sm text-gray-light/70">
            No ratified promise bars yet. The bar is the judgement — set it as this product nears
            Gate&nbsp;1. (Infrastructure, engine, and kill-lane products may never need one.)
          </p>
        ) : (
          <>
            {(promiseAttributes[0].promise || promiseAttributes[0].distributor) && (
              <div className="mb-4 rounded-lg border border-accent/30 bg-accent/5 p-4">
                {promiseAttributes[0].promise && (
                  <p className="text-sm text-white">
                    <span className="text-xs uppercase tracking-wider text-accent font-medium">Promise </span>
                    {promiseAttributes[0].promise}
                  </p>
                )}
                {promiseAttributes[0].distributor && (
                  <p className="mt-2 text-sm">
                    <span className="text-xs uppercase tracking-wider text-accent font-medium">Distributor </span>
                    <span className="text-gray-light">{promiseAttributes[0].distributor}</span>
                  </p>
                )}
              </div>
            )}
            <div className="space-y-3">
              {promiseAttributes.map((p) => {
                const splitIdx = p.quality_bar.search(/\s[-—]\s+not\s/i)
                const target = splitIdx >= 0 ? p.quality_bar.slice(0, splitIdx) : p.quality_bar
                const notPart =
                  splitIdx >= 0
                    ? p.quality_bar.slice(splitIdx).replace(/^\s[-—]\s+/, '')
                    : null
                return (
                  <div key={p.id} className="rounded-lg border border-gray-border bg-gray-dark/40 p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-sm font-semibold text-white">{p.attribute}</p>
                      {p.verify && (
                        <span className="shrink-0 text-xs px-2 py-1 rounded bg-gray-mid/40 text-gray-light/70 uppercase tracking-wider font-mono">
                          {p.verify}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-emerald-200">{target}</p>
                    {notPart && (
                      <p className="mt-1 text-sm text-red-300/80">
                        <span className="uppercase text-xs tracking-wider">not </span>
                        {notPart}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </section>

      {/* Campaigns + responses */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Validation campaigns</h2>
        {campaigns.length === 0 ? (
          <p className="text-base text-gray-light/70">
            No research running yet. Open Gate 1 above (set the thin-MVP link and mark it ready),
            then use Launch real research to start a target-user and a distributor-candidate stream.
            Discovered prospects and responses will appear here.
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
                  {campaign.connexions_panel_url && (
                    <div className="mb-3 rounded border border-accent/30 bg-accent/5 p-3">
                      <p className="text-xs uppercase tracking-wider text-accent font-medium mb-2">
                        Connexions intake panel
                      </p>
                      <a
                        href={campaign.connexions_panel_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-accent hover:underline break-all"
                      >
                        {campaign.connexions_panel_url}
                      </a>
                      <p className="mt-2 text-xs text-gray-light/70">
                        Voice research interview. Append <code>?ref=&lt;prospect_id&gt;&amp;src=linkedin|email</code> for attribution per prospect.
                      </p>
                    </div>
                  )}
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

      {/* In-context voice clarifier — floating; helps with Gate 1, the Launch consequence,
          and which Gate-2 decision fits this card. Renders nothing until an agent is
          provisioned (see scripts/provision-cockpit-clarifier.ts). */}
      <CockpitClarifier card={clarifierState} />
    </div>
  )
}
