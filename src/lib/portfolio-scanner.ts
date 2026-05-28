/**
 * Portfolio Scanner
 * 
 * Reads portfolio-manifest.yaml and enriches with real-time validation state from Supabase.
 * Answers: "Which products can run outreach RIGHT NOW?" and "What gaps exist?"
 * 
 * Used by:
 * - /admin/pipeline dashboard (list + filter all products)
 * - /admin/pipeline/[productId] detail view (show gaps + fix actions)
 * - Daily cron job (refresh validation status for all products)
 */

import { createClient } from '@supabase/supabase-js';
import YAML from 'yaml';
import * as fs from 'fs';
import * as path from 'path';

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
  gaps: string[];  // List of missing validation fields
  readiness_score: number;  // 0-100: how ready for outreach?
  can_run_outreach_now: boolean;  // GREEN: ready to start outreach
  action_items: string[];  // What needs to happen next?
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

/**
 * Read portfolio-manifest.yaml from the shared services repo or use hardcoded fallback
 */
function readManifest(): { projects: ManifestProduct[] } {
  // Try to read from filesystem (works in local dev)
  const possiblePaths = [
    path.resolve(__dirname, '../../../cais-shared-services/portfolio-manifest.yaml'),
    path.resolve(__dirname, '../../cais-shared-services/portfolio-manifest.yaml'),
    path.resolve(process.cwd(), 'cais-shared-services/portfolio-manifest.yaml'),
  ];

  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf-8');
        const yaml = YAML.parse(content);
        return yaml;
      }
    } catch (e) {
      // Continue to next path
    }
  }

  // Fallback: hardcoded portfolio list (for Vercel where filesystem access is limited)
  console.log('Manifest file not found, using hardcoded portfolio list');
  return {
    projects: [
      // ============ INFRASTRUCTURE (shared @caistech services & platform) ============
      { name: 'platform-trust', vercel_project_id: 'prj_NTvBNN6cBAoAOoIgp84dYvxZCNtf', category: 'infrastructure' },
      { name: 'property-services', vercel_project_id: 'prj_bzS0HfyExXQXMsQAK9bH6SkrwQb0', category: 'infrastructure' },
      { name: 'storefront-mcp', vercel_project_id: 'prj_7fXPw71NH0cwx5xHHov1OM5dhAr3', category: 'infrastructure' },
      
      // ============ OWN-TOOLS (internal factory use) ============
       { name: 'preflight', vercel_project_id: 'prj_09p4jLZy9LouVOWIOmyKYNNKmg63', category: 'own-tools' },
       
       // ============ CLIENT PRODUCTS (paid custom builds for specific clients) ============
       { name: 'mmcbuild', vercel_project_id: 'prj_qKKLAkGGGVH5KocDfoGZQOqIZGvj', category: 'client-product' },
       
       // ============ PRODUCTS (Lane 1: Paid Distributor SaaS) ============
       // Pipeline: validation engine for distributors (sales agencies, marketing agencies, dev shops, accountants, consultants)
       // Currently hosted in corporate-ai-solutions repo, will be separated later
       { name: 'pipeline', vercel_project_id: 'prj_NaY4ybDsjSmJ7RgBbdD2BILm8nLl', category: 'product' },
       
       // ============ PRODUCTS (distributor production) ============
       // Lane 1: Paid Distributor SaaS (primary revenue)
      { name: 'deal-findrs', vercel_project_id: 'prj_B0pKJM1fTAD5FtbZudh4kUEhaqQM', category: 'product' },
      { name: 'f2k-checkpoint-new', vercel_project_id: 'prj_XPELCzoIwOY5NoHGJxd4Ah6w59G9', category: 'product' },
      { name: 'investorpilot', vercel_project_id: 'prj_investorpilot', category: 'product' },
      { name: 'ndissda-automate', vercel_project_id: 'prj_ndissda_automate', category: 'product' },
      { name: 'r-and-d-tax', vercel_project_id: 'prj_r_and_d_tax', category: 'product' },
      { name: 'tenderwatch', vercel_project_id: 'prj_tenderwatch', category: 'product' },
      { name: 'f2k-fund-tokenisation', vercel_project_id: 'prj_f2k_fund_tokenisation', category: 'product' },
      
      // Lane 4: Free BYOK Products (awareness/marketing)
      { name: 'easy-claude-code', vercel_project_id: 'prj_sedjiKhnHUBginSeK2jP555u4wAp', category: 'product' },
      { name: 'sayfix', vercel_project_id: 'prj_7N65GURc3slhs5QL013Bo95AxD7i', category: 'product' },
      
      // Lane 2/3: Studio-in-Residence & Contract Builds (some revenue, validation in progress)
      { name: 'connexions', vercel_project_id: 'prj_pG5gak2uSAQQCKLvf39G72wcaqnG', category: 'product' },
      { name: 'kira', vercel_project_id: 'prj_itVurDE9CD77K9rGWEQZNDmn33yz', category: 'product' },
      { name: 'launchready', vercel_project_id: 'prj_DQS8A4CW2yVam1eJycDTiIZbGYUl', category: 'product' },
      { name: 'universal-interviews', vercel_project_id: 'prj_j9Xv0a6A0eU7naa8Ciw3jprYKlnL', category: 'product' },
      { name: 'raiseready-template', vercel_project_id: 'prj_fKuIr7tWjKyWTgXDMCJYuhKQIylD', category: 'product' },
      { name: 'partner-pilot', vercel_project_id: 'prj_partner_pilot', category: 'product' },
      { name: 'outreach-ready', vercel_project_id: 'prj_outreach_ready', category: 'product' },
      
      // Unaudited/In-Progress (will be categorized after manifest audit)
      { name: 'smart-board', vercel_project_id: 'prj_BUzAZzsnUyARewFEpO6OpXV7zqac', category: 'product' },
      { name: 'hair-stylist-ai', vercel_project_id: 'prj_sJ6UwGIaO05WnortzlLP5cIx9Azi', category: 'product' },
      { name: 'lessonslearned', vercel_project_id: 'prj_f6efDw4g7FfXG0hnKVGR5Mv2202n', category: 'product' },
      { name: 'community-question-responder', vercel_project_id: 'prj_2VGX4tqLk3WtwSfl3Lawp2TQ6jyL', category: 'product' },
      { name: 'disaster-support', vercel_project_id: 'prj_disaster_support', category: 'product' },
      { name: 'lingo-pure-ai', vercel_project_id: 'prj_lingo_pure_ai', category: 'product' },
      { name: 'mova', vercel_project_id: 'prj_mova', category: 'product' },
      { name: 'rehearsals-ai', vercel_project_id: 'prj_rehearsals_ai', category: 'product' },
      { name: 'tourlingo', vercel_project_id: 'prj_tourlingo', category: 'product' },
      { name: 'universal-lingo', vercel_project_id: 'prj_universal_lingo', category: 'product' },
    ],
  };
}

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
 * Identify gaps in a product's validation
 */
