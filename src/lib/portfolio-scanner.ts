/**
 * Portfolio Scanner
 *
 * Reads portfolio-manifest.yaml and enriches with real-time validation state from Supabase.
 * Answers: "Which products can run outreach RIGHT NOW?" and "What gaps exist?"
 *
 * SCORING (2b — canonical): readiness_score, can_run_outreach_now, gaps and action_items are
 * derived from the canonical Gate-1 scorer (score.ts / scoreCard) — the SAME scorer the /score
 * route and the methodology card page use — NOT from the product_validation_status mirror columns.
 * This is the single source of truth: a product is outreach-ready only when its HARD gate passes
 * AND it reaches the GO band (isMvpReady), with the spec fields + founder commitment in place.
 * scanPortfolio does three bulk fetches (criteria once, all readiness_results once, cards once) and
 * runs the PURE scorer in-memory per product — flat query cost regardless of portfolio size.
 *
 * NOTE: lifecycle stage, certificate, and smart-sensors below still read the mirror columns; they
 * are cosmetic dashboard chrome, not the outreach gate, and are a separate future cleanup.
 *
 * Used by:
 * - /admin/pipeline dashboard (list + filter all products)
 * - /admin/pipeline/[productId] detail view (show gaps + fix actions)
 * - Daily cron job (refresh validation status for all products)
 */

import { createClient } from '@supabase/supabase-js';
import { loadPortfolioManifest } from './portfolio-manifest';
import {
  scoreCard,
  isMvpReady,
  type Criterion,
  type CheckVerdict,
  type Waiver,
  type ScoreResult,
} from './methodology/score';

export interface ManifestProduct {
  name: string;
  vercel_project_id: string;
  supabase_project_ref?: string;
  category?: 'infrastructure' | 'own-tools' | 'product' | 'client-product';
}

export interface ProductValidationStatus {
  id: string;
  product_slug: string;
  display_name: string;
  gate1_ready: boolean;
  gate1_score_percent: number | null;
  hard_gates_passed: number;
  hard_gates_total: number;
  weighted_score_percent: number | null;
  can_run_outreach: boolean;
  outreach_blocker: string | null;
  promise: string | null;
  distributor: string | null;
  end_user: string | null;
  friction: string | null;
  has_promise: boolean;
  has_distributor: boolean;
  has_end_user: boolean;
  has_friction: boolean;
  has_methodology_commitment: boolean;
  mvp_url: string | null;
  last_validation_update: string | null;
  last_outreach_attempt: string | null;
  last_scoring_run: string;
  notes: string | null;
  is_draft: boolean;
  is_paused: boolean;
  // Validation test fields (added 2026-05-28)
  test_part_a_admin_portal?: 'passed' | 'warning' | 'failed' | 'not_run';
  test_part_b_user_portal?: 'passed' | 'warning' | 'failed' | 'not_run';
  test_part_c_auth_flows?: 'passed' | 'warning' | 'failed' | 'not_run';
  test_part_d_scaffold_verify?: 'passed' | 'warning' | 'failed' | 'not_run';
  validation_test_status?: 'passed' | 'warning' | 'failed' | 'not_run';
  validation_test_findings?: string[];
  last_validation_test_run?: string | null;
  last_validation_test_by?: string | null;
}

