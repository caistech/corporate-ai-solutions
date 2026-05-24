-- Add the Singify card to the pipeline cockpit.
-- First lane-1 product; thin MVP deployed + verified live (record → improve → coach).
-- Gate 1 OPEN (mvp_ready = TRUE) because the MVP is deployed and verified end-to-end.
-- Idempotent. (Added via migration because the branch-preview API is Vercel-auth-protected.)

INSERT INTO methodology_hypothesis_cards
  (product_slug, origin_summary, hypothesis_rows, status, pipeline_stage,
   engine_cluster, build_status, mvp_url, monetisation_lane, mvp_ready)
VALUES
  ('singify',
   'First lane-1 product. Karaoke + AI vocal polish + voice coach that singing teachers white-label for their students. Thin MVP deployed + verified live (record -> improve -> coach).',
   '[{"field":"distributor","hypothesis_text":"Singing teachers / music academies will white-label this for between-lesson student practice and pay a recurring fee.","validation_status":"pending"},{"field":"original_end_user","hypothesis_text":"Students want to hear themselves improved + get specific coach feedback between lessons.","validation_status":"pending"}]'::jsonb,
   'dialogue-complete', 'validation', 'voice-coaching', 'thin-mvp',
   'https://singify-platform.vercel.app/sing', '1-paid-saas', TRUE)
ON CONFLICT (product_slug) DO NOTHING;