function identifyGaps(validation: ProductValidationStatus | null): string[] {
  if (!validation) {
    return ['Not yet added to validation pipeline'];
  }

  const gaps: string[] = [];

  if (!validation.has_promise) gaps.push('Missing product promise');
  if (!validation.has_distributor) gaps.push('Missing distributor hypothesis');
  if (!validation.has_end_user) gaps.push('Missing end-user definition');
  if (!validation.has_friction) gaps.push('Missing friction/pain point');
  if (!validation.has_methodology_commitment) gaps.push('No founder commitment to validate');
  if (validation.hard_gates_passed < validation.hard_gates_total) {
    gaps.push(`${validation.hard_gates_total - validation.hard_gates_passed} hard gates not passed`);
  }
  if ((validation.weighted_score_percent || 0) < 80) {
    gaps.push(`Weighted score ${validation.weighted_score_percent || 0}% (need ≥80%)`);
  }

  // Validation test gaps
  const testStatus = validation.validation_test_status;
  if (!testStatus || testStatus === 'not_run') {
    gaps.push('Validation tests not yet run (naive-tester / voice-auditor / gtm-auditor / QA)');
  } else if (testStatus === 'failed') {
    gaps.push('Validation tests failed — review findings');
  } else if (testStatus === 'warning') {
    gaps.push('Validation tests passed with warnings');
  }

  return gaps;
}

function scoreTestPart(status: string | undefined | null): number {
  if (status === 'passed') return 5;
  if (status === 'warning') return 4;
  return 0;
}

