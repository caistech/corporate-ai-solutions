-- One-door enforcement (memory project_one_door_card_access, locked by Dennis 2026-06-05).
--
-- THE RULE: the only path to a product card page is onboarding/coach -> PASS the admit gate.
-- admit_product() is the only thing that admits a product (flips is_draft = false). Everything
-- else (seed, backfill, direct link) is no longer a way in.
--
-- WHY THIS MIGRATION: the existing portfolio never passed the coach. It was seeded straight into
-- cards (20260524000002_seed_chosen_products) and grandfathered into membership
-- (20260605140000_backfill_membership) WITHOUT the coach's 7-node walk. So products like
-- deal-findrs landed on the card page with seed/derive/manual fields the methodology never
-- pressure-tested. Per Dennis ("absolutely they should be [re-running] every single one of them"),
-- demote the WHOLE portfolio to Pending so every product re-enters through the one door.
--
-- "It's a pipeline, not a free-for-all." Pending products sit on the All-Ideas page; only a
-- coach/admit-gate PASS reopens a card. The route guards on /admin/pipeline/[slug] and
-- /admin/methodology/[slug] enforce it server-side (a Pending product is redirected to the coach).
--
-- REVERSIBLE: this only sets the Pending flag. Re-running the coach + passing the gate re-admits
-- (admit_product flips is_draft back to false). No card/manifest/spec data is destroyed.
-- IDEMPOTENT: the WHERE clause makes a re-run a no-op once everything is Pending.

UPDATE product_validation_status
   SET is_draft = true
 WHERE is_draft = false;
