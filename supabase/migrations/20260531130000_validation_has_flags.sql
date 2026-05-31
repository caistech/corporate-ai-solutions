ALTER TABLE product_validation_status
  ADD COLUMN IF NOT EXISTS core_mechanism TEXT,
  ADD COLUMN IF NOT EXISTS has_core_mechanism BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS distributor_outcomes TEXT,
  ADD COLUMN IF NOT EXISTS has_distributor_outcomes BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS end_user_outcomes TEXT,
  ADD COLUMN IF NOT EXISTS has_end_user_outcomes BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_icp_geography BOOLEAN DEFAULT false;