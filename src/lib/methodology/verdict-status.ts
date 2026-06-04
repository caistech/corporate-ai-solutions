// src/lib/methodology/verdict-status.ts
//
// #1 — Close the warning -> pass integrity leak.
//
// A `warning` is a REAL non-fatal finding. Mapping it to "pass" inflated
// deal-findrs's 80% (warnings counted as greens on gate-bearing checks).
// The readiness_results status enum is pass | fail | na (no "warn" state),
// so the honest fix is fail-closed: warning -> fail for any gate-bearing check.
//
// Point the metadata + validation upserts at verdictToStatus() instead of their
// inline `warning: "pass"` mapping, then re-run survey + validation and confirm
// whether deal-findrs actually HOLDS 80%. If it drops, the prior
// "Submit for Outreach" unlock was a fake-green and should not have fired.

export type ReadinessStatus = "pass" | "fail" | "na";

/** Raw verdicts a checker can emit before mapping to a gate status. */
export type RawVerdict = "pass" | "fail" | "warning" | "na" | (string & {});

/**
 * Map a raw checker verdict to a gate-bearing readiness status.
 * - pass / na pass through
 * - warning -> fail   (was "pass" — the leak)
 * - anything unknown -> fail (fail closed; never silently green)
 */
export function verdictToStatus(verdict: RawVerdict): ReadinessStatus {
  switch (verdict) {
    case "pass":
      return "pass";
    case "na":
      return "na";
    case "fail":
      return "fail";
    case "warning":
      return "fail";
    default:
      return "fail";
  }
}

// --- LATER (optional, bigger blast radius) -------------------------------------
// If warning->fail produces too many false-fails, introduce a true NON-COUNTING
// "warn" state instead of folding warnings into fail. That is NOT a drop-in:
//   1. extend the readiness_results status enum:  pass | fail | na | warn
//   2. teach score.ts the gate to treat "warn" like "na" — excluded from BOTH
//      numerator and denominator, so a warn neither earns nor blocks the gate
//   3. surface "warn" distinctly in the cell UI (yellow, not green/red)
// Do NOT add "warn" piecemeal — a warn that score.ts still counts as a green is
// the same fake-green anti-pattern under a new label.
