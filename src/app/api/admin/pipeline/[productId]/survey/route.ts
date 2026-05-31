/**
 * POST /api/admin/pipeline/[productId]/survey
 *
 * Records a survey-gate verdict for a BUILT product. The post-build twin of
 * recalculate-score: where recalculate-score (now retired in favour of score.ts) judged the
 * spec, this judges the live build. It takes the survey skill's output (survey.json — the
 * per-field evidence the skill read off the site/repo + the PRE-HARD results), runs the pure
 * scorer via loadCardSurvey (which supplies the DB-side half: the 14 columns + the live
 * mvp_url check), and records the verdict to the pipeline_gates ledger.
 *
 * Body — the skill's survey.json:
 *   {
 *     fields:   [{ field: 'promise', evidenced: true, evidence: '<DOM text | repo path:line>' }, ...],
 *     pre_hard: { P1: { status: 'pass' }, P2: { status: 'fail', evidence: '...' }, P3: {...}, P4: {...} }
 *   }
 *
 * Three-door verdict (see survey.ts): INCOMPLETE-SPEC → Stage 1/2 · TEARDOWN → re-enter
 * Stage 2 · RENOVATION → Stage 5. RENOVATION is recorded as a gate PASS; the other two as FAIL.
 *
 * ── ONE WIRING DEPENDENCY (plan §3 edit #1) ─────────────────────────────────────────────────
 *  recordGate({ gate: 'survey' }) requires 'survey' in the GateName union in
 *  src/lib/methodology/pipeline-gates.ts. That edit also adds the optional deploymentId param
 *  this route forwards. Apply it before this route compiles.
 *
 *  Deployment binding (plan §3 edit #2 — DECIDED, Option 1): the verdict is computed once here
 *  via survey.ts (the single scorer); the CLI cannot import it, so the CLI does NOT record. The
 *  survey skill resolves the live deployment with `gate-check.mjs prod-deployment <slug>` and
 *  passes it as deployment_id in the POST body → bound record. A cockpit-button run omits it →
 *  unbound/provisional. No new gate-check.mjs verb is needed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { loadCardSurvey, type SurveyEvidence } from '@/lib/methodology/load-card-survey';
import { recordGate } from '@/lib/methodology/pipeline-gates';
import { SURVEY_FIELDS, type SurveyField, type PreHardCode, type PreHardResult } from '@/lib/methodology/survey';

const SURVEY_FIELD_SET = new Set<string>(SURVEY_FIELDS.map((f) => f.field));

const FieldEvidenceSchema = z.object({
  field: z.string().refine((f) => SURVEY_FIELD_SET.has(f), 'unknown survey field'),
  evidenced: z.boolean(),
  evidence: z.string().nullable().optional(),
});

const PreHardEntrySchema = z.object({
  status: z.enum(['pass', 'fail', 'unknown']),
  evidence: z.string().nullable().optional(),
});

const SurveyPayloadSchema = z.object({
  fields: z.array(FieldEvidenceSchema).max(20),
  // Optional Delta-2 binding: the live deployment this survey judged. The survey skill resolves
  // it via `gate-check.mjs prod-deployment <slug>` and passes it here so the gate is recorded
  // bound to the build. Omitted (e.g. a cockpit-button run) → unbound/provisional.
  deployment_id: z.string().nullable().optional(),
  // Explicit all-optional object (NOT z.record): in zod v4 a record keyed by an enum becomes a
  // *complete* record requiring every key — but the skill may emit a subset, and the scorer
  // treats a missing PRE-HARD as 'unknown'. Optional keys keep that tolerance.
  pre_hard: z
    .object({
      P1: PreHardEntrySchema.optional(),
      P2: PreHardEntrySchema.optional(),
      P3: PreHardEntrySchema.optional(),
      P4: PreHardEntrySchema.optional(),
    })
    .default({}),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } },
) {
  console.log('[SURVEY] ========== START ==========');
  try {
    const productSlug = params.productId.trim().toLowerCase();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = SurveyPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid survey payload', issues: parsed.error.issues },
        { status: 400 },
      );
    }

    // Map survey.json → the loader's evidence half. No citation ⇒ false (survey.ts enforces).
    const evidence: SurveyEvidence['evidence'] = {};
    for (const f of parsed.data.fields) {
      evidence[f.field as SurveyField] = {
        evidenced: f.evidenced,
        evidence: f.evidence ?? null,
      };
    }
    const preHard: PreHardResult[] = (
      Object.entries(parsed.data.pre_hard) as [PreHardCode, { status: PreHardResult['status']; evidence?: string | null } | undefined][]
    )
      .filter((e): e is [PreHardCode, { status: PreHardResult['status']; evidence?: string | null }] => e[1] != null)
      .map(([code, v]) => ({ code, status: v.status, evidence: v.evidence ?? null }));

    console.log('[SURVEY] slug:', productSlug, 'fields:', parsed.data.fields.length, 'pre_hard:', Object.keys(parsed.data.pre_hard));

    const card = await loadCardSurvey(productSlug, { evidence, preHard });
    if (!card.found || !card.result) {
      return NextResponse.json({ error: 'Product validation row not found' }, { status: 404 });
    }

    const r = card.result;
    const status: 'pass' | 'fail' = r.verdict === 'RENOVATION' ? 'pass' : 'fail';

    console.log('[SURVEY] verdict:', r.verdict, '· evidenced:', `${r.site.evidencedCount}/${r.site.total}`, '· mvp ok:', r.mvp.ok, '· pre-hard:', r.preHard.passed);

    // Record to the pipeline_gates ledger. Bound to the deployment the skill resolved (Delta 2)
    // when deployment_id is supplied; unbound/provisional from a cockpit-button run. artifactRef
    // carries the build URL either way.
    await recordGate({
      slug: productSlug,
      gate: 'survey',
      status,
      deploymentId: parsed.data.deployment_id ?? null,
      artifactRef: r.mvp.url,
      reason: `${r.verdict} → ${r.nextStage} · evidenced ${r.site.evidencedCount}/${r.site.total} · PRE-HARD ${r.preHard.passed ? 'pass' : 'fail'}`,
    });

    console.log('[SURVEY] ========== END ==========');

    return NextResponse.json(
      {
        success: true,
        slug: productSlug,
        verdict: r.verdict,
        gate_status: status,
        result: r,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('[SURVEY] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
