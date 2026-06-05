-- One-shot backfill: membership-follows-gate means every ALREADY-admitted product must have a
-- methodology card (Z) + a portfolio_manifest row (Y) (finding #4).
--
-- Products admitted under the OLD admit path wrote NEITHER (the old admit only flipped is_draft;
-- the create review branch wrote Z/Y, but plain 'new' admissions never did). Once the new gate
-- owns membership, those rows would render broken — a card with no manifest, or neither. This
-- reconciles the existing portfolio to the new rule. Idempotent (NOT EXISTS + ON CONFLICT), so it
-- is safe to re-run and a no-op for products already carrying membership (e.g. the ~34 seeded in
-- 20260605120000).
--
-- DRY-RUN BEFORE APPLY (run these SELECTs first to see exactly what will be created):
--   SELECT pvs.product_slug FROM product_validation_status pvs
--    WHERE pvs.is_draft = false
--      AND NOT EXISTS (SELECT 1 FROM methodology_hypothesis_cards c WHERE c.product_slug = pvs.product_slug);
--   SELECT pvs.product_slug FROM product_validation_status pvs
--    WHERE pvs.is_draft = false
--      AND NOT EXISTS (SELECT 1 FROM portfolio_manifest m WHERE m.slug = pvs.product_slug);

-- Z — card for any admitted product missing one (minimal valid row; defaults fill the rest).
INSERT INTO methodology_hypothesis_cards (product_slug, intake_source, inbox)
SELECT pvs.product_slug, 'operator', false
  FROM product_validation_status pvs
 WHERE pvs.is_draft = false
   AND NOT EXISTS (
     SELECT 1 FROM methodology_hypothesis_cards c WHERE c.product_slug = pvs.product_slug
   )
ON CONFLICT (product_slug) DO NOTHING;

-- Y — manifest membership for any admitted product missing one, from its captured refs.
INSERT INTO portfolio_manifest (slug, vercel_project_id, supabase_project_ref, category, display_name)
SELECT pvs.product_slug,
       NULLIF(pvs.vercel_project, ''),
       NULLIF(pvs.supabase_ref, ''),
       'product',
       NULLIF(pvs.display_name, '')
  FROM product_validation_status pvs
 WHERE pvs.is_draft = false
   AND NOT EXISTS (
     SELECT 1 FROM portfolio_manifest m WHERE m.slug = pvs.product_slug
   )
ON CONFLICT (slug) DO NOTHING;
