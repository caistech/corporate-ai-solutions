/**
 * #42 AGENT-DISCOVERABLE producer (Layer-1, `public-web`).
 *
 * Probes a product's LIVE public surface for the three Layer-1 agent-readiness markers
 * (PRODUCT_STANDARDS §11 / THIN_MVP_RUBRIC #42) — the cheap, experience-adjacent signals that
 * AI search + browser/Information agents use to FIND and DESCRIBE a product:
 *   1. /llms.txt              — what the product is + key URLs in agent-legible form
 *   2. JSON-LD (schema.org)   — <script type="application/ld+json"> on the landing page
 *   3. /.well-known/ manifest — an agent manifest resolves (agent.json | ai-plugin.json)
 *
 * Honest scope (mirrors auto-probes.ts): a plain server-side HTTP fetch can TRULY decide all three,
 * so this is a legitimate `source: 'auto'` producer. Degrade-don't-fake — an unreachable surface
 * records nothing rather than a fabricated verdict.
 *
 * Two responsibilities, kept separate:
 *   - probeAgentReadiness(url)            — pure HTTP marker detection (no DB).
 *   - runAgentReadinessProducer(...)      — the producer: probe → (on detection) addFeatures
 *     ['public-web'] so #42 becomes applicable → write the #42 verdict via the readiness seam,
 *     but ONLY when the check is applicable (the card is/becomes public-web). A product with no
 *     markers that isn't a public-web product is left alone — #42 simply doesn't apply to it.
 *
 * PRECEDENCE (contract item 4): #42's only producers today are this HTTP probe and a future
 * browser-driven /agent-ready live pass — both write `source: 'auto'`, so the readiness seam's
 * latest-wins is correct now. When a true live (browser) pass is built it should write with a
 * higher-precedence source and the seam gains precedence-awareness then — we don't fake it here.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { upsertReadinessResult } from './readiness-results'
import { addFeatures } from './enroll-card'

/** The feature tag #42 applies_when present (the canonical token in features.ts). */
export const AGENT_READY_FEATURE = 'public-web'
/** The readiness_results check_code for the agent-discoverable check. */
export const AGENT_READY_CHECK_CODE = '42'

/** Candidate /.well-known/ agent-manifest paths, in preference order. */
const WELL_KNOWN_PATHS = ['/.well-known/agent.json', '/.well-known/ai-plugin.json']

export interface AgentReadinessMarkers {
  llmsTxt: boolean
  jsonLd: boolean
  wellKnown: boolean
  /** Which /.well-known/ path resolved, if any (for evidence). */
  wellKnownPath: string | null
}

export interface AgentReadinessProbe {
  /** All three markers present → pass; any missing → fail (it's a WEIGHTED check, not HARD). */
  status: 'pass' | 'fail'
  /** Any marker present → this IS a product reaching for agent-discoverability. Drives addFeatures. */
  detected: boolean
  markers: AgentReadinessMarkers
  /** Human-legible per-marker summary, e.g. "llms.txt ✓ · json-ld ✗ · well-known ✓ (agent.json)". */
  evidence: string
  /** True only when the live surface could not be reached at all (degrade-don't-fake). */
  unreachable: boolean
}

/** Normalize to an origin with scheme, no trailing slash. */
function toBase(url: string): string {
  const withScheme = /^https?:\/\//i.test(url) ? url : `https://${url}`
  return withScheme.replace(/\/+$/, '')
}

/** Fetch text with a hard timeout; returns null on any failure (network, timeout, non-OK). */
async function fetchText(
  target: string,
  timeoutMs = 8000,
): Promise<{ ok: boolean; body: string; contentType: string } | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(target, {
      redirect: 'follow',
      headers: { 'user-agent': 'cais-agent-ready-probe' },
      signal: controller.signal,
    })
    const body = await res.text()
    return { ok: res.ok, body, contentType: res.headers.get('content-type') ?? '' }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** True when a response looks like an SPA/HTML fallback rather than the real artifact. */
function looksLikeHtmlFallback(contentType: string, body: string): boolean {
  if (/text\/html/i.test(contentType)) return true
  return /^\s*<(?:!doctype|html)/i.test(body)
}

/**
 * Pure HTTP detection of the three Layer-1 markers. No DB. Reachability matters: if the landing
 * page itself can't be fetched we treat the surface as unreachable and record nothing upstream.
 */
