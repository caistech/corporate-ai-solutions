-- Step 2 — set the chosen products into the workflow.
-- Loads the portfolio's live products into the pipeline cockpit as Hypothesis
-- Cards so they're ready to run through validation (the backfill).
--
-- Honest seeding: only objective fields are set.
--   engine_cluster — a starting HINT from the consolidation-map hypothesis (editable in the cockpit)
--   build_status   — from the product's live state (live → fat-mvp; building → none)
--   mvp_url        — the product's existing deploy (a starting MVP link)
--   monetisation_lane — NULL, EXCEPT byok-free products where lane 4 is already an objective fact
--   mvp_ready      — FALSE for everything. Gate 1 is the operator's per-product confirmation;
--                    a fat MVP still needs a once-over before it becomes the outreach payload.
--
-- Excludes: checkpoint (paid client), platform-trust + pubguard (pure infrastructure).
-- Idempotent: ON CONFLICT (product_slug) DO NOTHING — never clobbers existing cards
-- (e.g. rehearsals-ai or anything the methodology-loop session created).

INSERT INTO methodology_hypothesis_cards
  (product_slug, origin_summary, hypothesis_rows, status, pipeline_stage,
   engine_cluster, build_status, mvp_url, monetisation_lane, mvp_ready)
VALUES
  -- Engine 1 — voice / coaching (the Singify engine cluster)
  ('rehearsals-ai',        'Loaded into the pipeline cockpit for validation.', '[]'::jsonb, 'dialogue-complete', 'ideation', 'voice-coaching', 'fat-mvp', 'https://rehearsals-ai.vercel.app',                              NULL,       FALSE),
  ('raiseready-template',  'Loaded into the pipeline cockpit for validation.', '[]'::jsonb, 'dialogue-complete', 'ideation', 'voice-coaching', 'fat-mvp', 'https://raiseready-template.vercel.app',                        NULL,       FALSE),
  ('connexions',           'Loaded into the pipeline cockpit for validation.', '[]'::jsonb, 'dialogue-complete', 'ideation', 'voice-coaching', 'fat-mvp', 'https://connexions-corporate-ai-solutions.vercel.app',          NULL,       FALSE),
  ('universallingo',       'Loaded into the pipeline cockpit for validation.', '[]'::jsonb, 'dialogue-complete', 'ideation', 'voice-coaching', 'fat-mvp', 'https://universal-lingo-marketing.vercel.app',                  NULL,       FALSE),
  ('kira',                 'Loaded into the pipeline cockpit for validation.', '[]'::jsonb, 'dialogue-complete', 'ideation', 'voice-coaching', 'fat-mvp', 'https://kira-rho.vercel.app',                                   NULL,       FALSE),
  ('launchready',          'Loaded into the pipeline cockpit for validation.', '[]'::jsonb, 'dialogue-complete', 'ideation', 'voice-coaching', 'fat-mvp', 'https://launchready-ruby.vercel.app',                           NULL,       FALSE),

  -- Engine 2 — property
  ('dealfindrs',           'Loaded into the pipeline cockpit for validation.', '[]'::jsonb, 'dialogue-complete', 'ideation', 'property',       'fat-mvp', 'https://deal-findrs.vercel.app',                                NULL,       FALSE),

  -- Engine 3 — outreach / contact-discovery
  ('partner-pilot',        'Loaded into the pipeline cockpit for validation.', '[]'::jsonb, 'dialogue-complete', 'ideation', 'outreach',       'fat-mvp', 'https://partner-pilot-corporate-ai-solutions.vercel.app',     NULL,       FALSE),
  ('investor-pilot',       'Loaded into the pipeline cockpit for validation.', '[]'::jsonb, 'dialogue-complete', 'ideation', 'outreach',       'fat-mvp', 'https://investor-pilot-pi.vercel.app',                          NULL,       FALSE),
  ('outreachready',        'Loaded into the pipeline cockpit for validation.', '[]'::jsonb, 'dialogue-complete', 'ideation', 'outreach',       'fat-mvp', 'https://outreach-ready.vercel.app',                            NULL,       FALSE),
  ('tenderwatch',          'Loaded into the pipeline cockpit for validation.', '[]'::jsonb, 'dialogue-complete', 'ideation', 'outreach',       'fat-mvp', 'https://tenderwatch-alpha.vercel.app',                         NULL,       FALSE),

  -- Engine 4 — compliance / regulated
  ('rnd-tax-tracker',      'Loaded into the pipeline cockpit for validation.', '[]'::jsonb, 'dialogue-complete', 'ideation', 'compliance',     'fat-mvp', 'https://r-and-d-tax-eligibility-work-recording-corporate-ai-solutions.vercel.app', NULL, FALSE),
  ('ndis-sda-automate',    'Loaded into the pipeline cockpit for validation. NOTE: canonical URL hijacked — confirm before outreach.', '[]'::jsonb, 'dialogue-complete', 'ideation', 'compliance', 'fat-mvp', 'https://ndissda-automate.vercel.app', NULL, FALSE),
  ('f2k-fund-tokenisation','Loaded into the pipeline cockpit for validation.', '[]'::jsonb, 'dialogue-complete', 'ideation', 'compliance',     'fat-mvp', 'https://f2-k-fund-tokenisation.vercel.app',                    NULL,       FALSE),
  ('disaster-support',     'Loaded into the pipeline cockpit for validation.', '[]'::jsonb, 'dialogue-complete', 'ideation', 'compliance',     'fat-mvp', 'https://disaster-support.vercel.app',                          NULL,       FALSE),

  -- Standalone / BYOK (lane 4 is an objective fact for byok-free products)
  ('cqr',                  'Loaded into the pipeline cockpit for validation.', '[]'::jsonb, 'dialogue-complete', 'ideation', 'standalone',     'fat-mvp', 'https://corporate-ai-solutions.vercel.app/marketplace/cqr',    '4-byok',   FALSE),
  ('preflight',            'Loaded into the pipeline cockpit for validation.', '[]'::jsonb, 'dialogue-complete', 'ideation', 'standalone',     'fat-mvp', 'https://preflight-phi.vercel.app',                              '4-byok',   FALSE),
  ('easy-claude-code',     'Loaded into the pipeline cockpit for validation.', '[]'::jsonb, 'dialogue-complete', 'ideation', 'standalone',     'fat-mvp', 'https://easy-claude-code.vercel.app',                           NULL,       FALSE),
  ('storefront-mcp',       'Loaded into the pipeline cockpit for validation.', '[]'::jsonb, 'dialogue-complete', 'ideation', 'standalone',     'fat-mvp', 'https://storefront-mcp-eight.vercel.app/',                      NULL,       FALSE),

  -- Engine TBD / decision pending (kept null so the operator/backfill assigns)
  ('storyverse',           'Loaded into the pipeline cockpit for validation. Engine cluster TBD.', '[]'::jsonb, 'dialogue-complete', 'ideation', NULL, 'fat-mvp', 'https://story-verse-two.vercel.app/',                NULL,       FALSE),
  ('smartboard',           'Loaded into the pipeline cockpit for validation. Rule-15 kill candidate (no obvious distributor).', '[]'::jsonb, 'dialogue-complete', 'ideation', NULL, 'fat-mvp', 'https://smart-board-eight.vercel.app/', NULL, FALSE),
  ('cleanclose',           'Loaded into the pipeline cockpit for validation. Still building (waitlist).', '[]'::jsonb, 'dialogue-complete', 'ideation', NULL, 'none', NULL,                                                  NULL,       FALSE)
ON CONFLICT (product_slug) DO NOTHING;
