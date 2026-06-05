-- Product intake entry-mode + the identifier columns the review path / relay need.
--
-- entry_mode — HOW a product entered the pipeline (distinct from pipeline_stage,
-- which is WHERE it sits, and build_status, which is HOW BUILT):
--   new       — ideation front door, no pre-existing assets. Today's default;
--               walks the coach/spec/gate-question chain. Auto-stamped when no
--               identifiers are present. Identifiers stay NULL now — they get
--               ISSUED at graduation (future work), so they are not required here.
--   review    — an already-built product entering to be scored against its live
--               assets. All five identifiers required + validated at capture
--               (live_url 2xx/3xx, repo exists, ecc_project_id a UUID, supabase_ref
--               + vercel_project format-checked). Lands in-pipeline (is_draft=false)
--               so the [productId] card computes; the card reads live_url (P1) and
--               ecc_project_id (relay) from these columns instead of discovering them.
--   repurpose — RESERVED enum slot. Behavior deferred — captures identifiers but
--               does NOT validate, route, or act.
--               TODO: repurpose lifecycle (pivot identity: keep-vs-fork) — deferred.
--
-- THE FIVE IDENTIFIERS:
--   live_url       — REUSES the existing product_validation_status.mvp_url column
--                    (the Gate-1 outreach link); no duplicate column is added.
--   github_repo    — "owner/name" (e.g. dennissolver/deal-findrs).
--   vercel_project — Vercel project name or prj_ id.
--   supabase_ref   — Supabase project ref (20-char).
--   ecc_project_id — easy-claude-code project id; the JOIN KEY the cockpit<->ECC run
--                    relay maps on (B2). First-class so runs are addressed by id,
--                    never by string-matching repo names.
--
-- entry_mode is stamped at intake ONLY (graduation re-stamp = future work).
-- Additive + idempotent.

ALTER TABLE product_validation_status
  ADD COLUMN IF NOT EXISTS entry_mode TEXT
    CHECK (entry_mode IS NULL OR entry_mode IN ('new', 'review', 'repurpose'));

ALTER TABLE product_validation_status
  ADD COLUMN IF NOT EXISTS github_repo TEXT;

ALTER TABLE product_validation_status
  ADD COLUMN IF NOT EXISTS vercel_project TEXT;

ALTER TABLE product_validation_status
  ADD COLUMN IF NOT EXISTS supabase_ref TEXT;

ALTER TABLE product_validation_status
  ADD COLUMN IF NOT EXISTS ecc_project_id TEXT;

COMMENT ON COLUMN product_validation_status.entry_mode IS
  'How the product entered the pipeline: new (ideation) | review (existing build) | repurpose (reserved, deferred). Stamped at intake only.';
COMMENT ON COLUMN product_validation_status.github_repo IS
  'Existing-build identifier: GitHub repo as owner/name. Captured on review; NULL until issued for new.';
COMMENT ON COLUMN product_validation_status.vercel_project IS
  'Existing-build identifier: Vercel project name or prj_ id. Captured on review.';
COMMENT ON COLUMN product_validation_status.supabase_ref IS
  'Existing-build identifier: Supabase project ref. Captured on review.';
COMMENT ON COLUMN product_validation_status.ecc_project_id IS
  'easy-claude-code project id — the join key for the cockpit<->ECC run relay (review path).';
