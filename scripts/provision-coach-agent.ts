#!/usr/bin/env node
/**
 * Provision the voice onboarding coach (Morgan) — an ElevenLabs ConvAI agent.
 *
 *   node scripts/provision-coach-agent.ts
 *
 * Requires ELEVENLABS_API_KEY in .env.local — BYOK: the agent runs on the operator's key, so all
 * voice cost lands on the operator's ElevenLabs account, not on any end user.
 *
 * Mirrors provision-cockpit-clarifier.ts (the proven repo pattern): provisionVoiceAgent()
 * name-searches + adopts/updates (aborts on 2+), writes the Security allowlist, and binds a
 * workspace-scoped post-call webhook. We give the coach its OWN post-call path
 * (/api/convai/webhooks/coach-post-call) so a FRESH workspace webhook is created and its
 * webhook_secret is emitted once — captured below and printed so it can be stored as the
 * sensitive env ELEVENLABS_WEBHOOK_SECRET (the clarifier's secret was never captured).
 *
 * Tools are CLIENT tools (type:'client') — the package's ensureWorkspaceTools filters to
 * webhook-only and would drop them, so they are attached AFTER provisioning (this runs last or
 * it gets clobbered). The browser supplies their implementations in VoiceCoach.tsx:
 *   - save_field(field, value): the operator browser POSTs to the cookie-authed coach route,
 *     which calls applyCoachFields — no server-to-server token needed (authed surface).
 *   - get_card_state(): returns N/14 + which fields are still outstanding.
 */
import * as dotenv from 'dotenv'
import { provisionVoiceAgent, standardAllowlist, type ConvAITool, type ConvAIAgentConfig } from '@caistech/elevenlabs-convai'
import { buildCoachSystemPrompt, COACH_FIRST_MESSAGE } from '../src/lib/methodology/coach-voice-context.ts'

dotenv.config({ path: '.env.local' })

const API = 'https://api.elevenlabs.io/v1/convai'
const apiKey = process.env.ELEVENLABS_API_KEY
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://corporate-ai-solutions.vercel.app'
const prodHostname = new URL(baseUrl).hostname
const POST_CALL_PATH = '/api/convai/webhooks/coach-post-call'

if (!apiKey || apiKey.trim() === '') {
  console.error('ELEVENLABS_API_KEY is missing from .env.local. This is BYOK — add the operator key and re-run.')
  process.exit(1)
}

const config: ConvAIAgentConfig = {
  agentName: 'CAS Pipeline Coach (Morgan)',
  voiceId: 'EXAVITQu4vr4xnSDxMaL', // canonical portfolio voice (voice-config.json)
  llmModel: 'gpt-4o-mini',
  temperature: 0.6,
}

// Declared so the create path knows the names; filtered out by the hub (webhook-only), then
// re-attached below with their parameter schemas.
const tools: ConvAITool[] = [
  { type: 'client', name: 'save_field', description: 'Persist one captured intake field.', parameters: { type: 'object', properties: {}, required: [] } },
  { type: 'client', name: 'get_card_state', description: 'Return outstanding intake fields.', parameters: { type: 'object', properties: {}, required: [] } },
]

