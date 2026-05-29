-- Market Signal Tracking Columns
-- For tracking engagement signals from InvestorPilot
-- Created: 2026-05-29

ALTER TABLE product_validation_status 
  ADD COLUMN IF NOT EXISTS cta_clicks INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS form_submits INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meetings_booked INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS replies_received INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_signal_at TIMESTAMPTZ;

-- Index for querying by signals
CREATE INDEX IF NOT EXISTS idx_product_validation_status_signals 
  ON product_validation_status(product_slug, last_signal_at DESC);
