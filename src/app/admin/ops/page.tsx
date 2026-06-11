/**
 * /admin/ops — Cost Dashboard
 * Real-time view of every infrastructure cost across products and clients: current balances,
 * monthly spend + trend, idle sources, and low-balance email alerts. Operators add/edit/retire
 * the tracked sources themselves (CostSourceManager).
 *
 * Auth: /admin/* is operator-gated by middleware (ADMIN_EMAILS). Because this surface is
 * operator-only, all reads use the SERVICE-ROLE client — the cost tables have RLS enabled with
 * no policies for the authenticated role, so an anon/cookie client would read back nothing even
 * when data exists.
 */
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ExplanatoryHeader } from '@caistech/corporate-components'
import { CostSourceManager } from '@/components/admin/CostSourceManager'
import { listSources, listOrganisations, type CostSource } from '@/lib/ops/sources'

export const dynamic = 'force-dynamic'

interface MonthlyProvider {
  provider: string
  total_usd: number
}

interface IdleSource {
  id: string
  provider: string
  name: string
  total_cost: number
}

function serviceDb(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function getMonthlyByProvider(db: SupabaseClient): Promise<MonthlyProvider[]> {
  const { data } = await db
    .from('v_monthly_by_provider')
    .select('provider, total_usd')
    .order('total_usd', { ascending: false })
  return (data ?? []).slice(0, 8)
}

async function getTotalThisMonth(db: SupabaseClient): Promise<number> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const { data } = await db.from('cost_entries').select('cost_usd').gte('entry_date', startOfMonth)
  return (data ?? []).reduce((sum, row) => sum + (row.cost_usd ?? 0), 0)
}

async function getTotalLastMonth(db: SupabaseClient): Promise<number> {
  const now = new Date()
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
  const { data } = await db
    .from('cost_entries')
    .select('cost_usd')
    .gte('entry_date', startOfLastMonth)
    .lte('entry_date', endOfLastMonth)
  return (data ?? []).reduce((sum, row) => sum + (row.cost_usd ?? 0), 0)
}

async function getIdleSources(db: SupabaseClient): Promise<IdleSource[]> {
  const { data } = await db
    .from('v_idle_sources')
    .select('id, provider, name, total_cost')
    .limit(5)
  return data ?? []
}

const providerIcons: Record<string, string> = {
  supabase: '🗄️',
  vercel: '▲',
  anthropic: '🧠',
  openai: '🤖',
  elevenlabs: '🎙️',
  resend: '📧',
  github: '🐙',
  stripe: '💳',
  xero: '📊',
  google: '🔍',
  other: '📦',
}

function fmtCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'USD' }).format(amount)
}

function fmtPercent(a: number, b: number): string {
  if (b === 0) return '+0%'
  const pct = ((a - b) / b) * 100
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
}