export interface EnrichedProduct {
  manifest: ManifestProduct;
  validation: ProductValidationStatus | null;
  ideaCard: Record<string, string> | null;  // Idea card from methodology_hypothesis_cards
  gaps: string[];  // List of missing validation fields + canonical readiness gaps
  readiness_score: number;  // 0-100: weighted progress from the canonical scorer
  can_run_outreach_now: boolean;  // GREEN: canonical Gate-1 passed (isMvpReady) + spec/commitment complete
  action_items: string[];  // What needs to happen next?
  // Canonical Gate-1 score breakdown (attached by scanPortfolio; the detail view + GET route reuse it).
  score?: ScoreResult;
  // NEW: 7-Stage House-Building Lifecycle
  current_stage: number;  // 1-7 or 0 if not started
  stage_name: string;
  certificate_of_occupancy: {
    status: 'valid' | 'expired' | 'missing' | 'pending_review' | 'issues_reported';
    valid_until?: string;
    readiness_score?: number;
  };
  smart_sensors: {
    health: 'ok' | 'warning' | 'down';
    security: 'ok' | 'warning';
    cost: 'ok' | 'warning' | 'over_budget';
  };
  // Latest recorded survey verdict from the pipeline_gates ledger (gate==='survey'), attached by
  // the GET route. Optional/null until a survey has run. Structurally matches SurveyGateRecord in
  // components/methodology/SurveyGatePanel.tsx — the client reads the verdict from `reason`.
  survey_gate?: {
    status: 'pass' | 'fail';
    reason: string | null;
    deployment_id: string | null;
    artifact_ref: string | null;
    recorded_by: string;
    created_at: string;
    result?: unknown;
  } | null;
    // Latest recorded design-build outcome from the pipeline_gates ledger (gate==='design-build'),
  // attached by the GET route. artifact_ref holds the PR url; result holds {pr_url, branch,
  // verdict_in, summary, decisions[]} for the card's PR link + override checklist.
  design_build?: {
    status: 'pass' | 'fail';
    reason: string | null;
    deployment_id: string | null;
    artifact_ref: string | null;
    recorded_by: string;
    created_at: string;
    result?: unknown;
  } | null;
  // Canonical readiness_results verdicts (newest-first), attached by the GET route so the client
  // derives Step 5/6 test state from the gate rather than the validation_test_status mirror cell.
  readiness_results?: {
    check_code: string;
    status: string;
    source?: string;
    evidence?: string | null;
    scored_at?: string;
  }[];
  // Derived per-check verdict freshness (current | stale | missing | unknown), attached by
  // the GET route. Type-only inline import keeps the scanner free of a runtime dependency.
  readiness_freshness?: import('@/lib/methodology/freshness').CardFreshness | null;
  // The Morgan onboarding conversation bound to this card (hub memory loop), attached by the GET
  // route — the walk that filled the spec fields. Newest conversation + its messages.
  coach_conversation?: {
    id: string;
    status: string;
    started_at: string;
    ended_at: string | null;
    message_count: number | null;
    last_topic: string | null;
    title: string | null;
    transcript_text: string | null;
    messages: { role: 'user' | 'assistant'; content: string; message_index: number; timestamp: string }[];
  } | null;
}

// 7-Stage Lifecycle mapping based on validation state
const STAGE_MAPPING = [
  { minScore: 0, stage: 0, name: 'Not Started' },
  { minScore: 5, stage: 1, name: 'Pre-Development' },
  { minScore: 20, stage: 2, name: 'Design & Planning' },
  { minScore: 40, stage: 3, name: 'Compliance & Standards' },
  { minScore: 60, stage: 4, name: 'Construction' },
  { minScore: 80, stage: 5, name: 'Certification & Sign-off' },
  { minScore: 90, stage: 6, name: 'Handover & Launch' },
  { minScore: 100, stage: 7, name: 'Operations & Maintenance' },
];

function determineStage(validation: ProductValidationStatus | null, readinessScore: number): { stage: number; name: string } {
  if (!validation) return { stage: 0, name: 'Not Started' };

  // Count how many fields are filled
  const fieldsFilled = [
    validation.has_promise,
    validation.has_distributor,
    validation.has_end_user,
    validation.has_friction
  ].filter(Boolean).length;

  // Stage 5+: Passed validation tests (Certification & Sign-off)
  const testStatus = validation.validation_test_status;
  if (testStatus === 'passed') {
    return { stage: 5, name: 'Certification & Sign-off' };
  }

  // Stage 4: Construction - has all methodology fields + high score but not tested
  if (fieldsFilled >= 4 && readinessScore >= 60) {
    return { stage: 4, name: 'Construction' };
  }

  // Stage 3: Compliance & Standards - has all 4 fields filled
  if (fieldsFilled >= 4) {
    return { stage: 3, name: 'Compliance & Standards' };
  }

  // Stage 2: Design & Planning - has 2-3 fields filled
  if (fieldsFilled >= 2) {
    return { stage: 2, name: 'Design & Planning' };
  }

  // Stage 1: Pre-Development - has at least 1 field or some validation started
  if (fieldsFilled >= 1 || validation.promise || validation.distributor) {
    return { stage: 1, name: 'Pre-Development' };
  }

  // Stage 0: Not Started - no meaningful data
  return { stage: 0, name: 'Not Started' };
}

