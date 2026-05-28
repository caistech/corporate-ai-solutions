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
}

export interface EnrichedProduct {
  manifest: ManifestProduct;
  validation: ProductValidationStatus | null;
  gaps: string[];  // List of missing validation fields
  readiness_score: number;  // 0-100: how ready for outreach?
  can_run_outreach_now: boolean;  // GREEN: ready to start outreach
  action_items: string[];  // What needs to happen next?
}

/**
 * Read portfolio-manifest.yaml from the shared services repo
 */
function readManifest(): { projects: ManifestProduct[] } {
  const manifestPath = path.resolve(
    __dirname,
    '../../../cais-shared-services/portfolio-manifest.yaml'
  );

  const yaml = YAML.parse(fs.readFileSync(manifestPath, 'utf-8'));
  return yaml;
}

/**
 * Fetch validation status for all products from Supabase
 */
async function fetchValidationStatuses(
  client: any
): Promise<Map<string, ProductValidationStatus>> {
  const { data, error } = await client
    .from('product_validation_status')
    .select('*');

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

  return gaps;
}

/**
 * Calculate readiness score (0-100) for outreach
 */
function calculateReadinessScore(validation: ProductValidationStatus | null, gaps: string[]): number {
  if (!validation) return 0;

  let score = 0;

  // Hard gates: 40 points
  score += (validation.hard_gates_passed / validation.hard_gates_total) * 40;

  // Weighted score: 40 points
  score += ((validation.weighted_score_percent || 0) / 100) * 40;

  // Validation fields: 20 points (5 each)
  const fieldsPresent =
    (validation.has_promise ? 5 : 0) +
    (validation.has_distributor ? 5 : 0) +
    (validation.has_end_user ? 5 : 0) +
    (validation.has_friction ? 5 : 0);
  score += fieldsPresent;

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

  // Priority 4: Improve score
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

    return {
      manifest: product,
      validation,
      gaps,
      readiness_score,
      can_run_outreach_now,
      action_items,
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
