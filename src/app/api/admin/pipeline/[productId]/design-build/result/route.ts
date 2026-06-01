// POST /api/admin/pipeline/[productId]/design-build/result
//
// Receives the outcome of a Design & Build run from the CI workflow and records it to the
// pipeline_gates ledger as gate='design-build'. The card reads the newest such row (same
// pattern as survey_gate) and renders the PR link so the operator knows where to review.
//
// The PR url is stored in artifact_ref (the ledger's free-text artifact slot); the structured
// payload (branch, decisions/forks the agent logged, phase) goes in `result` so the card can
// show the "decisions I made — you may want to override" checklist alongside the link.
//
// Body:
//   {
//     status: 'pass' | 'fail',          // 'pass' = PR opened OK; 'fail' = build/PR errored
//     pr_url?: string,                  // https://github.com/<owner>/<slug>/pull/N
//     branch?: string,                  // the branch the agent pushed
//     verdict_in?: string,              // the survey verdict that triggered this (TEARDOWN/RENOVATION)
//     decisions?: { question: string; chose: string; why: string }[],  // logged judgment forks
//     summary?: string,                 // one-line what-it-did
//     deployment_id?: string | null
//   }

import { NextRequest, NextResponse } from 'next/server';
import { recordGate } from '@/lib/methodology/pipeline-gates';

export async function POST(
  req: NextRequest,
  { params }: { params: { productId: string } },
) {
  const slug = params.productId.trim().toLowerCase();

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const status: 'pass' | 'fail' = body?.status === 'pass' ? 'pass' : 'fail';
    const prUrl: string | null = typeof body?.pr_url === 'string' ? body.pr_url : null;
    const branch: string | null = typeof body?.branch === 'string' ? body.branch : null;
    const summary: string | null = typeof body?.summary === 'string' ? body.summary : null;
    const verdictIn: string | null = typeof body?.verdict_in === 'string' ? body.verdict_in : null;
    const decisions = Array.isArray(body?.decisions) ? body.decisions : [];

    const reason =
      status === 'pass'
        ? `PR opened${branch ? ` (${branch})` : ''}${summary ? ` · ${summary}` : ''}`
        : `Design & Build failed${summary ? ` · ${summary}` : ''}`;

    await recordGate({
      slug,
      gate: 'design-build',
      status,
      artifactRef: prUrl, // the PR link — the card renders this as "review the PR"
      reason,
      result: {
        pr_url: prUrl,
        branch,
        verdict_in: verdictIn,
        decisions, // forks the agent decided-by-standard and is flagging for override
        summary,
      },
      deploymentId: typeof body?.deployment_id === 'string' ? body.deployment_id : null,
      recordedBy: 'design-build',
    });

    return NextResponse.json({ success: true, slug, status, pr_url: prUrl }, { status: 201 });
  } catch (err) {
    console.error('[design-build/result] error', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'unknown error' },
      { status: 500 },
    );
  }
}