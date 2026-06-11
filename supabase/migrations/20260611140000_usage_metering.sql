-- Phase 1 — Per-product / per-API usage metering (the analytics engine for the Cost Dashboard).
--
-- WHY this exists (and how it differs from cost_sources/cost_entries):
--   cost_sources + cost_entries answer "how much do we owe each PROVIDER, and is a balance
--   about to run out" — the top-line provider-billing view (synced or recorded by hand).
--   They have NO product dimension, so they can never answer "which of our ~38 products burned
--   the credits". usage_events fills that gap: every product reports its own token / API-call
--   usage here, we price it from model_prices at write time, and the analytics views slice it by
--   product, provider, model, and API. The two systems run in parallel and answer different
--   questions (see docs / lib/ops/usage.ts).
--
-- Cost is captured AT WRITE TIME (recordUsage looks up the price then in effect and stores both
--   usd_per_unit and the computed cost_usd) so a later price change never rewrites history, and so
--   the daily rollup is a trivial SUM. Unpriced usage is flagged (priced = false, cost_usd null) —
--   never silently treated as $0.

-- ── model_prices: provider/model/unit → USD per single unit (operator-maintained) ──────────────
create table if not exists public.model_prices (
  id              uuid primary key default gen_random_uuid(),
  provider        text not null,
  -- null model = a provider-wide default for this unit_type (fallback when no exact model match).
  model           text,
  -- e.g. input_tokens | output_tokens | cache_read_tokens | cache_write_tokens | characters | requests | credits
  unit_type       text not null,
  -- USD for ONE unit (one token, one character, one request). Tokens are tiny fractions, hence the
  -- high precision: $5 / 1M tokens = 0.0000050000.
  usd_per_unit    numeric(16,10) not null,
  effective_from  date not null default current_date,
  notes           text,
  created_at      timestamptz default now(),
  unique (provider, model, unit_type, effective_from)
);

comment on table public.model_prices is
  'Price map: provider/model/unit_type -> USD per unit. recordUsage() resolves the latest effective price <= the event date. Operator-maintained.';

-- ── usage_events: one row per (product, provider, model, unit_type) usage record ───────────────
create table if not exists public.usage_events (
  id              bigint generated always as identity primary key,
  product_slug    text not null,
  provider        text not null,
  model           text,                      -- specific model / SKU (e.g. claude-opus-4-8); null for non-LLM
  api             text,                       -- logical operation (e.g. messages, tts, search); for grouping
  unit_type       text not null,
  units           numeric(20,4) not null,
  usd_per_unit    numeric(16,10),             -- price applied at write time (audit); null when unpriced
  cost_usd        numeric(14,6),              -- units * usd_per_unit; null when unpriced
  priced          boolean not null default false,
  organisation_id uuid references public.organisations(id),
  occurred_at     timestamptz not null default now(),
  metadata        jsonb,
  created_at      timestamptz default now()
);

comment on table public.usage_events is
  'Per-product / per-API usage events with cost captured at write time. The analytics engine behind the Cost Dashboard charts; parallel to cost_entries (provider billing).';

create index if not exists usage_events_product on public.usage_events (product_slug, occurred_at desc);
create index if not exists usage_events_provider on public.usage_events (provider, model, occurred_at desc);
create index if not exists usage_events_api on public.usage_events (api, occurred_at desc);
create index if not exists usage_events_occurred on public.usage_events (occurred_at desc);

-- ── Daily rollup (the time-series chart source) ────────────────────────────────────────────────
create or replace view public.v_usage_daily as
select
  date_trunc('day', occurred_at)::date as day,
  product_slug,
  provider,
  model,
  api,
  sum(units)                           as units,
  sum(coalesce(cost_usd, 0))           as cost_usd,
  count(*)                             as events
from public.usage_events
group by 1, 2, 3, 4, 5
order by 1 desc;

-- ── Monthly by product (the "X spent on Y" callouts + bar chart) ───────────────────────────────
create or replace view public.v_usage_by_product as
select
  date_trunc('month', occurred_at)     as month,
  product_slug,
  sum(coalesce(cost_usd, 0))           as cost_usd,
  count(*)                             as events,
  count(*) filter (where not priced)   as unpriced_events
from public.usage_events
group by 1, 2
order by 1 desc, 3 desc;

-- ── Monthly by API/model (which API a product's spend goes to) ─────────────────────────────────
create or replace view public.v_usage_by_api as
select
  date_trunc('month', occurred_at)     as month,
  provider,
  model,
  api,
  sum(units)                           as units,
  sum(coalesce(cost_usd, 0))           as cost_usd,
  count(*)                             as events
from public.usage_events
group by 1, 2, 3, 4
order by 1 desc, 5 desc;

-- ── RLS: admin/service-role only, matching ops_cost_tracking (no anon policies) ────────────────
alter table public.model_prices enable row level security;
alter table public.usage_events enable row level security;

-- ── Seed: current model prices (verified 2026-06-04 via claude-api skill). USD per single token.
--    GPT / OpenRouter / ElevenLabs rows are clearly-marked seeds the operator should verify. ─────
insert into public.model_prices (provider, model, unit_type, usd_per_unit, notes) values
  ('anthropic', 'claude-fable-5',   'input_tokens',  0.0000100000, 'Fable 5 $10/1M in (2026-06-04)'),
  ('anthropic', 'claude-fable-5',   'output_tokens', 0.0000500000, 'Fable 5 $50/1M out (2026-06-04)'),
  ('anthropic', 'claude-opus-4-8',  'input_tokens',  0.0000050000, 'Opus 4.8 $5/1M in (2026-06-04)'),
  ('anthropic', 'claude-opus-4-8',  'output_tokens', 0.0000250000, 'Opus 4.8 $25/1M out (2026-06-04)'),
  ('anthropic', 'claude-sonnet-4-6','input_tokens',  0.0000030000, 'Sonnet 4.6 $3/1M in (2026-06-04)'),
  ('anthropic', 'claude-sonnet-4-6','output_tokens', 0.0000150000, 'Sonnet 4.6 $15/1M out (2026-06-04)'),
  ('anthropic', 'claude-haiku-4-5', 'input_tokens',  0.0000010000, 'Haiku 4.5 $1/1M in (2026-06-04)'),
  ('anthropic', 'claude-haiku-4-5', 'output_tokens', 0.0000050000, 'Haiku 4.5 $5/1M out (2026-06-04)')
on conflict (provider, model, unit_type, effective_from) do nothing;
