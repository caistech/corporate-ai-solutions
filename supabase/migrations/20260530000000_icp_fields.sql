-- Add ICP fields for tight targeting in InvestorPilot
-- These enable accurate Brave/LinkedIn search queries

ALTER TABLE product_validation_status 
  ADD COLUMN IF NOT EXISTS icp_company_size TEXT,
  ADD COLUMN IF NOT EXISTS icp_stage TEXT,
  ADD COLUMN IF NOT EXISTS icp_buyer_title TEXT,
  ADD COLUMN IF NOT EXISTS icp_user_title TEXT,
  ADD COLUMN IF NOT EXISTS icp_stack_tools TEXT,
  ADD COLUMN IF NOT EXISTS traction_arr TEXT,
  ADD COLUMN IF NOT EXISTS traction_customers TEXT,
  ADD COLUMN IF NOT EXISTS icp_reasoning JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN product_validation_status.icp_company_size IS 'Target company employee count range (e.g. 50-200, 10-50)';
COMMENT ON COLUMN product_validation_status.icp_stage IS 'ICP business stage (e.g. seed, growth, scale, enterprise)';
COMMENT ON COLUMN product_validation_status.icp_buyer_title IS 'Primary buyer job titles (e.g. VP Sales, CTO, Operations Manager)';
COMMENT ON COLUMN product_validation_status.icp_user_title IS 'Primary user job titles (e.g. Sales Rep, Developer, Office Manager)';
COMMENT ON COLUMN product_validation_status.icp_stack_tools IS 'Tools/systems ICP uses (e.g. Salesforce, HubSpot, Slack)';
COMMENT ON COLUMN product_validation_status.traction_arr IS 'Annual revenue or pricing (e.g. $1M ARR, $500/mo)';
COMMENT ON COLUMN product_validation_status.traction_customers IS 'Current customer count or logos (e.g. 20 customers, including Company X, Y)';
COMMENT ON COLUMN product_validation_status.icp_reasoning IS 'LLM reasoning for ICP suggestions (e.g. why company_size=50-200)';
