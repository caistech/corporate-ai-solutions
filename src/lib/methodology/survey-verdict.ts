// Single source for the survey verdict parse — previously duplicated byte-for-byte in
// components/admin/ProductDetailView.tsx and components/methodology/SurveyGatePanel.tsx
// (each carried a comment warning the other must be kept identical). The survey route records
// `reason` as "VERDICT → next stage · evidenced X/14 · PRE-HARD …"; recover the verdict from the
// leading token, falling back to the pass/fail status.
//
// Takes a minimal structural shape (not the full SurveyGateRecord) so this stays a pure lib with
// no dependency on the client components that consume it.

export type Verdict = 'RENOVATION' | 'TEARDOWN' | 'INCOMPLETE-SPEC' | 'UNKNOWN';

export function parseVerdict(rec: { reason: string | null; status: 'pass' | 'fail' }): Verdict {
  const head = (rec.reason ?? '').trim().split(/[\s→]/)[0]?.toUpperCase();
  if (head === 'RENOVATION' || head === 'TEARDOWN' || head === 'INCOMPLETE-SPEC') return head;
  return rec.status === 'pass' ? 'RENOVATION' : 'UNKNOWN';
}