function getCertificateStatus(validation: ProductValidationStatus | null): EnrichedProduct['certificate_of_occupancy'] {
  if (!validation) {
    return { status: 'missing' };
  }

  const testStatus = validation.validation_test_status;
  const score = validation.weighted_score_percent || 0;

  if (testStatus === 'passed' && score >= 80) {
    return {
      status: 'valid',
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      readiness_score: score
    };
  }

  if (testStatus === 'failed') {
    return { status: 'issues_reported' };
  }

  if (testStatus === 'warning') {
    return { status: 'pending_review' };
  }

  return { status: 'missing' };
}

function getSmartSensorsStatus(validation: ProductValidationStatus | null): EnrichedProduct['smart_sensors'] {
  // In Phase 1, we derive sensor status from existing validation data
  // Real implementation would read from sensor-data files
  const defaultStatus = { health: 'ok' as const, security: 'ok' as const, cost: 'ok' as const };

  if (!validation) {
    return { ...defaultStatus, health: 'down' };
  }

  // If tests failed, mark health as warning
  if (validation.validation_test_status === 'failed') {
    return { health: 'warning', security: 'ok', cost: 'ok' };
  }

  // If score is low, cost might be a concern
  if ((validation.weighted_score_percent || 0) < 50) {
    return { health: 'ok', security: 'ok', cost: 'warning' };
  }

  return defaultStatus;
}

// Portfolio membership now lives in the portfolio_manifest TABLE (loadPortfolioManifest),
// not the YAML file or a hardcoded fallback. The YAML remains the env-sync manifest for
// external tooling only. See migration 20260605120000_portfolio_manifest.sql + the
// `import { loadPortfolioManifest }` use in scanPortfolio below.

/**
 * Fetch validation status for all products from Supabase
 */
async function fetchValidationStatuses(
  client: any
): Promise<Map<string, ProductValidationStatus>> {
  const { data, error } = await client
    .from('product_validation_status')
    .select('id,product_slug,display_name,gate1_ready,gate1_score_percent,hard_gates_passed,hard_gates_total,weighted_score_percent,can_run_outreach,outreach_blocker,promise,distributor,end_user,friction,has_promise,has_distributor,has_end_user,has_friction,has_methodology_commitment,last_validation_update,last_outreach_attempt,last_scoring_run,created_at,updated_at,updated_by,notes,is_draft,is_paused,validation_test_results,test_part_a_admin_portal,test_part_b_user_portal,test_part_c_auth_flows,test_part_d_scaffold_verify,validation_test_status,validation_test_findings,last_validation_test_run,last_validation_test_by');

  if (error) {
    console.error('Error fetching validation statuses:', error);
    return new Map();
  }

  const map = new Map<string, ProductValidationStatus>();
  (data || []).forEach((row: any) => {
    if (row.product_slug) {
      map.set(row.product_slug, row as ProductValidationStatus);
    }
  });

  return map;
}

/**
 * Fetch the ratified readiness criteria catalogue — shared across ALL products, fetched ONCE.
 */
async function fetchCriteria(supabase: any): Promise<Criterion[]> {
  const { data, error } = await supabase
    .from('readiness_criteria')
    .select('code, check_label, tier, weight, method, applies_when, notes')
    .order('sort_order', { ascending: true });
  if (error) {
    console.error('Error fetching readiness_criteria:', error);
    return [];
  }
  return (data ?? []) as Criterion[];
}

/**
 * Fetch ALL products' readiness verdicts in ONE query, grouped by slug (newest-first per code,
 * preserved by the scored_at-desc order — scoreCard's latestVerdicts keeps the first seen).
 */
