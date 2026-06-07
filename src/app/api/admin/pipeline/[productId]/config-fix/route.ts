// POST /api/admin/pipeline/[productId]/config-fix
//
// The CONFIG-lane "Fix these" dispatch — the config analog of the code-lane design-build kickoff.
// Fires the config-fix GitHub Action in cais-shared-services, which runs scripts/config-fixer.mjs
// against the product: it routes each failing CONFIG-lane readiness check (Vercel env hygiene,
// email infra, profiles scaffolding, QA accounts, ElevenLabs allowlist + workspace webhook) to an
// idempotent remediation, then records the new verdict to readiness_results via gate-check.
//
// GOLDEN RULE: a check the runner can't complete (a product cred missing in CI) records as
// needs-you (fail + NEEDS-YOU: evidence) — never a silent skip. The operator can also run the
// fixer locally where the product .env.local is present.
//
// Env (shared with the survey / run-full-validation / design-build kickoffs):
//   GH_DISPATCH_TOKEN     PAT with `workflow` scope on the shared repo. Required.
//   GH_SHARED_REPO        owner/name of the workflow repo. Default: caistech/cais-shared-services
//   CONFIG_FIX_WORKFLOW   workflow filename. Default: config-fix.yml
//   SURVEY_WORKFLOW_REF   branch the workflow lives on. Default: main

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
    const workflow = process.env.CONFIG_FIX_WORKFLOW || 'config-fix.yml'
    const ref = process.env.SURVEY_WORKFLOW_REF || 'main'

    if (!token) {
      return NextResponse.json({ error: 'GH_DISPATCH_TOKEN not configured on the server' }, { status: 500 })
    }

    // Body may carry the live URL + the deployment the verdicts should bind to, and the specific
    // config check codes to remediate (omitted → the fixer auto-picks all failing config checks).
    let url = ''
    let deploymentId = ''
    let checks = ''
    try {
      const body = await req.json()
      if (body && typeof body.url === 'string') url = body.url.trim()
      if (body && typeof body.deploymentId === 'string') deploymentId = body.deploymentId.trim()
      if (body && typeof body.checks === 'string') checks = body.checks.trim()
    } catch {
      /* no body — the workflow auto-picks failing config checks */
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
        body: JSON.stringify({ ref, inputs: { slug, url, deployment_id: deploymentId, checks } }),
      },
    )

    if (!dispatchRes.ok) {
      const detail = await dispatchRes.text()
      console.error('[config-fix] dispatch failed', dispatchRes.status, detail)
      return NextResponse.json({ error: `dispatch failed (${dispatchRes.status})`, detail }, { status: 502 })
    }

    return NextResponse.json({ started: true, slug, repo, workflow, ref })
  } catch (err) {
    console.error('[config-fix] error', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'unknown error' }, { status: 500 })
  }
}
