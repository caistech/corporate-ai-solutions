/**
 * /api/cron/cost-sync — Daily sync of ALL infrastructure costs
 * 
 * Syncs: Supabase, Anthropic, OpenAI, OpenRouter, ElevenLabs, Resend
 * 
 * Auth: CRON_SECRET Bearer token
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { listProjects as listSupabaseProjects, getProjectAddons, getProjectUsage, getComputeSizeFromAddons } from '@/lib/ops/supabase-management'
import { monthlyComputeUsd } from '@/lib/ops/compute-pricing'
import { getAnthropicUsage, getOpenAIUsage, getOpenRouterUsage } from '@/lib/ops/llm'
import { getElevenLabsUsage, getResendUsage } from '@/lib/ops/voice-email'
import { getOpenRouterBalance, recordBalance, evaluateLowBalancesAndAlert } from '@/lib/ops/balances'
import type { SupabaseClient } from '@supabase/supabase-js'

const INTERNAL_ORG_ID = '00000000-0000-0000-0000-000000000001'

function getDbClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  return token === process.env.CRON_SECRET
}

async function syncSupabase(supabase: SupabaseClient) {
  console.log('[cost-sync] Syncing Supabase projects...')
  const projects = await listSupabaseProjects()
  const today = new Date().toISOString().split('T')[0]
  let synced = 0
  
  for (const project of projects) {
    try {
      const addons = await getProjectAddons(project.ref)
      const computeSize = getComputeSizeFromAddons(addons)
      const estMonthlyUsd = monthlyComputeUsd(computeSize)
      const requests24h = await getProjectUsage(project.ref)
      
      const { data: existing } = await supabase
        .from('cost_sources')
        .select('id')
        .eq('source_ref', project.ref)
        .single()
      
      let sourceId = existing?.id
      
      if (!sourceId) {
        const { data: inserted } = await supabase
          .from('cost_sources')
          .insert({
            provider: 'supabase',
            source_ref: project.ref,
            name: project.name || project.ref,
            organisation_id: INTERNAL_ORG_ID,
            billing_model: 'fixed',
            fixed_cost_usd: estMonthlyUsd,
            is_active: project.status === 'ACTIVE_HEALTHY',
          })
          .select('id')
          .single()
        sourceId = inserted?.id
      }
      
      if (sourceId) {
        await supabase.from('cost_entries').upsert({
          source_id: sourceId,
          entry_date: today,
          cost_usd: estMonthlyUsd,
          usage_json: { requests: requests24h, compute_size: computeSize },
        }, { onConflict: 'source_id,entry_date' })
        synced++
      }
    } catch (err) {
      console.error(`[cost-sync] Error syncing Supabase project ${project.ref}:`, err)
    }
  }
  
  console.log(`[cost-sync] Synced ${synced} Supabase projects`)
  return synced
}

async function syncProvider(supabase: SupabaseClient, provider: string, usage: { tokens?: number; cost: number; minutes?: number; emails?: number }) {
  const today = new Date().toISOString().split('T')[0]
  
  const { data: existing } = await supabase
    .from('cost_sources')
    .select('id')
    .eq('provider', provider)
    .single()
  
  let sourceId = existing?.id
  
  if (!sourceId) {
    const { data: inserted } = await supabase
      .from('cost_sources')
      .insert({
        provider,
        name: provider.charAt(0).toUpperCase() + provider.slice(1),
        organisation_id: INTERNAL_ORG_ID,
        billing_model: 'per-use',
      })
      .select('id')
      .single()
    sourceId = inserted?.id
  }
  
  if (sourceId) {
    await supabase.from('cost_entries').upsert({
      source_id: sourceId,
      entry_date: today,
      cost_usd: usage.cost,
      usage_json: usage,
    }, { onConflict: 'source_id,entry_date' })
  }
  
  console.log(`[cost-sync] Synced ${provider}`)
}

export async function POST(request: NextRequest) {
  console.log('[cost-sync] Starting cost sync for all providers')
  
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const supabase = getDbClient()
    const results: Record<string, unknown> = {}
    
    // Supabase
    if (process.env.SUPABASE_MANAGEMENT_TOKEN) {
      results.supabase = await syncSupabase(supabase)
    }
    
    // LLM APIs
    const anthropic = await getAnthropicUsage()
    if (anthropic.tokens > 0 || anthropic.cost > 0) {
      await syncProvider(supabase, 'anthropic', { tokens: anthropic.tokens, cost: anthropic.cost })
      results.anthropic = anthropic
    }
    
    const openai = await getOpenAIUsage()
    if (openai.tokens > 0 || openai.cost > 0) {
      await syncProvider(supabase, 'openai', { tokens: openai.tokens, cost: openai.cost })
      results.openai = openai
    }
    
    const openrouter = await getOpenRouterUsage()
    if (openrouter.tokens > 0 || openrouter.cost > 0) {
      await syncProvider(supabase, 'openrouter', { tokens: openrouter.tokens, cost: openrouter.cost })
      results.openrouter = openrouter
    }
    
    // Voice
    const elevenlabs = await getElevenLabsUsage()
    if (elevenlabs.minutes > 0 || elevenlabs.cost > 0) {
      await syncProvider(supabase, 'elevenlabs', { minutes: elevenlabs.minutes, cost: elevenlabs.cost })
      results.elevenlabs = elevenlabs
    }
    
    // Email
    const resend = await getResendUsage()
    if (resend.emails > 0) {
      await syncProvider(supabase, 'resend', { emails: resend.emails, cost: resend.cost })
      results.resend = resend
    }

    // Balances: sync the providers that expose a remaining-credit API (OpenRouter), then
    // evaluate ALL recorded balances against their per-source thresholds and email the admin
    // about any that dropped below. Anthropic/OpenAI/Open Code Zen have no balance API — their
    // balances are recorded via POST /api/admin/ops/balance and still alerted here.
    const openrouterBalance = await getOpenRouterBalance()
    if (openrouterBalance !== null) {
      await recordBalance(supabase, { provider: 'openrouter', name: 'OpenRouter', balanceUsd: openrouterBalance, organisationId: INTERNAL_ORG_ID })
      results.openrouter_balance = openrouterBalance
    }

    const alerted = await evaluateLowBalancesAndAlert(supabase)
    results.low_balance_alerts = alerted

    console.log('[cost-sync] Complete:', results)

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('[cost-sync] Fatal error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
