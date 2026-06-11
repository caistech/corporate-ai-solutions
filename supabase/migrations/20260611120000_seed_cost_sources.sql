-- Seed the cost sources named in the cost-dashboard request (SayFix ticket 5750fc95):
-- the priority APIs first (Anthropic, OpenAI, Open Code Zen — they burn hardest on validation
-- runs), then the rest of the recurring third-party APIs. Balances start null (the operator
-- records them in the Cost Dashboard to enable the $20 low-balance alerts); spend fills in from
-- the daily cost sync. Supabase per-project rows are NOT seeded here — the cron auto-discovers
-- them via the Management API.
--
-- Idempotent: inserts a provider only when no cost_source for it exists yet, so re-running (or
-- an operator having already added one) never duplicates. Assigned to the internal org.

insert into public.cost_sources (provider, name, organisation_id, billing_model, alert_threshold_usd, is_active, notes)
select v.provider,
       v.name,
       '00000000-0000-0000-0000-000000000001'::uuid,
       'per-use',
       20,
       true,
       nullif(v.notes, '')
from (values
  ('anthropic',     'Anthropic (Claude API)',  'Priority — burns hard on validation runs'),
  ('openai',        'OpenAI API',              'Priority'),
  ('open-code-zen', 'Open Code Zen',           'Priority — run regularly'),
  ('unipile',       'Unipile (LinkedIn/email)',''),
  ('elevenlabs',    'ElevenLabs (voice)',      ''),
  ('brave',         'Brave Search',            ''),
  ('hunter',        'Hunter (email finder)',   ''),
  ('ingest',        'Ingest (doc/drawing OCR)','Spikes on architectural drawings'),
  ('resend',        'Resend (email)',          '')
) as v(provider, name, notes)
where not exists (
  select 1 from public.cost_sources cs where cs.provider = v.provider
);
