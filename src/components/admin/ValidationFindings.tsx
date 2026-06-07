'use client';

import React, { useState } from 'react';
import { XCircle, AlertTriangle, CircleDashed, CheckCircle2, Hammer, Loader2, PlayCircle, ShieldOff, Undo2, Wrench, HandHelping } from 'lucide-react';
import type { ScoreResult, CheckResult } from '@/lib/methodology/score';

// The real validation punch-list. Renders the actual recorded verdicts (from readiness_results,
// surfaced via score.checks) so the operator sees WHERE the build really stands and WHAT failed —
// each finding with its evidence text — instead of a bare score number. Fails that are HARD-tier
// block the gate; weighted fails lower the score; "not yet tested" checks have no verdict recorded.
//
// A failing finding the operator deliberately accepts can be WAIVED (golden rule: logged, never a
// silent na): a waiver lifts the gate block + drops the check from the weighted denominator, and
// the check moves to the "Waived" section with its reason + a one-click Lift. HARD-gate waivers
// require a type-to-confirm.

function isBlocking(tier: string): boolean {
  return tier.includes('HARD'); // HARD + CONDITIONAL-HARD
}

function FindingRow({
  c,
  onWaive,
  onLift,
  busy,
}: {
  c: CheckResult;
  onWaive?: (c: CheckResult) => void;
  onLift?: (c: CheckResult) => void;
  busy?: boolean;
}) {
  const blocking = isBlocking(c.tier);
  return (
    <li className="flex items-start gap-2.5 py-2">
      {c.status === 'waived' ? (
        <ShieldOff className="shrink-0 mt-0.5 text-sky-400" size={16} />
      ) : c.status === 'fail' ? (
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
          {c.status === 'waived' && (
            <span className="rounded bg-sky-900/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-300">Waived</span>
          )}
        </div>
        {c.status === 'waived' ? (
          <p className="mt-0.5 text-sm text-sky-200/80">
            {c.waiverReason || 'No reason recorded.'}
            {c.waivedBy ? <span className="text-sky-300/50"> — {c.waivedBy}</span> : null}
          </p>
        ) : c.evidence ? (
          <p className="mt-0.5 text-sm text-gray-400">{c.evidence}</p>
        ) : c.status === 'unknown' ? (
          <p className="mt-0.5 text-sm text-gray-500">No test has recorded a result for this check yet.</p>
        ) : null}
      </div>
      {c.status === 'fail' && onWaive && (
        <button
          onClick={() => onWaive(c)}
          disabled={busy}
          title="Deliberately accept this finding — logs a reason and lifts its effect on the gate/score"
          className="shrink-0 inline-flex items-center gap-1 rounded border border-gray-600 px-2 py-1 text-[11px] font-medium text-gray-300 hover:bg-gray-700/50 disabled:opacity-50"
        >
          {busy ? <Loader2 className="animate-spin" size={12} /> : <ShieldOff size={12} />}
          Waive
        </button>
      )}
      {c.status === 'waived' && onLift && (
        <button
          onClick={() => onLift(c)}
          disabled={busy}
          title="Lift this waiver — the check counts against the gate/score again"
          className="shrink-0 inline-flex items-center gap-1 rounded border border-sky-700 px-2 py-1 text-[11px] font-medium text-sky-300 hover:bg-sky-900/30 disabled:opacity-50"
        >
          {busy ? <Loader2 className="animate-spin" size={12} /> : <Undo2 size={12} />}
          Lift
        </button>
      )}
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
  const [runningFull, setRunningFull] = useState(false);
  const [runMsg, setRunMsg] = useState<string | null>(null);
  const [waivingCode, setWaivingCode] = useState<string | null>(null);
  const [runningConfig, setRunningConfig] = useState(false);
  const [configMsg, setConfigMsg] = useState<string | null>(null);

  async function waive(c: CheckResult) {
    if (!productSlug) return;
    const blocking = isBlocking(c.tier);
    const reason = window.prompt(`Reason for waiving "${c.label}" (#${c.code}) — this is logged and shown on the card:`);
    if (!reason || !reason.trim()) return;
    let acknowledge = false;
    if (blocking) {
      const typed = window.prompt(
        `#${c.code} is a BLOCKING (HARD) check. Waiving it lifts the gate block.\n\nType the check code "${c.code}" to confirm you accept this:`,
      );
      if (!typed || typed.trim() !== c.code) {
        window.alert('Waiver cancelled — the code did not match.');
        return;
      }
      acknowledge = true;
    }
    setWaivingCode(c.code);
    try {
      const res = await fetch(`/api/admin/pipeline/${productSlug}/waive`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ check_code: c.code, reason: reason.trim(), acknowledge }),
      });
      const data = await res.json();
      if (res.ok && data.waived) {
        window.location.reload();
      } else {
        window.alert(data.error || 'Failed to waive.');
        setWaivingCode(null);
      }
    } catch {
      window.alert('Failed to waive (network error).');
      setWaivingCode(null);
    }
  }

  async function liftWaiver(c: CheckResult) {
    if (!productSlug) return;
    if (!window.confirm(`Lift the waiver on "${c.label}" (#${c.code})? It will count against the gate/score again.`)) return;
    setWaivingCode(c.code);
    try {
      const res = await fetch(`/api/admin/pipeline/${productSlug}/waive`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ check_code: c.code }),
      });
      const data = await res.json();
      if (res.ok && data.lifted) {
        window.location.reload();
      } else {
        window.alert(data.error || 'Failed to lift the waiver.');
        setWaivingCode(null);
      }
    } catch {
      window.alert('Failed to lift the waiver (network error).');
      setWaivingCode(null);
    }
  }

  async function runFullValidation() {
    if (!productSlug) return;
    setRunningFull(true);
    setRunMsg(null);
    try {
      const res = await fetch(`/api/admin/pipeline/${productSlug}/run-full-validation`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: mvpUrl ?? '' }),
      });
      const data = await res.json();
      setRunMsg(
        res.ok && data.started
          ? 'Full validation started in CI — runs every producer (naive-tester, voice-auditor, repo checks, dual-portal) and records results. Reload the card when it finishes.'
          : data.error || 'Failed to start full validation.',
      );
    } catch {
      setRunMsg('Failed to start full validation (network error).');
    } finally {
      setRunningFull(false);
    }
  }

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
  const waived = applicable.filter((c) => c.status === 'waived');
  const passing = applicable.filter((c) => c.status === 'pass').length;

  // Route each failing finding to its fixer lane (FIXER_LANES.md): code → the builder, config →
  // the config-fixer, operator-input (or a recorded "NEEDS-YOU:" verdict) → you, with instructions.
  const isNeedsYou = (c: CheckResult) => c.fixer === 'operator-input' || (c.evidence || '').startsWith('NEEDS-YOU:');
  const codeFails = fails.filter((c) => c.fixer === 'code' && !isNeedsYou(c));
  const configFails = fails.filter((c) => c.fixer === 'config' && !isNeedsYou(c));
  const needsYou = fails.filter(isNeedsYou);

  async function runFix() {
    if (!productSlug) return;
    const ok = confirm(
      `Send the ${codeFails.length} CODE-lane failing check(s) to the builder?\n\n` +
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

  async function runConfigFix() {
    if (!productSlug) return;
    const ok = confirm(
      `Run the config-fixer for the ${configFails.length} CONFIG-lane check(s)?\n\n` +
      `This dispatches idempotent infra remediations for ${productSlug} (Vercel env hygiene, email ` +
      `infra, profiles scaffolding, QA accounts, ElevenLabs allowlist + workspace webhook) and ` +
      `records each verdict back here. Anything it can't complete (a missing product cred) is ` +
      `surfaced as "Needs you" — never silently skipped.`
    );
    if (!ok) return;
    setRunningConfig(true);
    setConfigMsg(null);
    try {
      const res = await fetch(`/api/admin/pipeline/${productSlug}/config-fix`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: mvpUrl ?? '', checks: configFails.map((c) => c.code).join(',') }),
      });
      const data = await res.json();
      setConfigMsg(
        res.ok && data.started
          ? 'Config-fixer started — idempotent infra remediations are running; verdicts record back here. Reload the card when it finishes.'
          : data.error || 'Failed to start the config-fixer.',
      );
    } catch {
      setConfigMsg('Failed to start the config-fixer (network error).');
    } finally {
      setRunningConfig(false);
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
          {waived.length > 0 && (
            <span className="inline-flex items-center gap-1 text-sky-400"><ShieldOff size={13} /> {waived.length} waived</span>
          )}
          {productSlug && (
            <button
              onClick={runFullValidation}
              disabled={runningFull}
              title="Run every producer (naive-tester, voice-auditor, repo checks, dual-portal) in CI and record results"
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-600 px-3 py-1.5 text-xs font-medium text-blue-300 hover:bg-blue-900/30 disabled:opacity-50"
            >
              {runningFull ? <Loader2 className="animate-spin" size={13} /> : <PlayCircle size={13} />}
              Run full validation
            </button>
          )}
          {productSlug && codeFails.length > 0 && (
            <button
              onClick={runFix}
              disabled={fixing}
              title="Send the CODE-lane failing checks to the repo-level Design & Build agent, then re-run validation"
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {fixing ? <Loader2 className="animate-spin" size={13} /> : <Hammer size={13} />}
              Fix {codeFails.length} code with the builder
            </button>
          )}
          {productSlug && configFails.length > 0 && (
            <button
              onClick={runConfigFix}
              disabled={runningConfig}
              title="Run the config-fixer for the CONFIG-lane checks (Vercel env, email, profiles, QA accounts, ElevenLabs) and record results"
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {runningConfig ? <Loader2 className="animate-spin" size={13} /> : <Wrench size={13} />}
              Config-fix {configFails.length}
            </button>
          )}
        </div>
        {runMsg && <p className="mt-2 text-sm text-blue-300">{runMsg}</p>}
        {fixMsg && <p className="mt-2 text-sm text-purple-300">{fixMsg}</p>}
        {configMsg && <p className="mt-2 text-sm text-teal-300">{configMsg}</p>}
      </div>

      {fails.length === 0 && notRun.length === 0 && waived.length === 0 ? (
        <div className="flex items-center gap-2 rounded border border-green-800/50 bg-green-900/20 p-3 text-sm text-green-300">
          <CheckCircle2 size={16} /> Every applicable check has a recorded pass. Nothing to fix.
        </div>
      ) : (
        <>
          {codeFails.length > 0 && (
            <div className="mb-3">
              <h3 className="mb-1 flex items-center gap-1.5 text-sm font-medium text-red-300">
                <AlertTriangle size={14} /> Code fixes ({codeFails.length}) <span className="font-normal text-gray-500">— the builder</span>
              </h3>
              <ul className="divide-y divide-gray-700/60">
                {codeFails.map((c) => (
                  <FindingRow key={c.code} c={c} onWaive={productSlug ? waive : undefined} busy={waivingCode === c.code} />
                ))}
              </ul>
            </div>
          )}
          {configFails.length > 0 && (
            <div className="mb-3">
              <h3 className="mb-1 flex items-center gap-1.5 text-sm font-medium text-teal-300">
                <Wrench size={14} /> Config fixes ({configFails.length}) <span className="font-normal text-gray-500">— the config-fixer (idempotent infra)</span>
              </h3>
              <ul className="divide-y divide-gray-700/60">
                {configFails.map((c) => (
                  <FindingRow key={c.code} c={c} onWaive={productSlug ? waive : undefined} busy={waivingCode === c.code} />
                ))}
              </ul>
            </div>
          )}
          {needsYou.length > 0 && (
            <div className="mb-3">
              <h3 className="mb-1 flex items-center gap-1.5 text-sm font-medium text-orange-300">
                <HandHelping size={14} /> Needs you ({needsYou.length}) <span className="font-normal text-gray-500">— a value/decision only you can supply</span>
              </h3>
              <p className="mb-1 text-xs text-gray-500">
                The machine can&apos;t complete these (a BYOK key, a domain, a destructive verify). Each shows what to do — supply it, or waive with a reason. Never a silent gap.
              </p>
              <ul className="divide-y divide-gray-700/60">
                {needsYou.map((c) => (
                  <FindingRow key={c.code} c={c} onWaive={productSlug ? waive : undefined} busy={waivingCode === c.code} />
                ))}
              </ul>
            </div>
          )}
          {notRun.length > 0 && (
            <div className="mb-3">
              <h3 className="mb-1 text-sm font-medium text-gray-400">Not yet tested ({notRun.length})</h3>
              <ul className="divide-y divide-gray-700/60">
                {notRun.map((c) => <FindingRow key={c.code} c={c} />)}
              </ul>
            </div>
          )}
          {waived.length > 0 && (
            <div>
              <h3 className="mb-1 flex items-center gap-1.5 text-sm font-medium text-sky-300">
                <ShieldOff size={14} /> Waived ({waived.length})
              </h3>
              <p className="mb-1 text-xs text-gray-500">
                Deliberately accepted — lifted from the gate/score, with a logged reason. Lift any to make it count again.
              </p>
              <ul className="divide-y divide-gray-700/60">
                {waived.map((c) => (
                  <FindingRow key={c.code} c={c} onLift={productSlug ? liftWaiver : undefined} busy={waivingCode === c.code} />
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
