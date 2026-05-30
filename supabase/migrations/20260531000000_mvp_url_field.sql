-- Add mvp_url field to product_validation_status for pipeline validation flow
-- If URL exists → run tests. If no URL → design/build first.

ALTER TABLE product_validation_status 
ADD COLUMN IF NOT EXISTS mvp_url TEXT;

COMMENT ON COLUMN product_validation_status.mvp_url IS 'The deployed product URL (e.g., https://singify.vercel.app). If empty, product needs design/build before tests.';