// Coach client tools WITH parameter schemas (the clarifier's are param-less; save_field needs args).
const COACH_CLIENT_TOOLS = [
  {
    name: 'save_field',
    description:
      'Persist ONE intake field the operator has just answered to bar. Call once per field as you ' +
      'capture it. `field` is the exact field name (one of the 14 graded fields or a feasibility ' +
      'field: promise, distributor, end_user, friction, distributor_outcomes, end_user_outcomes, ' +
      'core_mechanism, icp_geography, icp_partner_type, icp_buyer_title, icp_verticals, ' +
      'icp_company_size, icp_stage, exclusions, proof_of_demand, demand_tier, why_now, status_quo, ' +
      'product_type, distributor_benefit_mode). `value` is the operator-confirmed answer.',
    parameters: {
      type: 'object',
      properties: {
        field: { type: 'string', description: 'The exact field name being saved.' },
        value: { type: 'string', description: "The operator's confirmed answer for that field." },
      },
      required: ['field', 'value'],
    },
  },
  {
    name: 'get_card_state',
    description:
      'Return the current intake progress for this product: how many of the 14 fields are at bar, ' +
      'and which fields (and feasibility fields) are still outstanding. Call this to decide what to ' +
      'ask next or when the operator asks how far along they are.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
]

function clientToolBody(t: { name: string; description: string; parameters: unknown }) {
  return {
    tool_config: {
      type: 'client',
      name: t.name,
      description: t.description,
      expects_response: true,
      response_timeout_secs: 20,
      parameters: t.parameters,
    },
  }
}

/** Create (or reuse) the coach client tools and bind them to prompt.tool_ids, preserving the prompt. */
async function attachCoachClientTools(key: string, agentId: string): Promise<string[]> {
  const authHeader = { 'xi-api-key': key }
  const jsonHeader = { 'xi-api-key': key, 'Content-Type': 'application/json' }
  const listRes = await fetch(`${API}/tools`, { headers: authHeader })
  const existing: Array<{ id?: string; tool_config?: { name?: string; type?: string } }> =
    listRes.ok ? ((await listRes.json()).tools ?? []) : []

  const toolIds: string[] = []
  for (const t of COACH_CLIENT_TOOLS) {
    const match = existing.find((e) => e.tool_config?.name === t.name && e.tool_config?.type === 'client')
    if (match?.id) {
      console.log(`reuse  ${t.name} -> ${match.id}`)
      toolIds.push(match.id)
      continue
    }
    const res = await fetch(`${API}/tools`, { method: 'POST', headers: jsonHeader, body: JSON.stringify(clientToolBody(t)) })
    const text = await res.text()
    if (!res.ok) throw new Error(`client tool create failed for ${t.name}: ${res.status}\n${text}`)
    const created = JSON.parse(text)
    const id = created.id ?? created.tool_id
    if (!id) throw new Error(`no id returned for ${t.name}: ${text}`)
    console.log(`create ${t.name} -> ${id}`)
    toolIds.push(id)
  }

  const agent = await (await fetch(`${API}/agents/${agentId}`, { headers: authHeader })).json()
  const currentPrompt = agent?.conversation_config?.agent?.prompt ?? {}
  const patchRes = await fetch(`${API}/agents/${agentId}`, {
    method: 'PATCH',
    headers: jsonHeader,
    body: JSON.stringify({ conversation_config: { agent: { prompt: { ...currentPrompt, tool_ids: toolIds } } } }),
  })
  if (!patchRes.ok) throw new Error(`attach failed: ${patchRes.status}\n${await patchRes.text()}`)
  return toolIds
}

async function main(): Promise<void> {
  const result = await provisionVoiceAgent(apiKey as string, {
    config,
    systemPrompt: buildCoachSystemPrompt(),
    firstMessage: COACH_FIRST_MESSAGE,
    tools,
    baseUrl,
    postCallWebhookPath: POST_CALL_PATH,
    allowedOrigins: standardAllowlist(prodHostname),
    existingAgentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_COACH || undefined,
    enableOverrides: true,
  })

  const toolIds = await attachCoachClientTools(apiKey as string, result.agentId)

  console.log('\n✅ Pipeline coach (Morgan) provisioned')
  console.log('   agentId  :', result.agentId)
  console.log('   created  :', result.created)
  console.log('   tools    :', toolIds.join(', '), '(save_field, get_card_state)')
  console.log('   allowlist:', standardAllowlist(prodHostname).join(', '))
  console.log('   webhook  :', result.webhookId, '@', baseUrl + POST_CALL_PATH)
  if (result.webhookSecret) {
    console.log('\n🔑 FRESH webhook secret (shown ONCE — store as ELEVENLABS_WEBHOOK_SECRET, Vercel sensitive):')
    console.log('   ' + result.webhookSecret)
  } else {
    console.log('\nℹ️  Existing workspace webhook reused — secret NOT re-emitted (you must already hold it).')
  }
  console.log('\nNext: set NEXT_PUBLIC_ELEVENLABS_AGENT_COACH=' + result.agentId + ' (or bake into src/voice.config.ts), then redeploy.')
}

main().catch((err) => {
  console.error('\nProvisioning failed:', err instanceof Error ? err.message : err)
  process.exit(1)
})
