// The ONE cockpit portfolio-membership source: the portfolio_manifest table.
//
// Replaces readManifest()'s YAML file-read AND the hardcoded fallback list. The
// committed portfolio-manifest.yaml is intentionally NOT read here — it remains the
// portfolio ENV-SYNC manifest for external tooling (@caistech/portfolio-env-sync,
// onboard-new-project.sh) only. Cockpit membership is this table; nothing else.
//
// No silent fallback: a read error throws rather than degrading to a stale list —
// the dual-source trap this migration exists to kill.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { ManifestProduct } from './portfolio-scanner'

export async function loadPortfolioManifest(client: SupabaseClient): Promise<ManifestProduct[]> {
  const { data, error } = await client
    .from('portfolio_manifest')
    .select('slug, vercel_project_id, supabase_project_ref, category')
    .order('slug', { ascending: true })

  if (error) {
    throw new Error(`loadPortfolioManifest: ${error.message}`)
  }

  return (data ?? []).map((r) => ({
    name: r.slug as string,
    vercel_project_id: (r.vercel_project_id as string | null) ?? '',
    supabase_project_ref: (r.supabase_project_ref as string | null) ?? undefined,
    category: (r.category as ManifestProduct['category']) ?? undefined,
  }))
}

export interface PortfolioManifestUpsert {
  slug: string
  vercel_project_id?: string | null
  supabase_project_ref?: string | null
  category?: 'infrastructure' | 'own-tools' | 'product' | 'client-product' | null
  display_name?: string | null
}

/**
 * Add/refresh a product's portfolio membership at runtime (the symmetric write to
 * the methodology card). Idempotent on slug — re-running review for the same slug
 * updates rather than duplicating, and only overwrites the fields provided.
 */
export async function upsertPortfolioManifest(
  client: SupabaseClient,
  entry: PortfolioManifestUpsert,
): Promise<void> {
  const row: Record<string, unknown> = { slug: entry.slug }
  if (entry.vercel_project_id !== undefined) row.vercel_project_id = entry.vercel_project_id
  if (entry.supabase_project_ref !== undefined) row.supabase_project_ref = entry.supabase_project_ref
  if (entry.category !== undefined) row.category = entry.category
  if (entry.display_name !== undefined) row.display_name = entry.display_name

  const { error } = await client
    .from('portfolio_manifest')
    .upsert(row, { onConflict: 'slug' })

  if (error) {
    throw new Error(`upsertPortfolioManifest("${entry.slug}"): ${error.message}`)
  }
}
