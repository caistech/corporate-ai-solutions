-- Cost balance tracking + low-balance email alerts
-- Extends the existing ops cost tracking (20260602000001_ops_cost_tracking.sql).
--
-- The existing schema tracks SPEND (cost_entries, one row per source per day) but has
-- no notion of REMAINING BALANCE / prepaid credits and no alerting. This is the gap that
-- caused "Anthropic credits ran out mid-production": the team could see what was spent but
-- never how much was left, and nothing warned them before zero.
--
-- This migration adds a current balance + per-source alert threshold + an alert-sent
-- timestamp (debounce) to cost_sources. Balances are populated either automatically where
-- a provider exposes a balance API (e.g. OpenRouter /credits) or recorded by an operator
-- for providers that do not (Anthropic, OpenAI, Open Code Zen, etc.).
--
-- Idempotent: ADD COLUMN IF NOT EXISTS is safe to re-run. No CREATE POLICY here
-- (cost_sources is admin/service-role only; RLS was enabled by the prior migration).

alter table public.cost_sources
  add column if not exists balance_usd            numeric(10,2);

alter table public.cost_sources
  add column if not exists balance_updated_at      timestamptz;

-- Adjustable per-source low-balance threshold; defaults to $20 USD per the requirement.
alter table public.cost_sources
  add column if not exists alert_threshold_usd     numeric(10,2) not null default 20;

-- Last time a low-balance alert email was sent for this source (debounce so the daily
-- cron does not re-email the same low balance every run).
alter table public.cost_sources
  add column if not exists low_balance_alerted_at  timestamptz;

comment on column public.cost_sources.balance_usd is 'Current remaining credit / prepaid balance in USD (null = unknown / not tracked)';
comment on column public.cost_sources.alert_threshold_usd is 'Email the admin when balance_usd drops below this (USD). Adjustable per source; default 20.';
comment on column public.cost_sources.low_balance_alerted_at is 'When the last low-balance alert email was sent (debounce).';

-- View: sources currently below their alert threshold (a known balance under the line).
-- security_invoker = on so the view runs with the CALLER's privileges (inheriting cost_sources'
-- RLS) instead of the owner's — a plain view is security-definer-like and would otherwise bypass
-- the base table's admin/service-role-only RLS and expose provider balances to any client.
create or replace view public.v_low_balance_sources
with (security_invoker = true) as
select
  cs.id,
  cs.provider,
  cs.name,
  cs.balance_usd,
  cs.alert_threshold_usd,
  cs.balance_updated_at,
  cs.low_balance_alerted_at
from public.cost_sources cs
where cs.is_active = true
  and cs.balance_usd is not null
  and cs.balance_usd < cs.alert_threshold_usd;

-- Defence in depth: cost balances are operator-only. Revoke the anon/authenticated grants the
-- public schema hands out by default; only the service role (server-side, used by the cron + the
-- admin API) may read it. Idempotent.
revoke all on public.v_low_balance_sources from anon, authenticated;
grant select on public.v_low_balance_sources to service_role;