export async function probeAgentReadiness(url: string): Promise<AgentReadinessProbe> {
  const base = toBase(url)

  const [landing, llms, ...wellKnownResults] = await Promise.all([
    fetchText(`${base}/`),
    fetchText(`${base}/llms.txt`),
    ...WELL_KNOWN_PATHS.map((p) => fetchText(`${base}${p}`)),
  ])

  // Unreachable = the landing page itself failed. The product surface isn't live → degrade-don't-fake.
  const unreachable = landing === null
  if (unreachable) {
    return {
      status: 'fail',
      detected: false,
      markers: { llmsTxt: false, jsonLd: false, wellKnown: false, wellKnownPath: null },
      evidence: `live surface unreachable at ${base}`,
      unreachable: true,
    }
  }

  // 1. /llms.txt — OK, non-empty, and NOT an HTML fallback (SPAs 200 the index for unknown paths).
  const llmsTxt =
    !!llms &&
    llms.ok &&
    llms.body.trim().length > 0 &&
    !looksLikeHtmlFallback(llms.contentType, llms.body)

  // 2. JSON-LD — a schema.org block in the landing HTML (attribute order tolerant).
  const jsonLd = /<script[^>]+type=["']application\/ld\+json["']/i.test(landing.body)

  // 3. /.well-known/ — first candidate that resolves as real JSON (not an HTML fallback).
  let wellKnown = false
  let wellKnownPath: string | null = null
  for (let i = 0; i < WELL_KNOWN_PATHS.length; i++) {
    const r = wellKnownResults[i]
    if (r && r.ok && r.body.trim().length > 0 && !looksLikeHtmlFallback(r.contentType, r.body)) {
      wellKnown = true
      wellKnownPath = WELL_KNOWN_PATHS[i]
      break
    }
  }

  const markers: AgentReadinessMarkers = { llmsTxt, jsonLd, wellKnown, wellKnownPath }
  const detected = llmsTxt || jsonLd || wellKnown
  const status: 'pass' | 'fail' = llmsTxt && jsonLd && wellKnown ? 'pass' : 'fail'

  const evidence = [
    `llms.txt ${llmsTxt ? '✓' : '✗'}`,
    `json-ld ${jsonLd ? '✓' : '✗'}`,
    `well-known ${wellKnown ? `✓ (${wellKnownPath})` : '✗'}`,
  ].join(' · ')

  return { status, detected, markers, evidence, unreachable: false }
}

export interface AgentReadinessProducerResult {
  /** Was #42 applicable (card is/became public-web)? When false, no verdict was written. */
  applicable: boolean
  /** Did we just promote the card to public-web off detected markers? */
  promoted: boolean
  /** The verdict written (null when not applicable or unreachable). */
  status: 'pass' | 'fail' | null
  evidence: string
  markers: AgentReadinessMarkers
  unreachable: boolean
}

/** Does the card already carry the public-web feature? */
async function cardIsPublicWeb(supabase: SupabaseClient, slug: string): Promise<boolean> {
  const { data } = await supabase
    .from('methodology_hypothesis_cards')
    .select('features')
    .eq('product_slug', slug)
    .maybeSingle()
  const features = Array.isArray(data?.features) ? data!.features : []
  return features.includes(AGENT_READY_FEATURE)
}

/**
 * The #42 producer. Orchestrates: probe → (on marker detection) addFeatures ['public-web'] →
 * write the #42 verdict via upsertReadinessResult — but only when the check is applicable.
 *
 * Applicability mirrors the scorer (applies_when 'public-web' ∈ card.features):
 *   - markers detected            → addFeatures ['public-web'] → applicable → write verdict.
 *   - no markers, card IS public-web → applicable → write the (fail) verdict (claims it, lacks it).
 *   - no markers, not public-web   → NOT applicable → write nothing (#42 doesn't apply).
 *   - unreachable                  → write nothing (degrade-don't-fake).
 */
export async function runAgentReadinessProducer(
  supabase: SupabaseClient,
  slug: string,
  url: string,
  deploymentId: string | null,
): Promise<AgentReadinessProducerResult> {
  const probe = await probeAgentReadiness(url)

  if (probe.unreachable) {
    return {
      applicable: false,
      promoted: false,
      status: null,
      evidence: probe.evidence,
      markers: probe.markers,
      unreachable: true,
    }
  }

  let promoted = false
  let applicable: boolean

  if (probe.detected) {
    // The product ships at least one agent-readiness marker → it IS a public-web product.
    // Promote the card so #42 is scored (and stays scored on future runs). Idempotent union.
    const before = await cardIsPublicWeb(supabase, slug)
    try {
      await addFeatures(supabase, slug, [AGENT_READY_FEATURE])
      promoted = !before
    } catch (err) {
      // No card to promote (product not enrolled) — record nothing rather than throw the run.
      console.warn(
        '[agent-ready] addFeatures skipped (card missing?):',
        slug,
        err instanceof Error ? err.message : err,
      )
    }
    applicable = true
  } else {
    applicable = await cardIsPublicWeb(supabase, slug)
  }

  if (!applicable) {
    // Not a public-web product and no markers found — #42 genuinely doesn't apply. Don't pollute
    // readiness_results with a fail for an N/A check.
    return {
      applicable: false,
      promoted: false,
      status: null,
      evidence: probe.evidence,
      markers: probe.markers,
      unreachable: false,
    }
  }

  await upsertReadinessResult({
    productSlug: slug,
    checkCode: AGENT_READY_CHECK_CODE,
    status: probe.status,
    source: 'auto',
    evidence: probe.evidence,
    deploymentId,
  })

  return {
    applicable: true,
    promoted,
    status: probe.status,
    evidence: probe.evidence,
    markers: probe.markers,
    unreachable: false,
  }
}
