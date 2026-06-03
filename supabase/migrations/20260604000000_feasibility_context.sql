-- Add feasibility context column for onboarding
-- Stores: proof_of_demand, demand_tier, why_now, status_quo, product_type
-- This is the Layer A output - separate from the 14-field graded spec

ALTER TABLE product_validation_status
  ADD COLUMN IF NOT EXISTS feasibility JSONB DEFAULT NULL;

COMMENT ON COLUMN product_validation_status.feasibility IS 'Feasibility context from onboarding (Layer A): proof_of_demand, demand_tier, why_now, status_quo, product_type. Seen by design-build only, never survey/certify/score.';
