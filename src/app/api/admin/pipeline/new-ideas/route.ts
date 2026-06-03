/**
 * POST /api/admin/pipeline/new-ideas
 * 
 * Conversational onboarding - the "facilitative coach" LLM that conducts
 * office-hours Q&A with the ideator.
 * 
 * Two layers:
 * - Layer A: Feasibility discovery (hard gate: proof_of_demand required)
 * - Layer B: Spec elicitation (14 fields to robustness bars)
 */

import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'

const DEMAND_TIER_ORDER = ['intuition', 'anecdote', 'article', 'search', 'waitlist']

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ConversationState {
  layer: 'A' | 'B' | 'complete'
  productName?: string
  feasibility?: {
    proof_of_demand?: string
    demand_tier?: string
    why_now?: string
    status_quo?: string
    product_type?: string
  }
  specFields?: Record<string, string>
  fieldsBelowBar?: string[]
}

const SPEC_FIELD_ROBUSTNESS_BARS: Record<string, string> = {
  promise_statement: 'One specific, falsifiable outcome — not a category ("AI tool"). Names the change for the user.',
  pain_point: 'A concrete situation a real person hits, not "it\'s hard".',
  core_mechanism: 'How it works in one line — the mechanism, not the benefit.',
  target_market: 'A named market, not "global".',
  icp_partner_type: 'A specific named archetype (e.g. "buyers\' agent firm") — reject generic ("reseller", "users").',
  icp_buyer_title: 'A real decision-maker title, not "the team".',
  icp_verticals: 'Named verticals, not "any industry".',
  icp_company_size: 'A band, not "all sizes".',
  icp_stage: 'On the allowed enum (e.g. "operating business") — reject off-enum.',
  exclusions: 'Who this is explicitly NOT for — must be non-empty.',
  distributor_model: 'A single coherent distributor archetype, not a multi-audience list.',
  distributor_outcomes: 'What the distributor gains — concrete.',
  end_user: 'A single named end-user, not a category.',
  end_user_outcomes: 'The outcome for the end user — concrete.',
}

function buildSystemPrompt(state: ConversationState): string {
  if (state.layer === 'A') {
    return `You are a facilitative coach conducting an exploratory conversation about a new product idea.

Your role is NOT to judge or reject — it's to DRAW OUT the strongest, most robust rationale from the ideator through Socratic probing. You listen, reflect back what you heard, and push back where the rationale is thin.

Core principles:
- Be conversational, warm, curious — not interrogative or coercive
- When something feels thin, probe: "What makes you confident of that?" or "What would have to be true for this to work?"
- Never lead to a preset answer or shame weak answers
- The goal is substance, not speed — take your time with each topic

Topics to explore (Layer A - Feasibility Discovery):

1. **Proof of demand** — "What makes you believe anyone wants this?"
   - Explore, don't just accept. Ask for evidence.
   - Gently test any claimed tier: "you mentioned data — which source?"
   - Acceptable tiers (capture the honest one, not aspirational):
     * intuition (just a gut feeling)
     * anecdote (someone said they wanted it)
     * article (read about the problem)
     * search/competitor-data (researched the market)
     * waitlist (people have signed up or paid)
   - If they have NO evidence at all, that's OK — just capture it honestly. You won't block them, but you must be honest about the tier.

2. **Why now** — "Why is this the right time to build this?"

3. **Status quo** — "What do people do today instead of this?"

4. **Product type** — "What kind of product is this?" (SaaS / custom / internal / infra / white-label)

Start by asking them to describe their idea in their own words. Then explore each topic naturally through conversation.`
  }

  if (state.layer === 'B') {
    const fieldsBelowBar = state.fieldsBelowBar || Object.keys(SPEC_FIELD_ROBUSTNESS_BARS)
    const fieldsToPrompt = fieldsBelowBar.slice(0, 3).join(', ')
    
    return `You are a facilitative coach helping an ideator flesh out their product specification.

The ideator has completed Layer A (feasibility discovery). Now you're moving to Layer B - eliciting the 14 specification fields.

Current feasibility context:
- Proof of demand: ${state.feasibility?.proof_of_demand || 'not captured'}
- Demand tier: ${state.feasibility?.demand_tier || 'not captured'}
- Why now: ${state.feasibility?.why_now || 'not captured'}
- Status quo: ${state.feasibility?.status_quo || 'not captured'}
- Product type: ${state.feasibility?.product_type || 'not captured'}

Fields still below robustness bar: ${fieldsToPrompt}

For each field, you must probe until the answer meets its robustness bar:

${Object.entries(SPEC_FIELD_ROBUSTNESS_BARS).map(([field, bar]) => `**${field}**: ${bar}`).join('\n')}

Instructions:
1. Ask about ONE field at a time
2. If their answer is generic or vague, push back: "Can you be more specific?" "What does that actually look like?"
3. Propose a specific value based on what they said, then ask them to confirm or refine
4. Move to the next field only after this one is solid

Remember: you want answers that will PASS THE SURVEY. Generic answers will fail. Push for specificity.`
  }

  return `You are a facilitative coach. The onboarding conversation is complete.`
}

