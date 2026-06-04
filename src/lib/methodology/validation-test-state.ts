// src/lib/methodology/validation-test-state.ts
//
// Single source of truth for "did this Step-5/6 test actually pass?" — derived ONLY from the
// canonical readiness_results table, never from client state or the validation_test_status mirror
// cell. This is what stops the cockpit showing "All tests passed!" over an empty table.
//
// IMPORTANT — only PROVEN canonical homes are mapped here. Verified against live readiness_criteria
// + readiness_results:
//   • Naive Tester → the real 22-code A–D rubric VT_A1..VT_D7, written by the naive-tester SKILL
//     (gate-check.mjs, source 'naive-tester'). The tile passes only when ALL 22 are present + pass.
//   • Metadata     → codes 7 (HARD title) + 8 (OG/manifest), written by run-test (source 'auto').
//
// Everything else (auth / branding / security / privacy compliance tiles; voice / gtm / qa
// validation tiles) has NO clean 1:1 canonical home today — the cockpit's old `VT_<tile>` writes
// (VT_auth..VT_qa) were PHANTOM codes matching no criterion and scored by nothing. Rather than
// invent a home (which would be a fake-green one layer deeper), those tiles map to [] here and read
// as 'not-run' until they are deliberately wired. The auth tile in particular spans codes 23, 25,
// and VT_C1..C4 — an overlap that needs a design decision, not a guess. That is the parked
// "Step 5/6 tile→code contract" work; this file stays honest in the meantime.

export type TestCanonicalState = 'passed' | 'failed' | 'not-run';

/** The naive-tester's real 22-point A–D rubric (Admin / User / Auth / Scaffold). */
export const NAIVE_RUBRIC_CODES = [
  'VT_A1', 'VT_A2', 'VT_A3', 'VT_A4', 'VT_A5', 'VT_A6',
  'VT_B1', 'VT_B2', 'VT_B3', 'VT_B4', 'VT_B5',
  'VT_C1', 'VT_C2', 'VT_C3', 'VT_C4',
  'VT_D1', 'VT_D2', 'VT_D3', 'VT_D4', 'VT_D5', 'VT_D6', 'VT_D7',
];

/**
 * The readiness code(s) each cockpit Step-5/6 test records when genuinely run. ONLY proven homes
 * are populated; [] means "no canonical home yet → always not-run" (honest, not a pass).
 */
export const TEST_CANONICAL_CODES: Record<string, string[]> = {
  // Step 5 — compliance
  auth: [],                 // spans 23 / 25 / VT_C* — unresolved overlap, parked
  branding: [],             // no canonical code found
  metadata: ['7', '8'],     // run-test: title (7) + OG/manifest (8)
  security: [],             // likely code 39, but written by the check-39 scanner, not this tile
  privacy: [],              // no canonical code found
  // Step 6 — validation
  naive: NAIVE_RUBRIC_CODES, // the 22-code rubric, written by the real naive-tester skill
  voice: [],                // voice-auditor not wired to canonical yet
  gtm: [],                  // gtm-auditor not wired to canonical yet
  qa: [],                   // qa not wired to canonical yet
};

export interface VerdictRow {
  check_code: string;
  status: string; // 'pass' | 'fail' | 'na'
  source?: string;
  scored_at?: string;
}

/**
 * Latest verdict per check_code. Rows are expected scored_at-desc (the GET route orders them so);
 * the first row seen for a code is the newest. Mirrors score.ts's latestVerdicts.
 */
export function latestByCode(rows: VerdictRow[]): Map<string, VerdictRow> {
  const m = new Map<string, VerdictRow>();
  for (const r of rows ?? []) if (!m.has(r.check_code)) m.set(r.check_code, r);
  return m;
}

/**
 * A cockpit test's honest state from canonical verdicts (rollup-aware):
 *   - no codes mapped (unwired tile)                 → 'not-run'
 *   - no rows present for any of its codes           → 'not-run'
 *   - any present row is 'fail'                       → 'failed'
 *   - ALL codes present and passing                   → 'passed'
 *   - some present, some missing (partial run)        → 'not-run'  (cannot claim passed)
 * Rows with status 'na' count as "present but not a pass", so a partial/na set stays 'not-run'.
 */
export function testStateFromCanonical(testId: string, latest: Map<string, VerdictRow>): TestCanonicalState {
  const codes = TEST_CANONICAL_CODES[testId];
  if (!codes || codes.length === 0) return 'not-run';

  let sawAny = false;
  let allPresentAndPass = true;

  for (const code of codes) {
    const row = latest.get(code);
    if (!row) { allPresentAndPass = false; continue; }
    sawAny = true;
    if (row.status === 'fail') return 'failed';
    if (row.status !== 'pass') allPresentAndPass = false; // 'na' or unexpected → not a pass
  }

  if (!sawAny) return 'not-run';
  return allPresentAndPass ? 'passed' : 'not-run';
}

/** Map the canonical state onto the component's TestStatus union (not-run → pending). */
export function canonicalToTestStatus(state: TestCanonicalState): 'pending' | 'passed' | 'failed' {
  if (state === 'passed') return 'passed';
  if (state === 'failed') return 'failed';
  return 'pending';
}

/**
 * True only if EVERY listed test has a passing canonical verdict. Unwired tiles ([] codes) read as
 * not-run, so a banner over a set that includes unwired tiles stays OFF until they are wired — the
 * honest behavior (we do NOT treat "unwired" as "passed"). Empty/partial → false.
 */
export function allTestsPassedCanonical(testIds: string[], latest: Map<string, VerdictRow>): boolean {
  return testIds.length > 0 && testIds.every((id) => testStateFromCanonical(id, latest) === 'passed');
}

/**
 * Rollup detail for a test (present/total/passed) — handy for the UI to show "12/22" on the Naive
 * Tester tile without claiming pass. Not used by the gate; display-only.
 */
export function testRollup(testId: string, latest: Map<string, VerdictRow>): { passed: number; present: number; total: number } {
  const codes = TEST_CANONICAL_CODES[testId] ?? [];
  let passed = 0;
  let present = 0;
  for (const code of codes) {
    const row = latest.get(code);
    if (!row) continue;
    present += 1;
    if (row.status === 'pass') passed += 1;
  }
  return { passed, present, total: codes.length };
}