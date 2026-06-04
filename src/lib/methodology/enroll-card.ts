// src/lib/methodology/enroll-card.ts
//
// #4 — Auto-enroll a product in the CANONICAL scoring model at onboarding admission.
//
// Without a methodology_hypothesis_cards row, score.ts / loadCardScore returns 404
// and the HARD gate can never compute (score/band null) — the deal-findrs failure mode.
// Calling enrollMethodologyCard() at admission closes that class of bug for every
// future product, not just the one instance.
//
// Idempotent — safe to call on every admission / re-admission:
//   - no card                       -> insert with the given features        ("created")
//   - card exists, features empty   -> backfill features (repairs legacy)     ("backfilled")
//   - card exists, features present -> no-op (does NOT clobber detected ones) ("exists")
//
// Feature expansion (e.g. adding "voice" once a widget is gripped during survey)
// goes through addFeatures(), which unions tokens onto an existing card.

import type { SupabaseClient } from "@supabase/supabase-js";

/** Tokens score.ts matches via applies_when -> features.includes(token). */
export const KNOWN_FEATURES = [
  "auth",
  "supabase",
  "email",
  "voice",
  "third-party-content",
] as const;

export type EnrollResult =
  | { status: "created"; cardId: string; features: string[] }
  | { status: "backfilled"; cardId: string; features: string[] }
  | { status: "exists"; cardId: string; features: string[] };

/** Dedupe + drop empties, preserving order. */
function normalizeFeatures(features: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const f of features ?? []) {
    const t = (f ?? "").trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

export async function enrollMethodologyCard(
  supabase: SupabaseClient,
  productSlug: string,
  features: string[],
): Promise<EnrollResult> {
  const slug = (productSlug ?? "").trim();
  if (!slug) throw new Error("enrollMethodologyCard: productSlug is required");

  const desired = normalizeFeatures(features);

  // 1. Look for an existing card.
  const { data: existing, error: selErr } = await supabase
    .from("methodology_hypothesis_cards")
    .select("id, features")
    .eq("product_slug", slug)
    .maybeSingle();

  if (selErr) {
    throw new Error(
      `enrollMethodologyCard: select failed for "${slug}": ${selErr.message}`,
    );
  }

  // 2a. Card exists — backfill features only if currently empty (never clobber).
  if (existing) {
    const current = Array.isArray(existing.features) ? existing.features : [];
    if (current.length === 0 && desired.length > 0) {
      const { error: upErr } = await supabase
        .from("methodology_hypothesis_cards")
        .update({ features: desired })
        .eq("id", existing.id);
      if (upErr) {
        throw new Error(
          `enrollMethodologyCard: backfill failed for "${slug}": ${upErr.message}`,
        );
      }
      return { status: "backfilled", cardId: existing.id, features: desired };
    }
    return { status: "exists", cardId: existing.id, features: current };
  }

  // 2b. No card — create one.
  const { data: created, error: insErr } = await supabase
    .from("methodology_hypothesis_cards")
    .insert({ product_slug: slug, features: desired })
    .select("id, features")
    .single();

  if (insErr) {
    // Tolerate a race: another admission created the card between select and insert.
    // (Requires a UNIQUE constraint on product_slug to raise 23505 — see note below.)
    if (insErr.code === "23505") {
      const { data: raced } = await supabase
        .from("methodology_hypothesis_cards")
        .select("id, features")
        .eq("product_slug", slug)
        .single();
      if (raced) {
        return {
          status: "exists",
          cardId: raced.id,
          features: Array.isArray(raced.features) ? raced.features : [],
        };
      }
    }
    throw new Error(
      `enrollMethodologyCard: insert failed for "${slug}": ${insErr.message}`,
    );
  }

  return {
    status: "created",
    cardId: created.id,
    features: Array.isArray(created.features) ? created.features : desired,
  };
}

/**
 * Union new tokens onto an existing card's features. Use during survey/validation
 * when EVIDENCE appears (e.g. a voice widget is found by grep). Idempotent.
 * This is the only path that may add features after admission — keeps the
 * "evidence, not inference" rule: admission sets a minimal honest baseline,
 * detection expands it.
 */
export async function addFeatures(
  supabase: SupabaseClient,
  productSlug: string,
  tokens: string[],
): Promise<string[]> {
  const slug = (productSlug ?? "").trim();
  const add = normalizeFeatures(tokens);
  if (add.length === 0) return [];

  const { data: card, error } = await supabase
    .from("methodology_hypothesis_cards")
    .select("id, features")
    .eq("product_slug", slug)
    .single();
  if (error) {
    throw new Error(`addFeatures: card not found for "${slug}": ${error.message}`);
  }

  const current = Array.isArray(card.features) ? card.features : [];
  const merged = normalizeFeatures([...current, ...add]);
  if (merged.length === current.length) return current; // nothing new

  const { error: upErr } = await supabase
    .from("methodology_hypothesis_cards")
    .update({ features: merged })
    .eq("id", card.id);
  if (upErr) {
    throw new Error(`addFeatures: update failed for "${slug}": ${upErr.message}`);
  }
  return merged;
}
