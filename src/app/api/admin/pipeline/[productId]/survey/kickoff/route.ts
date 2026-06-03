// POST /api/admin/pipeline/[productId]/survey/kickoff
//
// Runs the survey gate. As of the deterministic-survey change this NO LONGER dispatches a GitHub
// Actions / OpenCode job — the survey is now a fast, in-process DOM-marker grep. This route is a
// thin same-origin proxy to /api/admin/pipeline/[productId]/survey so the existing cockpit button
// keeps working unchanged, but it returns the verdict synchronously (~2s) instead of kicking off a
// ~2-minute CI run and waiting for a callback.
//
// The old GitHub-dispatch env (GH_DISPATCH_TOKEN, GH_SHARED_REPO, SURVEY_WORKFLOW_FILE,
// SURVEY_WORKFLOW_REF) is now UNUSED and can be removed from Vercel. survey.yml + SURVEY_MODE.md +
// the OpenCode survey wiring are retired.
//
// (This proxy could be removed entirely by pointing the button straight at /survey — left in place
// to avoid a frontend change.)
//
// Env (optional):
//   KICKOFF_SECRET  If set, callers must send a matching `x-kickoff-secret` header. The old "this
//                   triggers a paid CI run" rationale is gone (the survey is now cheap + in-process),
//                   but the guard is kept for parity if it was configured.

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { productId: string } },
) {
  const slug = params.productId;

  try {
    // Optional shared-secret guard (off unless KICKOFF_SECRET is set).
    const required = process.env.KICKOFF_SECRET;
    if (required && req.headers.get('x-kickoff-secret') !== required) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // Forward optional overrides from the button body to the survey route.
    //   url:           override base URL (survey defaults to https://<slug>.vercel.app)
    //   deployment_id: bind the recorded gate to a specific build
    const forward: { url?: string; deployment_id?: string } = {};
    try {
      const body = await req.json();
      if (body && typeof body.url === 'string' && body.url.trim()) {
        forward.url = body.url.trim();
      }
      if (body && typeof body.deployment_id === 'string' && body.deployment_id.trim()) {
        forward.deployment_id = body.deployment_id.trim();
      }
    } catch {
      // no body / not JSON — fine, the survey route defaults everything
    }

    // Call the deterministic survey route same-origin. It fetches the manifest + DOM, greps the
    // markers, scores via survey.ts, and records the gate — then returns the verdict.
    const surveyUrl = new URL(
      `/api/admin/pipeline/${encodeURIComponent(slug)}/survey`,
      req.nextUrl.origin,
    );

    const res = await fetch(surveyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(forward),
      cache: 'no-store',
    });

    // Pass the survey route's response straight through (verdict, gate_status, result, survey trace).
    const data = await res.json().catch(() => ({ error: 'survey route returned non-JSON' }));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[survey/kickoff] error', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'unknown error' },
      { status: 500 },
    );
  }
}