/**
 * /admin/ops — Ops Center Dashboard
 * Overview of all infrastructure costs across products and clients.
 * Auth: protected by middleware (ADMIN_EMAILS check)
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { BalanceManager, type BalanceRow } from '@/components/admin/BalanceManager'

export const dynamic = 'force-dynamic'

interface MonthlyProvider {
  provider: string
  total_usd: number
}

interface OrgSummary {
  name: string
  total_usd: number
}

interface IdleSource {
  id: string
  provider: string
  name: string
  total_cost: number
}

async function getSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

async function getMonthlyByProvider(): Promise<MonthlyProvider[]> {
  const supabase = await getSupabase()
  const { data } = await supabase
    .from('v_monthly_by_provider')
    .select('provider, total_usd')
    .order('total_usd', { ascending: false })
  return (data ?? []).slice(0, 8)
}

async function getTotalThisMonth(): Promise<number> {
  const supabase = await getSupabase()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

  const { data } = await supabase
    .from('cost_entries')
    .select('cost_usd')
    .gte('entry_date', startOfMonth)

  return (data ?? []).reduce((sum, row) => sum + (row.cost_usd ?? 0), 0)
}

async function getTotalLastMonth(): Promise<number> {
  const supabase = await getSupabase()
  const now = new Date()
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]

  const { data } = await supabase
    .from('cost_entries')
    .select('cost_usd')
    .gte('entry_date', startOfLastMonth)
    .lte('entry_date', endOfLastMonth)

  return (data ?? []).reduce((sum, row) => sum + (row.cost_usd ?? 0), 0)
}

async function getIdleSources(): Promise<IdleSource[]> {
  const supabase = await getSupabase()
  const { data } = await supabase
    .from('v_idle_sources')
    .select('id, provider, name, total_cost')
    .limit(5)
  return data ?? []
}

async function getBalances(): Promise<BalanceRow[]> {
  const supabase = await getSupabase()
  const { data } = await supabase
    .from('cost_sources')
    .select('provider, name, balance_usd, alert_threshold_usd, balance_updated_at')
    .eq('is_active', true)
    .order('provider')
  return (data ?? []) as BalanceRow[]
}

async function getSourceCount(): Promise<number> {
  const supabase = await getSupabase()
  const { count } = await supabase
    .from('cost_sources')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
  return count ?? 0
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

export default async function OpsDashboard() {
  const [monthlyProviders, thisMonth, lastMonth, idleSources, sourceCount, balances] = await Promise.all([
    getMonthlyByProvider(),
    getTotalThisMonth(),
    getTotalLastMonth(),
    getIdleSources(),
    getSourceCount(),
    getBalances(),
  ])

  const hasData = sourceCount > 0
  const lowBalances = balances.filter(
    (b) => b.balance_usd !== null && b.balance_usd < (b.alert_threshold_usd ?? 20),
  )

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold text-white">Ops Center</h1>
      <p className="mt-1 text-sm text-gray-400">
        Overview of all infrastructure costs across products and clients.
        Tracks spend, detects idle resources, and surfaces budget alerts.
      </p>

      {lowBalances.length > 0 && (
        <div className="mt-6 rounded-lg border border-rose-600 bg-rose-900/30 p-4 text-rose-100">
          <h2 className="text-base font-semibold">⚠️ {lowBalances.length} low balance{lowBalances.length > 1 ? 's' : ''}</h2>
          <p className="mt-1 text-sm text-rose-200/90">
            {lowBalances
              .map((b) => `${b.name} (${fmtCurrency(b.balance_usd ?? 0)})`)
              .join(', ')}
            {' '}— below the alert threshold. The admin is alerted by email (debounced; delivery
            depends on email config).
          </p>
        </div>
      )}

      {!hasData && (
        <div className="mt-8 rounded-lg border border-yellow-600/50 bg-yellow-900/20 p-6 text-yellow-200">
          <h2 className="text-lg font-semibold">No cost data yet</h2>
          <p className="mt-2 text-sm">
            Run the database migration and add cost sources to start tracking.
          </p>
          <ul className="mt-3 list-disc pl-5 text-sm text-yellow-200/80">
            <li>Apply migration: <code className="bg-yellow-900/50 px-1">npm run db:migrate</code></li>
            <li>Or paste migration in Supabase SQL editor</li>
            <li>Add sources via API or manually</li>
          </ul>
        </div>
      )}

      {hasData && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="This Month"
              value={fmtCurrency(thisMonth)}
              subtext={sourceCount + ' active sources'}
            />
            <StatCard
              label="Last Month"
              value={fmtCurrency(lastMonth)}
            />
            <StatCard
              label="Trend"
              value={fmtPercent(thisMonth, lastMonth)}
              highlight={thisMonth > lastMonth}
            />
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-white">By Provider</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {monthlyProviders.map((p) => (
                <div
                  key={p.provider}
                  className="rounded-lg border border-gray-700 bg-gray-800/50 p-4"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{providerIcons[p.provider.toLowerCase()] || providerIcons.other}</span>
                    <span className="font-medium text-white capitalize">{p.provider}</span>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-white">
                    {fmtCurrency(p.total_usd)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {idleSources.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-rose-400">Idle Sources</h2>
              <p className="mt-1 text-sm text-gray-400">
                No activity in 7+ days — consider pausing
              </p>
              <div className="mt-3 overflow-hidden rounded-lg border border-rose-800 bg-rose-900/10">
                <table className="w-full text-sm">
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
                        <td className="px-3 py-2 text-rose-200 capitalize">{s.provider}</td>
                        <td className="px-3 py-2 text-white">{s.name}</td>
                        <td className="px-3 py-2 text-right text-rose-200">
                          {fmtCurrency(s.total_cost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <BalanceManager initial={balances} />

      <div className="mt-8 border-t border-gray-800 pt-6">
        <h2 className="text-lg font-semibold text-white">Coming Soon</h2>
        <ul className="mt-3 list-disc pl-5 text-sm text-gray-400">
          <li>Supabase project sync (Management API)</li>
          <li>Vercel deployment costs</li>
          <li>LLM API spend (Anthropic, OpenAI, OpenRouter)</li>
          <li>ElevenLabs voice minutes</li>
          <li>Resend email volume</li>
          <li>Client cost allocation & margins</li>
        </ul>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  subtext,
  highlight,
}: {
  label: string
  value: string
  subtext?: string
  highlight?: boolean
}) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
      <div className="text-xs uppercase tracking-wide text-gray-400">{label}</div>
      <div className={`mt-1 text-3xl font-bold ${highlight ? 'text-rose-400' : 'text-white'}`}>
        {value}
      </div>
      {subtext && <div className="mt-1 text-sm text-gray-500">{subtext}</div>}
    </div>
  )
}
