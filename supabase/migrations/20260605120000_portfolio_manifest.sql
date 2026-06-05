-- portfolio_manifest — portfolio MEMBERSHIP as a runtime DB table.
--
-- Moves the cockpit's "is this slug a portfolio product?" gate off the committed
-- YAML file (and off the hardcoded fallback list in portfolio-scanner.ts) and onto
-- a table, so membership becomes a runtime WRITE — symmetric with the methodology
-- card (Z). A review submit can now add a product with no terminal, no commit, no
-- deploy lag.
--
-- SCOPE: this table holds ONLY what the cockpit readers use (ManifestProduct:
-- slug, vercel_project_id, supabase_project_ref, category — portfolio-scanner.ts:36).
-- It is NOT a replacement for portfolio-manifest.yaml, which remains the portfolio
-- ENV-SYNC manifest (team_id / secrets / shared / inherit_shared / envs /
-- product_registry) consumed by @caistech/portfolio-env-sync + onboard-new-project.sh
-- — external tools that read the FILE and cannot read this DB. The YAML stays; only
-- the cockpit's membership read + the hardcoded fallback retire.
--
-- SEED = UNION of (the live hardcoded fallback in portfolio-scanner.ts, ~33 — what
-- prod actually resolves today) ∪ (portfolio-manifest.yaml projects: — adds
-- f2k-projects and enriches supabase_project_ref). Reproduces the current portfolio
-- exactly; no product drops. Idempotent: ON CONFLICT (slug) DO NOTHING.
--
-- RLS: on, no anon/authenticated policies — admin-surface-only, accessed via the
-- service role (same posture as readiness_criteria / readiness_results).

CREATE TABLE IF NOT EXISTS portfolio_manifest (
  slug                 TEXT PRIMARY KEY,
  vercel_project_id    TEXT,
  supabase_project_ref TEXT,
  category             TEXT CHECK (
    category IS NULL OR category IN ('infrastructure', 'own-tools', 'product', 'client-product')
  ),
  display_name         TEXT,  -- optional; readers fall back to the slug when null
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE portfolio_manifest ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE portfolio_manifest IS
  'Cockpit portfolio membership (the getProductPipeline gate). Runtime-writable. NOT the env-sync manifest — that stays portfolio-manifest.yaml (external tooling).';

-- Seed the current portfolio (fallback ∪ YAML). Idempotent.
INSERT INTO portfolio_manifest (slug, vercel_project_id, supabase_project_ref, category) VALUES
  -- infrastructure
  ('platform-trust',               'prj_NTvBNN6cBAoAOoIgp84dYvxZCNtf', NULL,                   'infrastructure'),
  ('property-services',            'prj_bzS0HfyExXQXMsQAK9bH6SkrwQb0', NULL,                   'infrastructure'),
  ('storefront-mcp',               'prj_7fXPw71NH0cwx5xHHov1OM5dhAr3', NULL,                   'infrastructure'),
  -- own-tools
  ('preflight',                    'prj_09p4jLZy9LouVOWIOmyKYNNKmg63', NULL,                   'own-tools'),
  -- client-product
  ('mmcbuild',                     'prj_qKKLAkGGGVH5KocDfoGZQOqIZGvj', NULL,                   'client-product'),
  -- products
  ('pipeline',                     'prj_NaY4ybDsjSmJ7RgBbdD2BILm8nLl', NULL,                   'product'),
  ('deal-findrs',                  'prj_B0pKJM1fTAD5FtbZudh4kUEhaqQM', NULL,                   'product'),
  ('f2k-checkpoint-new',           'prj_XPELCzoIwOY5NoHGJxd4Ah6w59G9', NULL,                   'product'),
  ('investorpilot',                'prj_investorpilot',                NULL,                   'product'),
  ('ndissda-automate',             'prj_ndissda_automate',             NULL,                   'product'),
  ('r-and-d-tax',                  'prj_r_and_d_tax',                  NULL,                   'product'),
  ('tenderwatch',                  'prj_tenderwatch',                  NULL,                   'product'),
  ('f2k-fund-tokenisation',        'prj_f2k_fund_tokenisation',        NULL,                   'product'),
  ('easy-claude-code',             'prj_sedjiKhnHUBginSeK2jP555u4wAp', NULL,                   'product'),
  ('sayfix',                       'prj_7N65GURc3slhs5QL013Bo95AxD7i', 'vwvfmsuquohlgxcpzdjo', 'product'),
  ('connexions',                   'prj_pG5gak2uSAQQCKLvf39G72wcaqnG', NULL,                   'product'),
  ('kira',                         'prj_itVurDE9CD77K9rGWEQZNDmn33yz', NULL,                   'product'),
  ('launchready',                  'prj_DQS8A4CW2yVam1eJycDTiIZbGYUl', NULL,                   'product'),
  ('universal-interviews',         'prj_j9Xv0a6A0eU7naa8Ciw3jprYKlnL', NULL,                   'product'),
  ('raiseready-template',          'prj_fKuIr7tWjKyWTgXDMCJYuhKQIylD', NULL,                   'product'),
  ('partner-pilot',                'prj_partner_pilot',                NULL,                   'product'),
  ('outreach-ready',               'prj_outreach_ready',               NULL,                   'product'),
  ('smart-board',                  'prj_BUzAZzsnUyARewFEpO6OpXV7zqac', NULL,                   'product'),
  ('hair-stylist-ai',              'prj_sJ6UwGIaO05WnortzlLP5cIx9Azi', 'pkzbpzzgrxjebdmwfsmg', 'product'),
  ('lessonslearned',               'prj_f6efDw4g7FfXG0hnKVGR5Mv2202n', 'mrufnvmguacvutatdhan', 'product'),
  ('community-question-responder', 'prj_2VGX4tqLk3WtwSfl3Lawp2TQ6jyL', 'vhslputasuxnxbffwcxu', 'product'),
  ('disaster-support',             'prj_disaster_support',             NULL,                   'product'),
  ('lingo-pure-ai',                'prj_lingo_pure_ai',                NULL,                   'product'),
  ('mova',                         'prj_mova',                         NULL,                   'product'),
  ('rehearsals-ai',                'prj_rehearsals_ai',                NULL,                   'product'),
  ('tourlingo',                    'prj_tourlingo',                    NULL,                   'product'),
  ('universal-lingo',              'prj_universal_lingo',              NULL,                   'product'),
  ('singify',                      '',                                 NULL,                   'product'),
  -- YAML-only addition (not in the fallback)
  ('f2k-projects',                 'prj_4XqK9PjHvZ2YnLMtR6JwS8DmEfU5', NULL,                   'product')
ON CONFLICT (slug) DO NOTHING;