function validateFieldRobustness(field: string, value: string): boolean {
  const bar = SPEC_FIELD_ROBUSTNESS_BARS[field]
  if (!bar) return true

  const lowerValue = value.toLowerCase()
  const lowerBar = bar.toLowerCase()

  if (field === 'target_market') {
    const genericTerms = ['global', 'worldwide', 'everywhere', 'all markets', 'any market']
    return !genericTerms.some(t => lowerValue.includes(t))
  }

  if (field === 'icp_partner_type') {
    const genericTerms = ['reseller', 'users', 'businesses', 'companies', 'customers', 'partners']
    return !genericTerms.some(t => lowerValue === t || lowerValue.includes(t + 's') && !lowerValue.includes('firm'))
  }

  if (field === 'icp_company_size') {
    const genericTerms = ['all', 'any', 'every', 'unlimited']
    return !genericTerms.some(t => lowerValue.includes(t))
  }

  if (field === 'exclusions') {
    return value.trim().length > 10
  }

  if (field.includes('outcomes') || field.includes('point') || field.includes('mechanism')) {
    return value.trim().length > 20
  }

  return value.trim().length > 5
}

function extractFeasibilityFromMessages(messages: Message[], state: ConversationState): Partial<ConversationState['feasibility']> {
  const allText = messages.map(m => m.content).join(' ')
  
  const extracted: Partial<ConversationState['feasibility']> = {}

  const demandTierMatch = allText.match(/(?:demand[ -]?tier|evidence.*?(?:intuition|anecdote|article|search|waitlist))/i)
  if (demandTierMatch) {
    const tier = DEMAND_TIER_ORDER.find(t => demandTierMatch[0].toLowerCase().includes(t))
    if (tier) extracted.demand_tier = tier
  }

  return extracted
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, state: clientState } = body as {
      messages: Message[]
      state: ConversationState
    }

    if (!messages || !Array.isArray(messages) || !clientState) {
      return NextResponse.json({ error: 'Missing messages or state' }, { status: 400 })
    }

    const systemPrompt = buildSystemPrompt(clientState)

    const anthropicMessages = [
      { role: 'user', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ]

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
    }

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: anthropicMessages
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[onboarding] Anthropic API error:', response.status, errorText)
      return NextResponse.json({ error: 'LLM call failed' }, { status: 500 })
    }

    const result = await response.json()
    const assistantMessage = result.content?.[0]?.text

    if (!assistantMessage) {
      return NextResponse.json({ error: 'No response from LLM' }, { status: 500 })
    }

    const updatedState: ConversationState = { ...clientState }

    if (clientState.layer === 'A') {
      updatedState.feasibility = {
        ...clientState.feasibility,
        ...extractFeasibilityFromMessages(messages, clientState)
      }

      const allText = messages.map(m => m.content).join(' ')
      if (allText.toLowerCase().includes('proof of demand') || 
          allText.toLowerCase().includes('evidence') ||
          allText.toLowerCase().includes('want') ||
          allText.toLowerCase().includes('need')) {
        const proofOfDemandMatch = allText.match(/(?:proof of demand|evidence|someone said|i read|i researched|i saw|people asked)/i)
        if (proofOfDemandMatch) {
          updatedState.feasibility = {
            ...updatedState.feasibility,
            proof_of_demand: proofOfDemandMatch[0]
          }
        }
      }
    }

    return NextResponse.json({
      message: assistantMessage,
      state: updatedState
    })

  } catch (error) {
    console.error('[onboarding] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
