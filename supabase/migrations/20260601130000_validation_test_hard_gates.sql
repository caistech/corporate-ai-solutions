-- Hybrid validation-test persistence.
--
-- The readiness score (ProductDetailView.calculateLocalReadinessScore) reads
-- validation.hard_gates_passed / hard_gates_total for its compliance slice, but
-- those columns existed in NO migration — so that slice was always 0. The card's
-- nine compliance/validation checks also never persisted (React state only).
--
-- This adds the two columns the score needs. The rewritten /validation-test route
-- writes them (from the 5 compliance checks) alongside the existing
-- validation_test_results jsonb (the full 9-check breakdown, keyed by check id —
-- which /validation-workflow already reads as .qa/.naive/.gtm) and
-- validation_test_status (the composite the outreach gate + validationScore use).

ALTER TABLE product_validation_status ADD COLUMN IF NOT EXISTS hard_gates_passed INTEGER DEFAULT 0;
ALTER TABLE product_validation_status ADD COLUMN IF NOT EXISTS hard_gates_total INTEGER DEFAULT 0;
