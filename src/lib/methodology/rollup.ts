/**
 * Card hypothesis_rows[].validation_status roll-up logic.
 *
 * After each classified response lands, aggregate signals per hypothesis row
 * and update the row's validation_status. Conservative thresholds — a single
 * response shouldn't flip a hypothesis; need ≥3 of one signal to lock.
 *
 * Per-question signal → which hypothesis row it touches: today we use a
 * 1:1 mapping (question index N → hypothesis row index N when they exist).
 * Session 3 can refine to a structured many-to-many if questions start
 * testing multiple hypotheses.
 */

import type { ClassificationSignal } from './classify'

export type ValidationStatus =
  | 'pending'
  | 'in-flight'
  | 'confirmed'
  | 'contradicted'
  | 'refined'

interface ResponseRow {
  per_question_signal: Record<string, ClassificationSignal> | null
}

interface HypothesisRow {
  field: string
  hypothesis_text: string
  validation_status?: ValidationStatus
  notes?: string
  [key: string]: unknown
}

const THRESHOLD = 3 // ≥3 of one signal to lock a row

/**
 * Roll up classified responses against a card's hypothesis_rows. Returns the
 * updated rows (immutable — caller persists).
 */
export function rollupHypothesisRows(
  rows: HypothesisRow[],
  responses: ResponseRow[]
): HypothesisRow[] {
  return rows.map((row, rowIdx) => {
    const signalCounts: Record<ClassificationSignal, number> = {
      confirms: 0,
      contradicts: 0,
      refines: 0,
      'off-topic': 0,
      'wants-more-info': 0,
    }

    for (const r of responses) {
      const pqs = r.per_question_signal
      if (!pqs) continue
      // 1:1 question→row mapping for now (see module note)
      const sig = pqs[String(rowIdx)]
      if (sig) signalCounts[sig]++
    }

    const totalSubstantive =
      signalCounts.confirms + signalCounts.contradicts + signalCounts.refines

    let newStatus: ValidationStatus
    if (totalSubstantive === 0) {
      newStatus = responses.length > 0 ? 'in-flight' : 'pending'
    } else if (signalCounts.confirms >= THRESHOLD && signalCounts.confirms >= signalCounts.contradicts) {
      newStatus = 'confirmed'
    } else if (signalCounts.contradicts >= THRESHOLD && signalCounts.contradicts > signalCounts.confirms) {
      newStatus = 'contradicted'
    } else if (signalCounts.refines >= THRESHOLD) {
      newStatus = 'refined'
    } else {
      newStatus = 'in-flight'
    }

    return { ...row, validation_status: newStatus }
  })
}
