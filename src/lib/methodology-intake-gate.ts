/**
 * Pipeline intake WIP gate — MONETISATION_RULES Rule 16 / BUSINESS_MODEL §4 (Gate 0).
 *
 * No new MANUAL operator intake is admitted to the methodology pipeline while any
 * card is UNTRIAGED. A card is triaged when it is either (i) in research or beyond,
 * or (ii) terminally decided. The always-on ideation agent's deposits sit in an
 * inbox that does not count. "Stop starting, start finishing."
 *
 * This is the single source of truth for the predicate — consumed by the cockpit
 * page, the intake API block (POST /api/methodology/cards), and the status
 * endpoint (GET /api/methodology/intake-gate) — so the UI and the server can
 * never disagree about whether intake is open.
 */

export interface IntakeGateCard {
  product_slug: string
  display_name?: string | null
  status: string | null
  pipeline_stage: string | null
  archived_at?: string | null
  inbox?: boolean | null
}

// Research has been kicked off (or the card sits past it). `status` flips to
// 'validation-in-flight' when the dual-stream research launches (see the
// validate route); `pipeline_stage` covers a card manually advanced beyond it.
const RESEARCH_OR_BEYOND_STATUS = new Set(['validation-in-flight', 'validated'])
const RESEARCH_OR_BEYOND_STAGE = new Set(['validation', 'go-no-go', 'build', 'ship'])

// Terminal Gate-2 decisions (the "not worthy of progressing / decided" outcomes).
const TERMINAL_STATUS = new Set(['kill', 'personal-interest-override', 'redesign-to-fit'])

/** Un-promoted ideation-agent deposit — never counts against the gate. */
export function isInbox(card: IntakeGateCard): boolean {
  return card.inbox === true
}

export function isInResearchOrBeyond(card: IntakeGateCard): boolean {
  return (
    RESEARCH_OR_BEYOND_STATUS.has(card.status ?? '') ||
    RESEARCH_OR_BEYOND_STAGE.has(card.pipeline_stage ?? '')
  )
}

export function isTerminallyDecided(card: IntakeGateCard): boolean {
  return Boolean(card.archived_at) || TERMINAL_STATUS.has(card.status ?? '')
}

/**
 * A card counts against the gate when it is neither in-research-or-beyond nor
 * terminally decided — and is not an un-promoted inbox card.
 *
 * Note: a "ready but stalled" card (mvp_ready with no research ever launched) is
 * untriaged by construction — it is not yet in research, which is exactly Rule 16
 * condition (a). No special-casing of mvp_ready is needed.
 */
export function isUntriaged(card: IntakeGateCard): boolean {
  if (isInbox(card)) return false
  if (isTerminallyDecided(card)) return false
  if (isInResearchOrBeyond(card)) return false
  return true
}

export interface IntakeGateState {
  open: boolean
  untriagedCount: number
  untriaged: { product_slug: string; display_name: string | null }[]
}

export function computeIntakeGate(cards: IntakeGateCard[]): IntakeGateState {
  const untriaged = cards.filter(isUntriaged)
  return {
    open: untriaged.length === 0,
    untriagedCount: untriaged.length,
    untriaged: untriaged.map((c) => ({
      product_slug: c.product_slug,
      display_name: c.display_name ?? null,
    })),
  }
}
