// Diagnostic: read the live cockpit-clarifier agent config from ElevenLabs and print the bits
// that decide whether get_card_state actually works (tool_ids attached, tool type/expects_response,
// system prompt present, overrides enabled). Run: node scripts/diagnose-clarifier-agent.ts
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const key = process.env.ELEVENLABS_API_KEY
const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_COCKPIT_CLARIFIER || 'agent_4401kse5r5xnf1camkn8w30qftym'
if (!key) { console.error('no ELEVENLABS_API_KEY'); process.exit(1) }

const h = { 'xi-api-key': key }

const agentRes = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, { headers: h })
if (!agentRes.ok) { console.error('agent GET failed', agentRes.status, await agentRes.text()); process.exit(1) }
const agent = await agentRes.json()
const cc = agent?.conversation_config?.agent
const prompt = cc?.prompt
console.log('=== AGENT', agentId, '===')
console.log('name:', agent?.name)
console.log('system prompt (first 160):', String(prompt?.prompt ?? '(none)').slice(0, 160))
console.log('tool_ids on prompt:', JSON.stringify(prompt?.tool_ids ?? null))
console.log('inline tools (should be empty/stripped):', JSON.stringify(prompt?.tools ?? null))
console.log('overrides:', JSON.stringify(agent?.platform_settings?.overrides ?? agent?.conversation_config?.agent?.dynamic_variables ?? 'n/a'))

// Resolve each tool_id to its config so we can see type + expects_response.
const ids: string[] = prompt?.tool_ids ?? []
for (const id of ids) {
  const tr = await fetch(`https://api.elevenlabs.io/v1/convai/tools/${id}`, { headers: h })
  if (!tr.ok) { console.log(`tool ${id}: GET failed ${tr.status}`); continue }
  const t = await tr.json()
  const tc = t?.tool_config ?? t
  console.log(`tool ${id}:`, JSON.stringify({
    name: tc?.name,
    type: tc?.type,
    expects_response: tc?.expects_response,
    response_timeout_secs: tc?.response_timeout_secs,
    description: String(tc?.description ?? '').slice(0, 60),
  }))
}