async function fetchAllReadinessResults(supabase: any): Promise<Map<string, CheckVerdict[]>> {
  const { data, error } = await supabase
    .from('readiness_results')
    .select('product_slug, check_code, status, source, evidence, scored_at')
    .order('scored_at', { ascending: false });
  const map = new Map<string, CheckVerdict[]>();
  if (error) {
    console.error('Error fetching readiness_results:', error);
    return map;
  }
  for (const row of data ?? []) {
    const slug = row.product_slug as string;
    if (!slug) continue;
    if (!map.has(slug)) map.set(slug, []);
    map.get(slug)!.push(row as CheckVerdict);
  }
  return map;
}

/**
 * Fetch ALL products' ACTIVE readiness waivers in ONE query, grouped by slug. A waiver is the
 * operator's deliberate, logged decision to lift a finding's effect on the gate/score (golden rule:
 * never a silent na). Same scorer-input shape the /score route + card page pass.
 */
async function fetchAllWaivers(supabase: any): Promise<Map<string, Waiver[]>> {
  const { data, error } = await supabase
    .from('readiness_waivers')
    .select('product_slug, check_code, reason, waived_by, active')
    .eq('active', true);
  const map = new Map<string, Waiver[]>();
  if (error) {
    console.error('Error fetching readiness_waivers:', error);
    return map;
  }
  for (const row of data ?? []) {
    const slug = row.product_slug as string;
    if (!slug) continue;
    if (!map.has(slug)) map.set(slug, []);
    map.get(slug)!.push(row as Waiver);
  }
  return map;
}

/**
 * Fetch methodology cards once: both the idea card (display) and the declared `features`
 * (the conditional flags the scorer needs for applies_when applicability).
 */
async function fetchCards(supabase: any): Promise<{
  ideaCards: Map<string, Record<string, string>>;
  features: Map<string, string[]>;
}> {
  const ideaCards = new Map<string, Record<string, string>>();
  const features = new Map<string, string[]>();
  const { data, error } = await supabase
    .from('methodology_hypothesis_cards')
    .select('product_slug, idea_card, features');
  if (error) {
    console.error('Error fetching methodology_hypothesis_cards:', error);
    return { ideaCards, features };
  }
  (data || []).forEach((row: any) => {
    if (row.idea_card) ideaCards.set(row.product_slug, row.idea_card);
    features.set(row.product_slug, (row.features as string[] | null) ?? []);
  });
  return { ideaCards, features };
}

/** Try a map by manifest name, then lowercased name (validation rows are keyed either way). */
function bySlug<T>(map: Map<string, T>, name: string): T | undefined {
  return map.get(name) ?? map.get(name.toLowerCase());
}

/** Are the four spec fields all present? (Step-1 completeness — separate from the readiness gate.) */
function specComplete(v: ProductValidationStatus | null): boolean {
  return !!v && !!v.has_promise && !!v.has_distributor && !!v.has_end_user && !!v.has_friction;
}

/**
 * Identify gaps — spec-field completeness (from validation) UNION the canonical readiness gaps
 * (from the scorer). The two halves never contradict the score because the readiness half IS the
 * score's own output (failing HARD checks + the GO shortfall), not a parallel mirror calculation.
 */
function identifyGaps(validation: ProductValidationStatus | null, scored: ScoreResult): string[] {
  if (!validation) {
    return ['Not yet added to validation pipeline'];
  }

  const gaps: string[] = [];

  // Spec-field gaps (Step 1) — these are NOT readiness-criteria; the scorer doesn't cover them.
  if (!validation.has_promise) gaps.push('Missing product promise');
  if (!validation.has_distributor) gaps.push('Missing distributor hypothesis');
  if (!validation.has_end_user) gaps.push('Missing end-user definition');
  if (!validation.has_friction) gaps.push('Missing friction/pain point');
  if (!validation.has_methodology_commitment) gaps.push('No founder commitment to validate');

  // Canonical readiness gaps — straight from the scorer (cannot disagree with the gate).
  for (const f of scored.hardGate.failing) {
    gaps.push(`HARD gate not passed: ${f.label} (${f.status})`);
  }
  if (scored.tooMuch.flagged) {
    for (const c of scored.tooMuch.checks) gaps.push(`TOO-MUCH flag (scale-infra pre-GO): ${c.label}`);
  }
  // Weighted shortfall only meaningful once the HARD gate passes (score is null before then).
  if (scored.gate1Ready && scored.score !== null && scored.band !== 'GO') {
    gaps.push(`Weighted score ${scored.score}/10 — need GO band (≥6.5)`);
  }

  return gaps;
}

