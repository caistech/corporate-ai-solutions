-- Add icp_geography field to product_validation_status for pipeline validation flow

ALTER TABLE product_validation_status 
ADD COLUMN IF NOT EXISTS icp_geography TEXT;

COMMENT ON COLUMN product_validation_status.icp_geography IS 'Target geography for outreach (e.g. "Australia", "US", "UK", "Global", "APAC")';
