/**
 * POST /api/admin/pipeline/new-ideas
 *
 * The conversational onboarding coach — TWO-MODE (one door). Runs the ideation walk using the
 * shared coach SKILL as the system prompt. Conversation ONLY — it does not write to the DB.
 * When the walk is complete it emits an admit-ready payload (resolved 14 graded fields +
 * feasibility) which the client hands to POST …/new-ideas/admit.
 *
 *   - No live URL → clean-sheet conversational elicitation (the original behaviour).
 *   - Live URL present → AUTO-PREFILL: on the OPENING turn the route derives the 14 fields +
 *     P1/P2/P3 from the live build (the ONE shared helper, Rider 3) and injects them so the coach
 *     opens by presenting the prefilled spec and asks the operator to CONFIRM/CORRECT — it does
 *     NOT re-elicit from blank what the build already answers (finding #8). Derives only on the
 *     opening turn (messages.length <= 1); later turns carry the prefilled values in history.
 *
 * The derive here is GUIDANCE (it seeds the conversation); it is NOT the gate verdict — the gate
 * (admit) re-derives server-side from the pinned deployment for its own decision.
 *
 * Persona/structure live in the coach SKILL (cais-shared-services), NOT inline here, so this route
 * and the skill can't drift. Field names + enums match the product_validation_status schema.
 */

import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { deriveFieldsFromLiveUrl } from '@/lib/methodology/live-derive'
import { ANTHROPIC_API_URL, ANTHROPIC_MODEL, firstText, noThinking } from '@/lib/ai/anthropic-model'


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

// Build the prefill context appended to the system prompt when a live URL is present.
// Turns the build's derived markers into a "confirm/correct, don't re-elicit" instruction.
function buildPrefillContext(derived: {
  report: { field: string; raw: string | null; evidenced: boolean }[]
  preHard: { code: string; status: string }[]
}): string {
  const lines = derived.report.map((r) =>
    `- ${r.field}: ${
      r.raw
        ? `"${r.raw}"${r.evidenced ? '' : ' (present but generic/invalid — needs a real answer)'}`
        : '(not found on the build — elicit this one)'
    }`,
  )
  const ph = derived.preHard
    .filter((p) => ['P1', 'P2', 'P3'].includes(p.code))
    .map((p) => `${p.code}=${p.status}`)
    .join(' ')
  return (
    `\n\n---\nDEPLOYED PRODUCT — AUTO-PREFILL MODE. The operator supplied a live build URL, so the ` +
    `build already evidences the markers below. OPEN by presenting these as the prefilled 14-field ` +
    `spec and ask the operator to CONFIRM or CORRECT each — do NOT re-elicit from blank what the ` +
    `build already answers (only elicit the fields shown missing/generic).\n\n` +
    `Build markers (field: value):\n${lines.join('\n')}\n\n` +
    `Deterministic pre-hard (build-marker signal): ${ph}\n` +
    `(The admission gate RE-DERIVES these from the pinned deployment for its own verdict; treat ` +
    `them here as guidance to sharpen the spec, not as the final decision.)\n---\n`
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, state: clientState, liveUrl } = body as {
      messages: Message[]
      state: ConversationState
      liveUrl?: string
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

    // Two-mode: a live URL on the OPENING turn → derive markers + prefill (finding #8). Derive
    // once (opening turn only); later turns carry the prefilled values in the conversation history.
    // A derive failure degrades to clean-sheet elicitation rather than blocking the coach.
    if (liveUrl && liveUrl.trim() && messages.length <= 1) {
      try {
        const derived = await deriveFieldsFromLiveUrl(liveUrl.trim())
        systemPrompt += buildPrefillContext(derived)
      } catch (e) {
        console.error('[onboarding] prefill derive failed (continuing clean-sheet):', e)
      }
    }

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        // 2048, not 1024: Sonnet 5's tokenizer counts ~30% more tokens for the same text, and a
        // truncated coach turn here fails the route outright (the 500 below) rather than degrading.
        max_tokens: 2048,
        // 'medium' rather than 'low' — this one is conversational and generative, not extraction.
        ...noThinking('medium'),
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
    const assistantMessage: string | undefined = firstText(result) || undefined
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