/**
 * Generate action items — spec/commitment prerequisites, then the scorer's own toReachGo plan
 * (failing HARD checks first, then highest-weight unmet weighted checks).
 */
function generateActionItems(validation: ProductValidationStatus | null, scored: ScoreResult): string[] {
  if (!validation) {
    return ['Initialize product in validation pipeline'];
  }

  const actions: string[] = [];

  // Priority 1: Fill critical spec gaps
  if (!validation.has_promise) actions.push('Define product promise (1-2 sentences)');
  if (!validation.has_distributor) actions.push('Identify distributor / distribution model');
  if (!validation.has_end_user) actions.push('Define end-user persona');
  if (!validation.has_friction) actions.push('Articulate friction / pain point addressed');

  // Priority 2: Get commitment
  if (!validation.has_methodology_commitment) {
    actions.push('Get founder to commit to 4-week validation pipeline');
  }

  // Priority 3+: the scorer's path to GO (HARD checks to pass, then weighted lifts).
  for (const t of scored.toReachGo) {
    actions.push(`${t.label} — ${t.need}`);
  }

  // Ready signal — only when the canonical gate is genuinely GO and the spec is complete.
  if (isMvpReady(scored) && specComplete(validation)) {
    actions.push('✅ Ready to run outreach');
  }

  return actions;
}

/**
 * Fetch lifecycle stages from new product_lifecycle_stage table
 */
async function fetchLifecycleStages(supabase: any): Promise<Map<string, { stage: number; name: string }>> {
  const { data, error } = await supabase
    .from('product_lifecycle_stage')
    .select('product_slug, current_stage, stage_name');

  const map = new Map<string, { stage: number; name: string }>();
  (data || []).forEach((row: any) => {
    map.set(row.product_slug, { stage: row.current_stage, name: row.stage_name });
  });
  return map;
}

/**
 * Fetch certificates from new certificate_of_occupancy table
 */
async function fetchCertificates(supabase: any): Promise<Map<string, any>> {
  const { data } = await supabase
    .from('certificate_of_occupancy')
    .select('product_slug, status, valid_until, readiness_score, user_feedback_flag');

  const map = new Map<string, any>();
  (data || []).forEach((row: any) => {
    map.set(row.product_slug, {
      status: row.user_feedback_flag === 'no_issues' ? 'valid' :
             row.user_feedback_flag === 'issues_reported' ? 'issues_reported' : 'missing',
      valid_until: row.valid_until,
      readiness_score: row.readiness_score,
    });
  });
  return map;
}

/**
 * Fetch sensor data from new smart_sensors table
 */
async function fetchSensors(supabase: any): Promise<Map<string, any>> {
  const { data } = await supabase
    .from('smart_sensors')
    .select('product_slug, sensor_type, status')
    .order('checked_at', { ascending: false });

  const map = new Map<string, any>();
  (data || []).forEach((row: any) => {
    if (!map.has(row.product_slug)) {
      map.set(row.product_slug, { health: 'ok', security: 'ok', cost: 'ok' });
    }
    const current = map.get(row.product_slug);
    if (row.sensor_type === 'health') current.health = row.status;
    if (row.sensor_type === 'security') current.security = row.status;
    if (row.sensor_type === 'cost') current.cost = row.status;
  });
  return map;
}

/**
 * Scan entire portfolio: Read manifest + enrich with DB state + CANONICAL Gate-1 score.
 */
