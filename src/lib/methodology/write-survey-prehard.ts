// src/lib/methodology/write-survey-prehard.ts
//
// #3 — Per-check PRE-HARD sourcing.
//
// The bug: survey/route.ts wrote P1 from the OVERALL survey verdict and P2/P3 from the SHARED
// preHard.passed flag — so all three carried the same coarse signal instead of their own result.
// survey() already produces a per-code result for each PRE-HARD (result.preHard.results[]), each
// with its own status + evidence. This writer persists each gating code (P1/P2/P3) from ITS OWN
// result, so the readiness_results verdicts match what the survey actually found per check.
//
// In survey/route.ts, after `const result = survey(input)`, replace the old per-code writes with:
//     await writeSurveyPreHard(productId, result)
//
// NOTE (upstream, in the survey SKILL — not fixable here): the route can only write what the skill
// put in survey.json pre_hard{}. Ensure the skill emits:
//   - P1 from the homepage-200 sub-result   (NOT the overall verdict)
//   - P2 / P3 from their own sub-results     (NOT a shared preHard flag)
// Then this writer faithfully persists each. Source per code mirrors the session decision:
// P1 is machine-checkable (auto); P2/P3 are judged.

import { upsertReadinessResult } from '@/lib/methodology/readiness-results';
// Adjust this path to wherever the survey scorer module lives in your tree:
import {
  GATING_PRE_HARD,
  type SurveyResult,
  type PreHardCode,
  type CheckStatus,
} from '@/lib/methodology/survey';

const PRE_HARD_SOURCE: Record<PreHardCode, 'auto' | 'judge'> = {
  P1: 'auto',  // homepage-200 — machine-checkable
  P2: 'judge',
  P3: 'judge',
  P4: 'auto',  // informational, not gating; never written here
};

/** pass/fail map straight through; 'unknown' is undetermined → write NO verdict, so the HARD
 *  gate stays honestly unearned (score.ts treats a missing verdict as the gate not passing). */
function toReadiness(status: CheckStatus): 'pass' | 'fail' | null {
  if (status === 'pass') return 'pass';
  if (status === 'fail') return 'fail';
  return null; // 'unknown'
}

export async function writeSurveyPreHard(
  productSlug: string,
  result: SurveyResult,
): Promise<void> {
  for (const pre of result.preHard.results) {
    if (!GATING_PRE_HARD.includes(pre.code)) continue; // P1/P2/P3 only; P4 is informational
    const status = toReadiness(pre.status);
    if (status === null) continue; // undetermined — leave the gate unearned, don't fake it
    await upsertReadinessResult({
      productSlug,
      checkCode: pre.code,
      status,
      source: PRE_HARD_SOURCE[pre.code],
      evidence: pre.evidence ?? null,
    });
  }
}
