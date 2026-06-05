-- Reconcile the deal-findrs slug split (the data half of the one-door slug fix).
--
-- The product's canonical slug everywhere that matters for the coach/gate/card is 'deal-findrs'
-- (product_validation_status + portfolio_manifest). But the promise bars were seeded under the
-- hyphen-less 'dealfindrs' (20260526000000_readiness_criteria) — an orphan. So when deal-findrs is
-- admitted, its card (/admin/methodology/deal-findrs) reads promise_attributes WHERE
-- product_slug='deal-findrs' and finds NOTHING — the "I want that" bars (THIN_MVP_RUBRIC §7,
-- readiness check #9) silently go missing.
--
-- Move the bars onto the canonical slug. Conflict-safe (only if no deal-findrs bars exist yet) and
-- idempotent (after one run there are no 'dealfindrs' rows, so a re-run is a no-op). The create
-- route's normalise() guard prevents NEW splits; this fixes the existing one.
--
-- methodology_hypothesis_cards needs no rename — that table is empty in this instance, so
-- admit_product() creates deal-findrs's card fresh under the canonical slug.

UPDATE promise_attributes
   SET product_slug = 'deal-findrs'
 WHERE product_slug = 'dealfindrs'
   AND NOT EXISTS (
     SELECT 1 FROM promise_attributes p WHERE p.product_slug = 'deal-findrs'
   );
