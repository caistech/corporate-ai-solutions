// src/lib/methodology/validation-test-state.ts
//
// Single source of truth for "did this Step-5/6 test actually pass?" — derived ONLY from the
// canonical readiness_results table, never from client state or the validation_test_status mirror
// cell. This is what stops the cockpit showing "All tests passed!" over an empty table.
//
// CODE SCHEME — verified against live readiness_criteria + the naive-tester SKILL.md (v1.1.0):
// The naive-tester skill records NUMERIC codes (1,2,3,4,5,6,10,22,23,24,25,26,27,29,31,32,33,34,41)
// via gate-check.mjs `record-readiness --source naive-tester`. All 19 exist in readiness_criteria
// with NAIVE in their method and proper tiers, so score.ts scores them. (An older scheme wrote
// VT_A1..D7 — those criteria are now orphans nothing current writes; do NOT map tiles to them.)
//
//   • Naive Tester → the numeric NAIVE-observable rubric below. Passes only when every observable
//     code is present + pass. Auth codes (22–25) are 'na' for products with no auth, so the tile
//     can still pass on a no-auth product; on an auth product they must pass.
//   • Metadata     → codes 7 (HARD title) + 8 (OG/manifest), AUTO-owned by run-test.
//
// Compliance tiles other than metadata, and voice/gtm/qa, have NO clean 1:1 canonical home yet —
// they map to [] (always 'not-run', honest) until the "tile→code contract" is defined. Code 10
// (voice agent) is VOICE/NAIVE — it belongs to the voice-auditor, not the naive tile, so it is
// intentionally NOT in the naive list here.

export type TestCanonicalState = 'passed' | 'failed' | 'not-run';

/**
 * The NAIVE-observable numeric codes the naive-tester skill records (per SKILL.md mapping table),
 * minus the AUTO-owned (7,8) and VOICE-owned (10) codes. These are what the "Naive Tester" tile
 * reflects. 'na' verdicts (e.g. auth codes on a no-auth product) do not block a pass.
 */
export const NAIVE_RUBRIC_CODES = [
  '1',  // explanatory header (what/do/why) + empty states
  '2',  // responsive 375 + 1440, no h-scroll
  '3',  // touch >=44px, text >=16px, table mobile strategy
  '4',  // nav collapses to drawer/hamburger
  '5',  // landing sells the concept
  '6',  // emotional register matches the product
  '22', // forgot-password link + working reset
  '23', // password visibility toggle
  '24', // working magic-link
  '25', // auth smoke-test (signup/login/reset/magic-link)
  '26', // persistent left navbar on authed routes + active indicator
  '27', // /settings (Profile/Password/Notifications/Account)
  '29', // sign out present
  '31', // consequence clarity on irreversible/cost/outreach + confirm
  '32', // zero dead ends
  '33', // content/IP acknowledgment where 3rd-party IP
  '34', // address->Mapbox / company->ABN lookup
  '41', // the human walkthrough itself
];

/**
 * The readiness code(s) each cockpit Step-5/6 test records when genuinely run. ONLY proven homes
 * are populated; [] means "no canonical home yet -> always not-run" (honest, not a pass).
 */
export const TEST_CANONICAL_CODES: Record<string, string[]> = {
  // Step 5 - compliance
  auth: [],                 // spans 22-25 + 26/27/29 - overlaps the naive rubric; contract unresolved, parked
  branding: [],             // no canonical code found
  metadata: ['7', '8'],     // run-test (AUTO): title (7) + OG/manifest (8)
  security: [],             // likely code 39, written by the check-39 scanner, not this tile
  privacy: [],              // no canonical code found
  // Step 6 - validation
  naive: NAIVE_RUBRIC_CODES, // the numeric NAIVE rubric, written by the naive-tester skill
  voice: ['10'],            // code 10 (voice agent) - VOICE/NAIVE; written by voice-auditor/naive
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
 *   - no codes mapped (unwired tile)                 -> 'not-run'
 *   - no rows present for any of its codes           -> 'not-run'
 *   - any present row is 'fail'                       -> 'failed'
 *   - every present row is pass/na AND at least one is pass, with no code missing -> 'passed'
 *   - some codes missing (partial run)                -> 'not-run' (cannot claim passed)
 * 'na' counts as "present and non-blocking" (e.g. auth codes on a no-auth product): it does not
 * fail the tile, but a tile of all-'na' (nothing actually exercised) stays 'not-run'.
 */
export function testStateFromCanonical(testId: string, latest: Map<string, VerdictRow>): TestCanonicalState {
  const codes = TEST_CANONICAL_CODES[testId];
  if (!codes || codes.length === 0) return 'not-run';

  let anyMissing = false;
  let anyPass = false;

  for (const code of codes) {
    const row = latest.get(code);
    if (!row) { anyMissing = true; continue; }
    if (row.status === 'fail') return 'failed';
    if (row.status === 'pass') anyPass = true;
    // 'na' is present + non-blocking
  }

  if (anyMissing) return 'not-run'; // partial / never-run
  return anyPass ? 'passed' : 'not-run'; // all-na (nothing exercised) is not a pass
}

/** Map the canonical state onto the component's TestStatus union (not-run -> pending). */
export function canonicalToTestStatus(state: TestCanonicalState): 'pending' | 'passed' | 'failed' {
  if (state === 'passed') return 'passed';
  if (state === 'failed') return 'failed';
  return 'pending';
}

/**
 * True only if EVERY listed test has a passing canonical verdict. Unwired tiles ([] codes) read as
 * not-run, so a banner over a set that includes unwired tiles stays OFF until they are wired - the
 * honest behavior (we do NOT treat "unwired" as "passed"). Empty/partial -> false.
 */
export function allTestsPassedCanonical(testIds: string[], latest: Map<string, VerdictRow>): boolean {
  return testIds.length > 0 && testIds.every((id) => testStateFromCanonical(id, latest) === 'passed');
}

/**
 * Rollup detail for a test (present/total/passed/na) - handy for the UI to show "12/18" on the
 * Naive Tester tile without claiming pass. Not used by the gate; display-only.
 */
export function testRollup(testId: string, latest: Map<string, VerdictRow>): { passed: number; na: number; present: number; total: number } {
  const codes = TEST_CANONICAL_CODES[testId] ?? [];
  let passed = 0, na = 0, present = 0;
  for (const code of codes) {
    const row = latest.get(code);
    if (!row) continue;
    present += 1;
    if (row.status === 'pass') passed += 1;
    else if (row.status === 'na') na += 1;
  }
  return { passed, na, present, total: codes.length };
}