export async function scanPortfolio(): Promise<EnrichedProduct[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for server-side scanning
  );

  const projects = await loadPortfolioManifest(supabase);

  // Bulk fetches — each runs ONCE for the whole portfolio (flat query cost).
  const [
    validationStatuses,
    lifecycleStages,
    certificates,
    sensors,
    criteria,
    allResults,
    allWaivers,
    { ideaCards, features: featuresMap },
  ] = await Promise.all([
    fetchValidationStatuses(supabase),
    fetchLifecycleStages(supabase),
    fetchCertificates(supabase),
    fetchSensors(supabase),
    fetchCriteria(supabase),
    fetchAllReadinessResults(supabase),
    fetchAllWaivers(supabase),
    fetchCards(supabase),
  ]);

  if (criteria.length === 0) {
    console.warn('[portfolio-scanner] readiness_criteria empty — scores will be 0 / gates locked.');
  }

  const enriched: EnrichedProduct[] = projects.map((product) => {
    const slug = product.name;
    const validation = bySlug(validationStatuses, slug) ?? null;
    const ideaCard = bySlug(ideaCards, slug) ?? null;

    // CANONICAL score — pure function, no I/O. Same scorer as the /score route + card page.
    const scored: ScoreResult = scoreCard({
      features: bySlug(featuresMap, slug) ?? [],
      criteria,
      verdicts: bySlug(allResults, slug) ?? [],
      waivers: bySlug(allWaivers, slug) ?? [],
    });

    // Header % = weighted progress (available even pre-gate, from the scorer's own numbers).
    const readiness_score = scored.weighted.possible > 0
      ? Math.round((scored.weighted.earned / scored.weighted.possible) * 100)
      : 0;

    const gaps = identifyGaps(validation, scored);
    const action_items = generateActionItems(validation, scored);

    // THE GATE — outreach unlocks only when the canonical HARD gate passes AND the band is GO
    // (isMvpReady) AND the spec fields + founder commitment are in place. No mirror columns.
    const can_run_outreach_now =
      isMvpReady(scored) && specComplete(validation) && !!validation?.has_methodology_commitment;

    // Lifecycle / cert / sensors — cosmetic chrome, still mirror-based (separate future cleanup).
    const dbStage = bySlug(lifecycleStages, slug);
    const { stage, name } = dbStage
      ? { stage: dbStage.stage, name: dbStage.name }
      : determineStage(validation, readiness_score);

    const dbCert = bySlug(certificates, slug);
    const certificate_of_occupancy = dbCert || getCertificateStatus(validation);

    const dbSensors = bySlug(sensors, slug);
    const smart_sensors = dbSensors || getSmartSensorsStatus(validation);

    return {
      manifest: product,
      validation,
      ideaCard,
      gaps,
      readiness_score,
      can_run_outreach_now,
      action_items,
      score: scored,
      // NEW: 7-Stage House-Building Lifecycle
      current_stage: stage,
      stage_name: name,
      certificate_of_occupancy,
      smart_sensors,
    };
  });

  return enriched;
}

/**
 * Get a single product's enriched data
 */
export async function getProductPipeline(productSlug: string): Promise<EnrichedProduct | null> {
  const portfolio = await scanPortfolio();
  return portfolio.find((p) => p.manifest.name === productSlug) || null;
}

/**
 * Filter products that are READY FOR OUTREACH RIGHT NOW
 */
export async function getOutreachReadyProducts(): Promise<EnrichedProduct[]> {
  const portfolio = await scanPortfolio();
  return portfolio.filter((p) => p.can_run_outreach_now && !p.validation?.is_paused);
}

/**
 * Group products by readiness status for dashboard summary
 */
export async function getPortfolioSummary() {
  const portfolio = await scanPortfolio();

  const summary = {
    total: portfolio.length,
    ready_for_outreach: portfolio.filter((p) => p.can_run_outreach_now).length,
    in_progress: portfolio.filter(
      (p) => !p.can_run_outreach_now && p.validation && !p.validation.is_draft
    ).length,
    draft: portfolio.filter((p) => p.validation?.is_draft).length,
    paused: portfolio.filter((p) => p.validation?.is_paused).length,
    not_started: portfolio.filter((p) => !p.validation).length,
    average_readiness: Math.round(
      portfolio.reduce((sum, p) => sum + p.readiness_score, 0) / portfolio.length
    ),
  };

  return {
    summary,
    portfolio,
  };
}