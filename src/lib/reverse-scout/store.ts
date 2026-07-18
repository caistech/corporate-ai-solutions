/**
 * Reverse Scout data access — service-role reads/writes over the reverse_scout_* tables.
 *
 * The tables are RLS-on with no policies, so every access goes through the service-role client.
 * Callers are already operator-gated (page under /admin/*; API routes self-guard).
 *
 * We use a dedicated client with `cache: 'no-store'` on its fetch — NOT the shared supabaseAdmin.
 * In RSC, Next caches supabase-js GETs in the Data Cache; the detail page first rendered before a
 * card existed, cached the empty result, and kept serving it (the "generation works but the card
 * never shows" bug). Forcing no-store makes every read live.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function rsDb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Reverse Scout store requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input as RequestInfo, { ...init, cache: 'no-store' }) },
  })
}
import type {
  Asset,
  AssetDetail,
  CapabilityCard,
  CapabilityCardDraft,
  Pattern,
  PatternDraft,
  SectorMap,
  SourceType,
} from './types'

export async function listAssets(): Promise<Asset[]> {
  const { data, error } = await rsDb()
    .from('reverse_scout_asset')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(`listAssets failed: ${error.message}`)
  return (data ?? []) as Asset[]
}

export async function createAsset(input: {
  name: string
  source_type: SourceType
  raw_ref: string | null
  source_text: string
}): Promise<Asset> {
  const { data, error } = await rsDb()
    .from('reverse_scout_asset')
    .insert({
      name: input.name,
      source_type: input.source_type,
      raw_ref: input.raw_ref,
      source_text: input.source_text,
    })
    .select('*')
    .single()
  if (error) throw new Error(`createAsset failed: ${error.message}`)
  return data as Asset
}

export async function getAsset(assetId: string): Promise<Asset | null> {
  const { data, error } = await rsDb()
    .from('reverse_scout_asset')
    .select('*')
    .eq('id', assetId)
    .maybeSingle()
  if (error) throw new Error(`getAsset failed: ${error.message}`)
  return (data as Asset) ?? null
}

/** Latest capability card for an asset (Stage 1 re-runs append; newest wins). */
async function getLatestCard(assetId: string): Promise<CapabilityCard | null> {
  const { data, error } = await rsDb()
    .from('reverse_scout_capability_card')
    .select('*')
    .eq('asset_id', assetId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(`getLatestCard failed: ${error.message}`)
  return (data as CapabilityCard) ?? null
}

export async function saveCapabilityCard(assetId: string, draft: CapabilityCardDraft): Promise<CapabilityCard> {
  const { data, error } = await rsDb()
    .from('reverse_scout_capability_card')
    .insert({
      asset_id: assetId,
      does_what: draft.does_what,
      primitive: draft.primitive,
      inputs: draft.inputs,
      outputs: draft.outputs,
      integration_surface: draft.integration_surface,
      maturity_level: draft.maturity_level,
      dependencies: draft.dependencies,
      reasoning: draft.reasoning,
    })
    .select('*')
    .single()
  if (error) throw new Error(`saveCapabilityCard failed: ${error.message}`)
  return data as CapabilityCard
}

async function getLatestPattern(assetId: string): Promise<(Pattern & { sectors: SectorMap[] }) | null> {
  const { data, error } = await rsDb()
    .from('reverse_scout_pattern')
    .select('*')
    .eq('asset_id', assetId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(`getLatestPattern failed: ${error.message}`)
  if (!data) return null

  const pattern = data as Pattern
  const { data: sectorData, error: sectorErr } = await rsDb()
    .from('reverse_scout_sector_map')
    .select('*')
    .eq('pattern_id', pattern.id)
    .order('confidence', { ascending: false })
  if (sectorErr) throw new Error(`getLatestPattern sectors failed: ${sectorErr.message}`)

  return { ...pattern, sectors: (sectorData ?? []) as SectorMap[] }
}

export async function savePattern(
  assetId: string,
  draft: PatternDraft,
): Promise<Pattern & { sectors: SectorMap[] }> {
  const { data: patternRow, error: patternErr } = await rsDb()
    .from('reverse_scout_pattern')
    .insert({
      asset_id: assetId,
      abstract_problem_shape: draft.abstract_problem_shape,
      domain_stripped_desc: draft.domain_stripped_desc,
    })
    .select('*')
    .single()
  if (patternErr) throw new Error(`savePattern failed: ${patternErr.message}`)

  const pattern = patternRow as Pattern
  const rows = draft.sectors.map((s) => ({
    pattern_id: pattern.id,
    sector: s.sector,
    adjacency: s.adjacency,
    rationale: s.rationale,
    confidence: s.confidence,
  }))

  const { data: sectorData, error: sectorErr } = await rsDb()
    .from('reverse_scout_sector_map')
    .insert(rows)
    .select('*')
  if (sectorErr) throw new Error(`savePattern sectors failed: ${sectorErr.message}`)

  return { ...pattern, sectors: (sectorData ?? []) as SectorMap[] }
}

export async function getAssetDetail(assetId: string): Promise<AssetDetail | null> {
  const asset = await getAsset(assetId)
  if (!asset) return null
  const [card, pattern] = await Promise.all([getLatestCard(assetId), getLatestPattern(assetId)])
  return { asset, card, pattern }
}
