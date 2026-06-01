// POST /api/admin/pipeline/[productId]/survey/kickoff
//
// Fires the headless survey job (OpenCode + naive-tester) by dispatching a GitHub Actions
// workflow in cais-shared-services. The workflow browses the live site + repo, writes
// survey.json, and POSTs it back to /survey — so this route just kicks it off and returns.
//
// Env (set in Vercel):
//   GH_DISPATCH_TOKEN   PAT with `workflow` scope (and read on the shared repo). Required.
//   GH_SHARED_REPO      owner/name of the workflow repo. Default: caistech/cais-shared-services
//   SURVEY_WORKFLOW_FILE  workflow filename. Default: survey.yml
//   SURVEY_WORKFLOW_REF   branch the workflow lives on. Default: main
//   KICKOFF_SECRET      OPTIONAL. If set, callers must send a matching `x-kickoff-secret`
//                       header. Leave unset to allow same-origin button clicks. NOTE: this
//                       endpoint triggers a paid CI run — tighten /api/admin/* in middleware soon.

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
    const workflow = process.env.SURVEY_WORKFLOW_FILE || 'survey.yml';
    const ref = process.env.SURVEY_WORKFLOW_REF || 'main';

    if (!token) {
      return NextResponse.json(
        { error: 'GH_DISPATCH_TOKEN not configured on the server' },
        { status: 500 },
      );
    }

    // Optional shared-secret guard (off unless KICKOFF_SECRET is set).
    const required = process.env.KICKOFF_SECRET;
    if (required && req.headers.get('x-kickoff-secret') !== required) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // Live URL: take it from the button body; the workflow defaults to https://<slug>.vercel.app/
    // if it's blank.
    let url = '';
    try {
      const body = await req.json();
      if (body && typeof body.url === 'string') url = body.url.trim();
    } catch {
      // no body / not JSON — fine, workflow will default the URL
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
        body: JSON.stringify({ ref, inputs: { slug, url } }),
      },
    );

    // GitHub returns 204 No Content on a successful dispatch.
    if (!dispatchRes.ok) {
      const detail = await dispatchRes.text();
      console.error('[survey/kickoff] dispatch failed', dispatchRes.status, detail);
      return NextResponse.json(
        { error: `dispatch failed (${dispatchRes.status})`, detail },
        { status: 502 },
      );
    }

    return NextResponse.json({ started: true, slug, repo, workflow, ref });
  } catch (err) {
    console.error('[survey/kickoff] error', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'unknown error' },
      { status: 500 },
    );
  }
}