/**
 * Calculate readiness score (0-100) for outreach.
 * Breakdown:
 * - Hard gates: 30 points
 * - Weighted score: 30 points
 * - Validation fields: 20 points (5 each)
 * - Validation tests: 20 points (5 each for Parts A-D)
 * - Methodology commitment: bonus 10 points (capped at 100)
 */
function calculateReadinessScore(validation: ProductValidationStatus | null, gaps: string[]): number {
  if (!validation) return 0;

  let score = 0;

  // Hard gates: 30 points
  score += (validation.hard_gates_passed / validation.hard_gates_total) * 30;

  // Weighted score: 30 points
  score += ((validation.weighted_score_percent || 0) / 100) * 30;

  // Validation fields: 20 points (5 each)
  const fieldsPresent =
    (validation.has_promise ? 5 : 0) +
    (validation.has_distributor ? 5 : 0) +
    (validation.has_end_user ? 5 : 0) +
    (validation.has_friction ? 5 : 0);
  score += fieldsPresent;

  // Validation tests: 20 points (5 each for Parts A-D)
  score += scoreTestPart(validation.test_part_a_admin_portal);
  score += scoreTestPart(validation.test_part_b_user_portal);
  score += scoreTestPart(validation.test_part_c_auth_flows);
  score += scoreTestPart(validation.test_part_d_scaffold_verify);

  // Methodology commitment: bonus 10 points (capped at 100)
  if (validation.has_methodology_commitment) score = Math.min(100, score + 10);

  return Math.round(score);
}

/**
 * Generate action items (what needs to happen next)
 */
function generateActionItems(validation: ProductValidationStatus | null, gaps: string[]): string[] {
  if (!validation) {
    return ['Initialize product in validation pipeline'];
  }

  const actions: string[] = [];

  // Priority 1: Fill critical gaps
  if (!validation.has_promise) {
    actions.push('Define product promise (1-2 sentences)');
  }
  if (!validation.has_distributor) {
    actions.push('Identify distributor / distribution model');
  }
  if (!validation.has_end_user) {
    actions.push('Define end-user persona');
  }
  if (!validation.has_friction) {
    actions.push('Articulate friction / pain point addressed');
  }

  // Priority 2: Get commitment
  if (!validation.has_methodology_commitment) {
    actions.push('Get founder to commit to 4-week validation pipeline');
  }

  // Priority 3: Pass gates
  if (validation.hard_gates_passed < validation.hard_gates_total) {
    const remaining = validation.hard_gates_total - validation.hard_gates_passed;
    actions.push(`Pass ${remaining} remaining hard gate${remaining === 1 ? '' : 's'}`);
  }

  // Priority 4: Run validation tests
  const testStatus = validation.validation_test_status;
  if (!testStatus || testStatus === 'not_run') {
    actions.push('Run validation tests (naive-tester, voice-auditor, gtm-auditor, QA)');
  } else if (testStatus === 'failed') {
    actions.push('Address validation test failures and re-run');
  } else if (testStatus === 'warning') {
    actions.push('Address validation test warnings');
  }

  // Priority 5: Improve score
  if ((validation.weighted_score_percent || 0) < 80) {
    actions.push('Improve validation score to ≥80%');
  }

  // Priority 5: Run outreach
  if (validation.gate1_ready && !validation.outreach_blocker) {
    actions.push('✅ Ready to run outreach');
  }

  return actions;
}

/**
 * Scan entire portfolio: Read manifest + enrich with DB state
 */
export async function scanPortfolio(): Promise<EnrichedProduct[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for server-side scanning
  );

  const manifest = readManifest();
  const validationStatuses = await fetchValidationStatuses(supabase);

  const enriched: EnrichedProduct[] = manifest.projects.map((product) => {
    const validation = validationStatuses.get(product.name) || null;
    const gaps = identifyGaps(validation);
    const readiness_score = calculateReadinessScore(validation, gaps);
    const can_run_outreach_now = readiness_score >= 80 && gaps.length === 0;
    const action_items = generateActionItems(validation, gaps);

    // NEW: 7-Stage Lifecycle fields
    const { stage, name } = determineStage(validation, readiness_score);
    const certificate_of_occupancy = getCertificateStatus(validation);
    const smart_sensors = getSmartSensorsStatus(validation);

    return {
      manifest: product,
      validation,
      gaps,
      readiness_score,
      can_run_outreach_now,
      action_items,
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