export default async function CostDashboard() {
  const db = serviceDb()
  const [monthlyProviders, thisMonth, lastMonth, idleSources, sources, organisations] = await Promise.all([
    getMonthlyByProvider(db),
    getTotalThisMonth(db),
    getTotalLastMonth(db),
    getIdleSources(db),
    listSources(db),
    listOrganisations(db),
  ])

  const activeSources = sources.filter((s) => s.is_active)
  const hasData = activeSources.length > 0
  const lowBalances = activeSources.filter(
    (s: CostSource) => s.balance_usd !== null && s.balance_usd < (s.alert_threshold_usd ?? 20),
  )

  return (
    <div className="mx-auto max-w-6xl p-6">
      <ExplanatoryHeader
        what="Cost Dashboard"
        whatLong="Real-time visibility of every infrastructure cost across products and clients."
        todo="Add or edit the providers you want tracked below, and record balances to enable alerts."
        matters="Tracks spend and balances, detects idle resources, and emails the admin before any credit runs out."
      />


      {lowBalances.length > 0 && (
        <div className="mt-6 rounded-lg border border-rose-600 bg-rose-900/30 p-4 text-rose-100">
          <h2 className="text-base font-semibold">⚠️ {lowBalances.length} low balance{lowBalances.length > 1 ? 's' : ''}</h2>
          <p className="mt-1 text-sm text-rose-200/90">
            {lowBalances.map((b) => `${b.name} (${fmtCurrency(b.balance_usd ?? 0)})`).join(', ')}
            {' '}— below the alert threshold. The admin is alerted by email (debounced; delivery
            depends on email config).
          </p>
        </div>
      )}

      {!hasData && (
        <div className="mt-8 rounded-lg border border-yellow-600/50 bg-yellow-900/20 p-6 text-yellow-200">
          <h2 className="text-lg font-semibold">No cost sources tracked yet</h2>
          <p className="mt-2 text-sm">
            Add your providers below to start tracking spend and balances. Spend totals fill in once
            the daily cost sync runs; balances you can record straight away to enable low-balance alerts.
          </p>
        </div>
      )}

      {hasData && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="This Month" value={fmtCurrency(thisMonth)} subtext={activeSources.length + ' active sources'} />
            <StatCard label="Last Month" value={fmtCurrency(lastMonth)} />
            <StatCard label="Trend" value={fmtPercent(thisMonth, lastMonth)} highlight={thisMonth > lastMonth} />
          </div>

          {monthlyProviders.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-white">By Provider</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {monthlyProviders.map((p) => (
                  <div key={p.provider} className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{providerIcons[p.provider.toLowerCase()] || providerIcons.other}</span>
                      <span className="font-medium capitalize text-white">{p.provider}</span>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-white">{fmtCurrency(p.total_usd)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {idleSources.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-rose-400">Idle Sources</h2>
              <p className="mt-1 text-sm text-gray-400">No activity in 7+ days — consider pausing</p>
              <div className="mt-3 overflow-x-auto rounded-lg border border-rose-800 bg-rose-900/10">
                <table className="w-full min-w-[480px] text-sm">
                  <thead className="bg-rose-900/30 text-left text-rose-200">
                    <tr>
                      <th className="px-3 py-2 font-medium">Provider</th>
                      <th className="px-3 py-2 font-medium">Name</th>
                      <th className="px-3 py-2 font-medium text-right">Est $/mo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {idleSources.map((s) => (
                      <tr key={s.id} className="border-t border-rose-800/30">
                        <td className="px-3 py-2 capitalize text-rose-200">{s.provider}</td>
                        <td className="px-3 py-2 text-white">{s.name}</td>
                        <td className="px-3 py-2 text-right text-rose-200">{fmtCurrency(s.total_cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <CostSourceManager sources={sources} organisations={organisations} />

      <div className="mt-8 border-t border-gray-800 pt-6">
        <h2 className="text-lg font-semibold text-white">How each provider is tracked</h2>
        <p className="mt-2 text-sm text-gray-400">
          A daily sync (06:00) and the &ldquo;Sync now&rdquo; button pull live figures for the two
          providers that expose an API: <span className="text-gray-300">OpenRouter</span> (credit
          balance) and <span className="text-gray-300">Supabase</span> (per-project compute
          estimate). Each source row shows its sync status; <span className="text-amber-300">Key
          missing</span> means the provider&rsquo;s key isn&rsquo;t set in Vercel yet.
        </p>
        <p className="mt-2 text-sm text-gray-400">
          Everything else (Anthropic, OpenAI, Brave, Hunter, Unipile, Resend, ElevenLabs,
          Open&nbsp;Code&nbsp;Zen, …) is tracked by hand — none exposes a usage/cost API a
          single-operator account can read (Anthropic spend needs the org-level Admin Cost API,
          which individual orgs can&rsquo;t provision). Open the provider&rsquo;s billing page from
          the row&rsquo;s <span className="text-gray-300">Billing&nbsp;↗</span> link, then use{' '}
          <span className="text-gray-300">Update</span> to record the balance or this month&rsquo;s
          spend. Balances show their age and turn amber once stale.
        </p>
      </div>
    </div>
  )
}

function StatCard({ label, value, subtext, highlight }: { label: string; value: string; subtext?: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
      <div className="text-xs uppercase tracking-wide text-gray-400">{label}</div>
      <div className={`mt-1 text-3xl font-bold ${highlight ? 'text-rose-400' : 'text-white'}`}>{value}</div>
      {subtext && <div className="mt-1 text-sm text-gray-500">{subtext}</div>}
    </div>
  )
}
