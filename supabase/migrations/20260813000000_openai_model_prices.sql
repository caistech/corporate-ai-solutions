-- Wave 0, slice 0A — make OpenAI usage priceable.
--
-- WHY: model_prices was seeded with 8 rows, ALL provider='anthropic'. The 20260611140000 migration's
-- comment claims "GPT / OpenRouter / ElevenLabs rows are clearly-marked seeds the operator should
-- verify", but no such rows were ever inserted and no later migration added them. Kira and
-- Orchestrator run entirely on OpenAI, so every event they report today would land priced=false.
-- Metering them without these rows produces a dashboard full of unpriced gaps, not cost data.
--
-- SCOPE: OpenAI only. Deliberately NOT seeded here:
--   * OpenRouter — the effective price depends on the route OpenRouter resolves, so a single
--     per-model rate would be wrong in a way that looks right. Needs model_used (slice 0B) first.
--   * DataWizz (DealFindrs) — an endpoint alias under a commercial contract, not a public per-token
--     rate. Recording priced=false is honest; inventing a number is not.
--   * cache_read_tokens for OpenAI — @caistech/usage-meter deliberately records cached_tokens in
--     event metadata rather than as a unit event, because whether cached_tokens is a SUBSET of
--     prompt_tokens is ambiguous in OpenAI's own documentation. Pricing a unit we do not emit would
--     be dead configuration; resolve the semantics from real metadata first.

-- ── 1. Fix the constraint BEFORE any provider-wide default row can be written ──────────────────
-- model_prices declares unique (provider, model, unit_type, effective_from) with model NULLABLE.
-- PostgreSQL treats NULLs as DISTINCT in a unique constraint, so the provider-wide default row
-- (model IS NULL) can be inserted an unlimited number of times — the constraint does not constrain
-- the one row most likely to be duplicated. priceForUsage() then does rows.find(r => r.model === null)
-- over rows ordered by effective_from desc, so same-date duplicates resolve arbitrarily and silently.
-- No default rows are seeded in this migration, but the guard lands first so it is impossible to
-- introduce that state later.
create unique index if not exists model_prices_provider_default_uniq
  on public.model_prices (provider, unit_type, effective_from)
  where model is null;

comment on index public.model_prices_provider_default_uniq is
  'Provider-wide default rows (model IS NULL) are not covered by the table''s UNIQUE constraint, because Postgres treats NULLs as distinct. This partial index makes them genuinely unique.';

-- ── 2. OpenAI prices, USD per SINGLE token ────────────────────────────────────────────────────
-- Rates verified 2026-08-13. gpt-4.1-mini is independently corroborated by SayFix's live
-- src/lib/cost/rates.ts (COST_GPT41MINI_IN_PER_M=0.4, COST_GPT41MINI_OUT_PER_M=1.6), which has been
-- pricing production traffic — the only pair in this seed with a second, in-portfolio source.
--
-- Models chosen because they are the ones actually present in source today:
--   gpt-4.1-mini            — Kira x7, Orchestrator x2, SayFix voice
--   gpt-4o-mini             — Kira x5
--   text-embedding-3-small  — Kira lib/embeddings/client.ts
insert into public.model_prices (provider, model, unit_type, usd_per_unit, notes) values
  ('openai', 'gpt-4.1-mini',           'input_tokens',  0.0000004000, '$0.40/1M in  (verified 2026-08-13; matches SayFix rates.ts)'),
  ('openai', 'gpt-4.1-mini',           'output_tokens', 0.0000016000, '$1.60/1M out (verified 2026-08-13; matches SayFix rates.ts)'),
  ('openai', 'gpt-4o-mini',            'input_tokens',  0.0000001500, '$0.15/1M in  (verified 2026-08-13)'),
  ('openai', 'gpt-4o-mini',            'output_tokens', 0.0000006000, '$0.60/1M out (verified 2026-08-13)'),
  ('openai', 'text-embedding-3-small', 'input_tokens',  0.0000000200, '$0.02/1M     (verified 2026-08-13)')
on conflict (provider, model, unit_type, effective_from) do nothing;
