// POST /api/admin/pipeline/[productId]/run-full-validation
//
// Piece 2d — the "Run full validation" dispatch. Fires the validation-run GitHub Action in
// cais-shared-services, which runs the AGENT/REPO producers the cockpit server can't run itself
// (repo-greps #35/#36/#37; the browser test-agents naive-tester + voice-auditor; the dual-portal
// VT_ plan) against the product's live URL + repo, and records each verdict to readiness_results
// via `gate-check.mjs record-readiness` (the existing seam). Bound to the supplied deployment so
// the freshness view + score reflect THIS build.
//
// The HEADLESS producers (survey + auto-probes) are NOT here — those run server-side via /rescore.
// Together rescore (headless) + run-full-validation (agent/repo) = the complete orchestrator.
//
// Env (shared with the survey/design-build kickoffs):
//   GH_DISPATCH_TOKEN     PAT with `workflow` scope on the shared repo. Required.
//   GH_SHARED_REPO        owner/name of the workflow repo. Default: caistech/cais-shared-services
//   VALIDATION_WORKFLOW   workflow filename. Default: validation-run.yml
//   SURVEY_WORKFLOW_REF   branch the workflow lives on. Default: main
//   KICKOFF_SECRET        OPTIONAL shared-secret guard.

import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/pipeline/require-operator'

const GH_API = 'https://api.github.com'

export async function POST(
  req: NextRequest,
  { params }: { params: { productId: string } },
) {
  const operator = await requireOperator()
  if (!operator) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const slug = params.productId.trim().toLowerCase()

  try {
    const token = process.env.GH_DISPATCH_TOKEN
    const repo = process.env.GH_SHARED_REPO || 'caistech/cais-shared-services'
    const workflow = process.env.VALIDATION_WORKFLOW || 'validation-run.yml'
    const ref = process.env.SURVEY_WORKFLOW_REF || 'main'

    if (!token) {
      return NextResponse.json({ error: 'GH_DISPATCH_TOKEN not configured on the server' }, { status: 500 })
    }
    const required = process.env.KICKOFF_SECRET
    if (required && req.headers.get('x-kickoff-secret') !== required) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    // Body carries the live URL + the deployment the verdicts should bind to.
    let url = ''
    let deploymentId = ''
    try {
      const body = await req.json()
      if (body && typeof body.url === 'string') url = body.url.trim()
      if (body && typeof body.deploymentId === 'string') deploymentId = body.deploymentId.trim()
    } catch {
      /* no body — the workflow defaults / records --no-deployment */
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
        body: JSON.stringify({ ref, inputs: { slug, url, deployment_id: deploymentId } }),
      },
    )

    if (!dispatchRes.ok) {
      const detail = await dispatchRes.text()
      console.error('[run-full-validation] dispatch failed', dispatchRes.status, detail)
      return NextResponse.json({ error: `dispatch failed (${dispatchRes.status})`, detail }, { status: 502 })
    }

    return NextResponse.json({ started: true, slug, repo, workflow, ref })
  } catch (err) {
    console.error('[run-full-validation] error', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'unknown error' }, { status: 500 })
  }
}
