// POST /api/admin/pipeline/[productId]/design-build/kickoff
//
// Fires the headless Design & Build job (OpenCode + cais-build-template-v2 + portfolio
// standards) by dispatching a GitHub Actions workflow in cais-shared-services. The workflow
// runs two phases — design (writes design-plan.md from the spec + standards) then build
// (writes the new site on a branch) — opens a PR on the product repo, and POSTs the PR url
// back to /design-build/result. This route just kicks it off.
//
// Existing-repo path only (TEARDOWN / RENOVATE): the product already has a repo, so the agent
// branches off it and PRs back. The net-new-repo path (no repo yet) is a later increment.
//
// Env (set in Vercel) — shared with the survey kickoff:
//   GH_DISPATCH_TOKEN     PAT with `workflow` scope on the shared repo. Required.
//   GH_SHARED_REPO        owner/name of the workflow repo. Default: caistech/cais-shared-services
//   DESIGN_BUILD_WORKFLOW workflow filename. Default: design-build.yml
//   SURVEY_WORKFLOW_REF   branch the workflow lives on. Default: main
//   KICKOFF_SECRET        OPTIONAL shared-secret guard (same as survey kickoff).

import { NextRequest, NextResponse } from 'next/server';

const GH_API = 'https://api.github.com';

export async function POST(
  req: NextRequest,
  { params }: { params: { productId: string } },
) {
  const slug = params.productId;

  try {
    const token = process.env.GH_DISPATCH_TOKEN;
    const repo = process.env.GH_SHARED_REPO || 'caistech/cais-shared-services';
    const workflow = process.env.DESIGN_BUILD_WORKFLOW || 'design-build.yml';
    const ref = process.env.SURVEY_WORKFLOW_REF || 'main';

    if (!token) {
      return NextResponse.json(
        { error: 'GH_DISPATCH_TOKEN not configured on the server' },
        { status: 500 },
      );
    }

    const required = process.env.KICKOFF_SECRET;
    if (required && req.headers.get('x-kickoff-secret') !== required) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // Body carries the survey verdict + live URL so the design phase knows whether this is a
    // teardown (rebuild) or renovation (targeted fixes) and what to read.
    let verdict = '';
    let url = '';
    try {
      const body = await req.json();
      if (body && typeof body.verdict === 'string') verdict = body.verdict.trim();
      if (body && typeof body.url === 'string') url = body.url.trim();
    } catch {
      // no body — fine; the workflow defaults
    }

    const dispatchRes = await fetch(
      `${GH_API}/repos/${repo}/actions/workflows/${workflow}/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ref, inputs: { slug, verdict, url } }),
      },
    );

    if (!dispatchRes.ok) {
      const detail = await dispatchRes.text();
      console.error('[design-build/kickoff] dispatch failed', dispatchRes.status, detail);
      return NextResponse.json(
        { error: `dispatch failed (${dispatchRes.status})`, detail },
        { status: 502 },
      );
    }

    return NextResponse.json({ started: true, slug, repo, workflow, ref });
  } catch (err) {
    console.error('[design-build/kickoff] error', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'unknown error' },
      { status: 500 },
    );
  }
}