'use client';

import React, { useState } from 'react';
import { XCircle, AlertTriangle, CircleDashed, CheckCircle2, Hammer, Loader2 } from 'lucide-react';
import type { ScoreResult, CheckResult } from '@/lib/methodology/score';

// The real validation punch-list. Renders the actual recorded verdicts (from readiness_results,
// surfaced via score.checks) so the operator sees WHERE the build really stands and WHAT failed —
// each finding with its evidence text — instead of a bare score number. Fails that are HARD-tier
// block the gate; weighted fails lower the score; "not yet tested" checks have no verdict recorded.

function isBlocking(tier: string): boolean {
  return tier.includes('HARD'); // HARD + CONDITIONAL-HARD
}

function FindingRow({ c }: { c: CheckResult }) {
  const blocking = isBlocking(c.tier);
  return (
    <li className="flex items-start gap-2.5 py-2">
      {c.status === 'fail' ? (
        <XCircle className={`shrink-0 mt-0.5 ${blocking ? 'text-red-400' : 'text-amber-400'}`} size={16} />
      ) : (
        <CircleDashed className="shrink-0 mt-0.5 text-gray-500" size={16} />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-gray-100">{c.label}</span>
          <span className="font-mono text-[11px] text-gray-500">#{c.code}</span>
          {c.status === 'fail' && blocking && (
            <span className="rounded bg-red-900/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-300">Blocking</span>
          )}
          {c.status === 'fail' && !blocking && (
            <span className="rounded bg-amber-900/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">Lowers score</span>
          )}
          {c.status === 'unknown' && (
            <span className="rounded bg-gray-700 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-300">Not yet tested</span>
          )}
        </div>
        {c.evidence ? (
          <p className="mt-0.5 text-sm text-gray-400">{c.evidence}</p>
        ) : c.status === 'unknown' ? (
          <p className="mt-0.5 text-sm text-gray-500">No test has recorded a result for this check yet.</p>
        ) : null}
      </div>
    </li>
  );
}

export default function ValidationFindings({
  score,
  productSlug,
  mvpUrl,
}: {
  score: ScoreResult | undefined;
  productSlug?: string;
  mvpUrl?: string | null;
}) {
  const [fixing, setFixing] = useState(false);
  const [fixMsg, setFixMsg] = useState<string | null>(null);

  if (!score) {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-5">
        <h2 className="text-lg font-semibold text-white">Validation findings</h2>
        <p className="mt-1 text-sm text-gray-400">No score yet — add this product to the validation pipeline to record real results.</p>
      </div>
    );
  }

  const applicable = score.checks.filter((c) => c.applicable);
  const fails = applicable.filter((c) => c.status === 'fail').sort((a, b) => Number(isBlocking(b.tier)) - Number(isBlocking(a.tier)));
  const notRun = applicable.filter((c) => c.status === 'unknown');
  const passing = applicable.filter((c) => c.status === 'pass').length;

  const canFix = fails.length > 0 && !!productSlug;

  async function runFix() {
    if (!productSlug) return;
    const ok = confirm(
      `Send these ${fails.length} failing check(s) to the builder?\n\n` +
      `This fires the repo-level Design & Build agent on the ${productSlug} repo: it reads the ` +
      `punch-list as a binding work order, fixes the code, and opens a PR on that repo. It costs ` +
      `model time and does NOT auto-merge — you review the PR. After it deploys, re-run validation ` +
      `to see the findings turn green.`
    );
    if (!ok) return;
    setFixing(true);
    setFixMsg(null);
    try {
      const res = await fetch(`/api/admin/pipeline/${productSlug}/design-build/kickoff`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verdict: 'RENOVATION', url: mvpUrl ?? '' }),
      });
      const data = await res.json();
      if (res.ok && data.started) {
        setFixMsg('Builder started — a PR will open on the product repo. Re-run validation once it deploys.');
      } else {
        setFixMsg(data.error || 'Failed to start the builder.');
      }
    } catch {
      setFixMsg('Failed to start the builder (network error).');
    } finally {
      setFixing(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-5">
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-white">Validation findings</h2>
        <p className="mt-1 text-sm text-gray-400">
          The real results recorded for this build (survey, auto-probes, judge, naive-tester). Blocking
          fails hold the HARD gate shut; the rest lower the score. &ldquo;Not yet tested&rdquo; checks
          have no recorded result — run validation to fill them.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <span className="inline-flex items-center gap-1 text-green-400"><CheckCircle2 size={13} /> {passing} passing</span>
          <span className="inline-flex items-center gap-1 text-red-400"><XCircle size={13} /> {fails.length} failing</span>
          <span className="inline-flex items-center gap-1 text-gray-400"><CircleDashed size={13} /> {notRun.length} not yet tested</span>
          {canFix && (
            <button
              onClick={runFix}
              disabled={fixing}
              title="Send the failing checks to the repo-level Design & Build agent to fix, then re-run validation"
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {fixing ? <Loader2 className="animate-spin" size={13} /> : <Hammer size={13} />}
              Fix these {fails.length} with the builder
            </button>
          )}
        </div>
        {fixMsg && <p className="mt-2 text-sm text-purple-300">{fixMsg}</p>}
      </div>

      {fails.length === 0 && notRun.length === 0 ? (
        <div className="flex items-center gap-2 rounded border border-green-800/50 bg-green-900/20 p-3 text-sm text-green-300">
          <CheckCircle2 size={16} /> Every applicable check has a recorded pass. Nothing to fix.
        </div>
      ) : (
        <>
          {fails.length > 0 && (
            <div className="mb-3">
              <h3 className="mb-1 flex items-center gap-1.5 text-sm font-medium text-red-300">
                <AlertTriangle size={14} /> Failures ({fails.length})
              </h3>
              <ul className="divide-y divide-gray-700/60">
                {fails.map((c) => <FindingRow key={c.code} c={c} />)}
              </ul>
            </div>
          )}
          {notRun.length > 0 && (
            <div>
              <h3 className="mb-1 text-sm font-medium text-gray-400">Not yet tested ({notRun.length})</h3>
              <ul className="divide-y divide-gray-700/60">
                {notRun.map((c) => <FindingRow key={c.code} c={c} />)}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
