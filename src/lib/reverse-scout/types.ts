/**
 * Reverse Scout — shared types for the asset → capability card → pattern pipeline (Stages 1–2).
 *
 * These mirror the reverse_scout_* tables (migration 20260718000000_reverse_scout.sql). Stages 3–4
 * (candidate discovery, disclosure scorer, outreach) are deliberately not represented yet.
 */

export type SourceType = 'repo' | 'paste' | 'doc'
export type Adjacency = 'core' | 'adjacent' | 'lateral'

export interface Asset {
  id: string
  created_at: string
  updated_at: string
  name: string
  source_type: SourceType
  raw_ref: string | null
  source_text: string
}

/** Stage 1 output — the factual capability, no market claims. */
export interface CapabilityCard {
  id: string
  created_at: string
  asset_id: string
  does_what: string
  primitive: string
  inputs: string[]
  outputs: string[]
  integration_surface: string | null
  maturity_level: string | null
  dependencies: string[]
  reasoning: string | null
}

/** The generated (pre-persist) shape Stage 1 returns from the LLM. */
export interface CapabilityCardDraft {
  does_what: string
  primitive: string
  inputs: string[]
  outputs: string[]
  integration_surface: string | null
  maturity_level: string | null
  dependencies: string[]
  reasoning: string
}

/** One re-projected sector for a pattern (Stage 2 move 2). */
export interface SectorMap {
  id: string
  created_at: string
  pattern_id: string
  sector: string
  adjacency: Adjacency
  rationale: string
  confidence: number
}

export interface SectorMapDraft {
  sector: string
  adjacency: Adjacency
  rationale: string
  confidence: number
}

/** Stage 2 output — the domain-stripped shape + its re-projection. */
export interface Pattern {
  id: string
  created_at: string
  asset_id: string
  abstract_problem_shape: string
  domain_stripped_desc: string
}

export interface PatternDraft {
  abstract_problem_shape: string
  domain_stripped_desc: string
  sectors: SectorMapDraft[]
}

/** Everything the detail view needs for one asset. */
export interface AssetDetail {
  asset: Asset
  card: CapabilityCard | null
  pattern: (Pattern & { sectors: SectorMap[] }) | null
}
