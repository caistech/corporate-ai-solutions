#!/usr/bin/env node
/**
 * Provision the methodology-cockpit in-context clarifier (ElevenLabs ConvAI agent).
 *
 *   npx ts-node scripts/provision-cockpit-clarifier.ts
 *   (or: npm run provision:clarifier)
 *
 * Requires ELEVENLABS_API_KEY in .env.local — BYOK: the agent runs on this key, so all voice
 * cost lands on the operator's ElevenLabs account, not on any end user.
 *
 * Idempotent: provisionVoiceAgent() name-searches the workspace and UPDATES an existing agent
 * of the same name instead of creating a duplicate (it aborts if 2+ already exist). It also
 * declares the two client tools as workspace tools, enables conversation_config overrides, and
 * writes the Security allowlist. On success it prints the agent id — paste it into
 * src/voice.config.ts as the fallback (or set NEXT_PUBLIC_ELEVENLABS_AGENT_COCKPIT_CLARIFIER on
 * Vercel) and redeploy so the widget appears on the card detail page.
 */
import * as dotenv from 'dotenv'
import {
  provisionVoiceAgent,
  standardAllowlist,
  type ConvAITool,
  type ConvAIAgentConfig,
} from '@caistech/elevenlabs-convai'
// .ts extension: run with native Node type-stripping (node scripts/...ts), which resolves
// the literal path — no ts-node, which cycle-errors on Node 24.
import { buildClarifierSystemPrompt, CLARIFIER_FIRST_MESSAGE } from '../src/lib/methodology/clarifier-context.ts'
import { attachClarifierClientTools } from './attach-clarifier-client-tools.ts'

dotenv.config({ path: '.env.local' })

const apiKey = process.env.ELEVENLABS_API_KEY
const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL || 'https://corporate-ai-solutions.vercel.app'
const prodHostname = new URL(baseUrl).hostname

if (!apiKey || apiKey.trim() === '') {
  console.error(
    'ELEVENLABS_API_KEY is missing from .env.local. This is BYOK — add the operator key and re-run.'
  )
  process.exit(1)
}

// Canonical portfolio voice (cais-shared-services/voice-config.json).
const config: ConvAIAgentConfig = {
  agentName: 'CAS Methodology Cockpit Clarifier',
  voiceId: 'EXAVITQu4vr4xnSDxMaL',
  llmModel: 'gpt-4o-mini',
  temperature: 0.5,
}

// Client tools — declared on the agent so the LLM knows it can call them; the browser-side
// implementations are supplied at runtime via the VoiceWidget `clientTools` map. Both take no
// parameters: each simply returns the current authoritative state on demand (pull-not-push).
const tools: ConvAITool[] = [
  {
    type: 'client',
    name: 'get_card_state',
    description:
      "Returns the current hypothesis card's authoritative state: status, Gate-1 readiness, " +
      'thin-MVP link, hypotheses, validation streams and their responses, and assigned lane. ' +
      "Call this whenever the operator's question depends on where this specific card stands.",
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    type: 'client',
    name: 'get_methodology_context',
    description:
      'Returns the methodology definitions: the two gates, what "Launch real research" does, ' +
      'the Gate-2 decision options, the distributor gate, and the four monetisation lanes. ' +
      'Call this to ground any methodology question.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
]

async function main(): Promise<void> {
  const result = await provisionVoiceAgent(apiKey as string, {
    config,
    systemPrompt: buildClarifierSystemPrompt(),
    firstMessage: CLARIFIER_FIRST_MESSAGE,
    tools,
    baseUrl,
    allowedOrigins: standardAllowlist(prodHostname),
    existingAgentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_COCKPIT_CLARIFIER || undefined,
    enableOverrides: true,
  })

  // The hub package cannot wire client tools (ensureWorkspaceTools filters to webhook-only and,
  // on the update path, wipes tool_ids to []), so attach the two client tools here, AFTER
  // provisioning — this must run last or it gets clobbered. Without it the agent ships with zero
  // tools and the clarifier deflects every card-specific question.
  const toolIds = await attachClarifierClientTools(apiKey as string, result.agentId)

  console.log('\n✅ Methodology cockpit clarifier provisioned')
  console.log('   agentId :', result.agentId)
  console.log('   created :', result.created)
  console.log('   tools   :', toolIds.join(', '), '(get_card_state, get_methodology_context)')
  console.log('   allowlist:', standardAllowlist(prodHostname).join(', '))
  console.log('\nNext step — wire the id so the widget renders:')
  console.log('   • set NEXT_PUBLIC_ELEVENLABS_AGENT_COCKPIT_CLARIFIER=' + result.agentId)
  console.log('     (Vercel env), or paste it as the fallback in src/voice.config.ts, then redeploy.')
}

main().catch((err) => {
  console.error('\nProvisioning failed:', err instanceof Error ? err.message : err)
  process.exit(1)
})
