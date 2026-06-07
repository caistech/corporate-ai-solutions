-- Fixer-lane routing: which lane resolves each readiness finding.
-- See cais-shared-services/gate-readiness/FIXER_LANES.md + fixer-lanes.json (canonical source).
--   code           -> design-build (repo/app change)
--   config         -> config-fixer (idempotent infra op: Vercel/Supabase scaffolding/provisioning)
--   operator-input -> the operator supplies a value/decision the machine cannot generate
-- GOLDEN RULE: a finding the machine can't auto-fix is never silent — the card surfaces it with
-- instructions (operator-input) instead of dropping it. Idempotent: safe to re-apply.

ALTER TABLE readiness_criteria
  ADD COLUMN IF NOT EXISTS fixer TEXT NOT NULL DEFAULT 'code';

-- config lane — infra ops the config-fixer performs with a management token.
UPDATE readiness_criteria SET fixer = 'config'
 WHERE code IN (
   '18',   -- voice agent allowlist (ElevenLabs provisioning)
   '19',   -- workspace webhook bind (ElevenLabs provisioning)
   '28',   -- standard profiles table+trigger+RLS scaffolding migration
   '35',   -- email sender / Resend SMTP + templates
   '40',   -- Vercel env vars sensitive, prod+preview only
   'VT_D1','VT_D2','VT_D3','VT_D4','VT_D5','VT_D6','VT_D7'  -- ADMIN_EMAILS, QA accounts, profiles, email infra
 );

-- operator-input lane — the operator must act; the machine guides + validates (never silent).
UPDATE readiness_criteria SET fixer = 'operator-input'
 WHERE code IN (
   'VT_A5',  -- Sign Out Everywhere (destructive — operator-verified, never agent-run)
   'VT_A6'   -- Delete Account (destructive — operator-verified, never agent-run)
 );

-- everything else stays 'code' (design-build) via the column default.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'readiness_criteria' AND constraint_name = 'readiness_criteria_fixer_chk'
  ) THEN
    ALTER TABLE readiness_criteria
      ADD CONSTRAINT readiness_criteria_fixer_chk
      CHECK (fixer IN ('code','config','operator-input'));
  END IF;
END $$;

COMMENT ON COLUMN readiness_criteria.fixer IS
  'Which lane resolves a finding for this check: code (design-build) | config (config-fixer) | operator-input (operator supplies value/decision). Canonical source: cais-shared-services/gate-readiness/fixer-lanes.json. Golden rule: operator-input findings are surfaced on the card with instructions, never failed silently.';
