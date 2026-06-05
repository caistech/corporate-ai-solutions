-- admit_product(...) — the ATOMIC membership grant at the gate (Rider 4, invariant #1).
--
-- On a gate-PASS the route must do three writes: flip is_draft=false (admission), create the
-- methodology card (Z), and create the portfolio_manifest row (Y). Done as three separate JS
-- writes they can TEAR on a crash (admitted + card but no manifest → "admitted but invisible").
-- The Supabase JS client can't wrap multi-table writes in one transaction, so this RPC is the
-- atomic path: all three commit, or none do.
--
-- This is the SINGLE source of truth for the ADMIT-TIME membership writes (the route calls only
-- this; it does NOT also call the TS upsert helpers for admit). The TS helpers
-- (upsertMethodologyCard / upsertPortfolioManifest) remain for their OTHER, single-table callers
-- (e.g. cards/route.ts) — they are not an admit path, so there is no drifting duplicate of the
-- admit write. The card/manifest shapes here mirror those helpers' minimal create rows.
--
-- The RPC wraps the 3 DB writes ONLY — it cannot fetch the live build (Postgres can't fetch URLs).
-- The route does the deployment-pinned re-derive and computes the PASS verdict BEFORE calling this;
-- the RPC just takes the resolved refs as args. Idempotent: re-running for an already-admitted
-- slug is a no-op on the card/manifest (ON CONFLICT) and a harmless re-flip.

CREATE OR REPLACE FUNCTION admit_product(
  p_slug           TEXT,
  p_vercel_project TEXT DEFAULT NULL,
  p_supabase_ref   TEXT DEFAULT NULL,
  p_category       TEXT DEFAULT 'product',
  p_display_name   TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Admission: flip INCOMPLETE-SPEC -> in-pipeline.
  UPDATE product_validation_status
     SET is_draft = false,
         last_validation_update = NOW()
   WHERE product_slug = p_slug;

  -- 2. Z — methodology card. Minimal create row (every other column defaults); operator-origin,
  --    not inboxed — parity with the proven cockpit-intake create path. Idempotent.
  INSERT INTO methodology_hypothesis_cards (product_slug, intake_source, inbox)
  VALUES (p_slug, 'operator', false)
  ON CONFLICT (product_slug) DO NOTHING;

  -- 3. Y — portfolio membership. Only the provided refs are set; idempotent re-stamp.
  INSERT INTO portfolio_manifest (slug, vercel_project_id, supabase_project_ref, category, display_name)
  VALUES (
    p_slug,
    NULLIF(p_vercel_project, ''),
    NULLIF(p_supabase_ref, ''),
    COALESCE(NULLIF(p_category, ''), 'product'),
    NULLIF(p_display_name, '')
  )
  ON CONFLICT (slug) DO UPDATE
    SET vercel_project_id    = COALESCE(EXCLUDED.vercel_project_id, portfolio_manifest.vercel_project_id),
        supabase_project_ref = COALESCE(EXCLUDED.supabase_project_ref, portfolio_manifest.supabase_project_ref),
        display_name         = COALESCE(EXCLUDED.display_name, portfolio_manifest.display_name);
END;
$$;
