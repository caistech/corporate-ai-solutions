// Attach the two CLIENT tools to the cockpit clarifier agent.
//
// Why this exists: @caistech/elevenlabs-convai@0.4.0 ensureWorkspaceTools() filters to
// t.type==='webhook' and drops client tools, so provisionVoiceAgent ships the agent with an
// empty prompt.tool_ids — the agent then can't call get_card_state and deflects. Until the hub
// gains client-tool support, this creates the two client tools as workspace entities
// (expects_response:true so the agent waits for the return) and binds them via tool_ids,
// preserving the existing system prompt. Idempotent: reuses a workspace tool of the same name.
//
// Called automatically at the end of provision-cockpit-clarifier.ts; also runnable standalone:
//   node scripts/attach-clarifier-client-tools.ts
import * as dotenv from 'dotenv'

const API = 'https://api.elevenlabs.io/v1/convai'

const CLIENT_TOOLS = [
  {
    name: 'get_card_state',
    description:
      "Returns the current hypothesis card's authoritative state: status, Gate-1 readiness, " +
      'thin-MVP link, hypotheses, validation streams and their responses, and assigned lane. ' +
      "Call this whenever the operator's question depends on where this specific card stands.",
  },
  {
    name: 'get_methodology_context',
    description:
      'Returns the methodology definitions: the two gates, what "Launch real research" does, ' +
      'the Gate-2 decision options, the distributor gate, and the four monetisation lanes. ' +
      'Call this to ground any methodology question.',
  },
]

function clientToolBody(name: string, description: string) {
  return {
    tool_config: {
      type: 'client',
      name,
      description,
      expects_response: true,
      response_timeout_secs: 20,
      // No input parameters — both tools return the current state on demand.
      parameters: { type: 'object', properties: {}, required: [] },
    },
  }
}

/** Create (or reuse) the two client tools and bind them to the agent's prompt.tool_ids,
 *  preserving the existing prompt. Returns the attached tool ids. */
export async function attachClarifierClientTools(apiKey: string, agentId: string): Promise<string[]> {
  const authHeader = { 'xi-api-key': apiKey }
  const jsonHeader = { 'xi-api-key': apiKey, 'Content-Type': 'application/json' }

  const listRes = await fetch(`${API}/tools`, { headers: authHeader })
  const existing: Array<{ id?: string; tool_config?: { name?: string; type?: string } }> =
    listRes.ok ? ((await listRes.json()).tools ?? []) : []

  const toolIds: string[] = []
  for (const t of CLIENT_TOOLS) {
    const match = existing.find(
      (e) => e.tool_config?.name === t.name && e.tool_config?.type === 'client'
    )
    if (match?.id) {
      console.log(`reuse  ${t.name} -> ${match.id}`)
      toolIds.push(match.id)
      continue
    }
    const res = await fetch(`${API}/tools`, {
      method: 'POST',
      headers: jsonHeader,
      body: JSON.stringify(clientToolBody(t.name, t.description)),
    })
    const text = await res.text()
    if (!res.ok) throw new Error(`client tool create failed for ${t.name}: ${res.status}\n${text}`)
    const created = JSON.parse(text)
    const id = created.id ?? created.tool_id
    if (!id) throw new Error(`no id returned for ${t.name}: ${text}`)
    console.log(`create ${t.name} -> ${id}`)
    toolIds.push(id)
  }

  // Attach, preserving the existing prompt (do not clobber the system prompt).
  const agent = await (await fetch(`${API}/agents/${agentId}`, { headers: authHeader })).json()
  const currentPrompt = agent?.conversation_config?.agent?.prompt ?? {}
  const patchRes = await fetch(`${API}/agents/${agentId}`, {
    method: 'PATCH',
    headers: jsonHeader,
    body: JSON.stringify({
      conversation_config: { agent: { prompt: { ...currentPrompt, tool_ids: toolIds } } },
    }),
  })
  if (!patchRes.ok) throw new Error(`attach failed: ${patchRes.status}\n${await patchRes.text()}`)
  return toolIds
}

// CLI runner (when executed directly, not when imported by the provision script).
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('attach-clarifier-client-tools.ts')) {
  dotenv.config({ path: '.env.local' })
  const key = process.env.ELEVENLABS_API_KEY
  const agentId =
    process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_COCKPIT_CLARIFIER ||
    'agent_4401kse5r5xnf1camkn8w30qftym'
  if (!key) { console.error('no ELEVENLABS_API_KEY in .env.local'); process.exit(1) }
  const ids = await attachClarifierClientTools(key, agentId)
  console.log('\n✅ attached tool_ids:', ids.join(', '))
}
