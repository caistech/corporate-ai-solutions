/**
 * POST /api/admin/pipeline/new-ideas
 *
 * The conversational onboarding coach. Runs the 7-node ideation walk using the
 * shared coach SKILL as the system prompt. Conversation ONLY — it does not write to
 * the DB. When the walk is complete it emits an admit-ready payload (resolved 14
 * graded fields + feasibility) which the client hands to POST …/new-ideas/admit.
 *
 * Persona/structure live in the coach SKILL (cais-shared-services), NOT inline here,
 * so this route and the skill can't drift. Field names + enums match the verified
 * product_validation_status schema (2026-06-04).
 */

import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'

// Matches the live CHECK constraint feasibility_demand_tier_valid.
const DEMAND_TIERS = ['intuition', 'anecdote', 'article', 'data', 'traction'] as const
const BENEFIT_MODES = ['paid', 'value-add'] as const

// The 14 graded fields the coach resolves (exact column names).
const GRADED_FIELDS = [
  'promise', 'distributor', 'end_user', 'friction', 'distributor_outcomes',
  'end_user_outcomes', 'core_mechanism', 'icp_geography', 'icp_partner_type',
  'icp_buyer_title', 'icp_verticals', 'icp_company_size', 'icp_stage', 'exclusions',
] as const

type GradedField = (typeof GRADED_FIELDS)[number]

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AdmitPayload {
  fields: Partial<Record<GradedField, string>>
  feasibility: {
    proof_of_demand?: string
    demand_tier?: string
    why_now?: string
    status_quo?: string
    product_type?: string
    distributor_benefit_mode?: string
  }
}

interface ConversationState {
  layer: 'A' | 'B' | 'complete'
  productName?: string
  payload?: AdmitPayload
}

// Load the coach SKILL as the system prompt. Single source of truth for the 7-node
// walk, distributor dependency enforcement, robustness bars, and the write contract.
// Path: the skill ships in cais-shared-services and is vendored/synced into the app
// (adjust SKILL_PATH to wherever the sync drops it in this repo).
const SKILL_PATH =
  process.env.ONBOARDING_COACH_SKILL_PATH ||
  join(process.cwd(), 'src', 'skills', 'onboarding-coach', 'SKILL.md')

let cachedSkill: string | null = null
function loadCoachSkill(): string {
  if (cachedSkill) return cachedSkill
  try {
    cachedSkill = readFileSync(SKILL_PATH, 'utf8')
  } catch (e) {
    console.error('[onboarding] coach SKILL not found at', SKILL_PATH, e)
    // Fail loud rather than silently running a different persona than the canon.
    throw new Error('coach SKILL missing')
  }
  return cachedSkill
}

// The coach is instructed (in the SKILL) to emit, when the walk is done, a fenced
// block:  ```admit { ...AdmitPayload json... } ```  — we parse that out if present.
function extractAdmitPayload(text: string): AdmitPayload | null {
  const m = text.match(/```admit\s*([\s\S]*?)```/)
  if (!m) return null
  try {
    const parsed = JSON.parse(m[1].trim()) as AdmitPayload
    return parsed
  } catch (e) {
    console.error('[onboarding] admit block present but unparseable', e)
    return null
  }
}

// Light, non-authoritative validation so the client can show progress. The real
// gate is /admit (which re-validates against the schema + CHECK constraints).
function summariseReadiness(p: AdmitPayload | null) {
  if (!p) return { complete: false, fieldsBelowBar: [...GRADED_FIELDS] }
  const present = (v: unknown) => v !== null && v !== undefined && String(v).trim() !== ''
  const fieldsBelowBar = GRADED_FIELDS.filter((f) => !present(p.fields?.[f]))
  const f = p.feasibility || {}
  const feasibilityOk =
    present(f.proof_of_demand) &&
    DEMAND_TIERS.includes(f.demand_tier as (typeof DEMAND_TIERS)[number]) &&
    BENEFIT_MODES.includes(f.distributor_benefit_mode as (typeof BENEFIT_MODES)[number])
  return { complete: fieldsBelowBar.length === 0 && feasibilityOk, fieldsBelowBar }
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

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
    }

    let systemPrompt: string
    try {
      systemPrompt = loadCoachSkill()
    } catch {
      return NextResponse.json({ error: 'coach skill unavailable' }, { status: 500 })
    }

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: systemPrompt, // <-- top-level system param, NOT a user turn
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[onboarding] Anthropic API error:', response.status, errorText)
      return NextResponse.json({ error: 'LLM call failed' }, { status: 500 })
    }

    const result = await response.json()
    const assistantMessage: string | undefined = result.content?.[0]?.text
    if (!assistantMessage) {
      return NextResponse.json({ error: 'No response from LLM' }, { status: 500 })
    }

    // If the coach emitted a completed payload, surface it for the client to send to /admit.
    const payload = extractAdmitPayload(assistantMessage)
    const readiness = summariseReadiness(payload ?? clientState.payload ?? null)

    const updatedState: ConversationState = {
      ...clientState,
      payload: payload ?? clientState.payload,
      layer: readiness.complete ? 'complete' : clientState.layer,
    }

    return NextResponse.json({
      message: assistantMessage,
      state: updatedState,
      readiness, // { complete, fieldsBelowBar } — drives the UI + enables the Admit button
    })
  } catch (error) {
    console.error('[onboarding] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}