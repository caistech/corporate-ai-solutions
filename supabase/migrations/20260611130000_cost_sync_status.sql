-- Cost-sync status + manual-tracking support for the Cost Dashboard.
--
-- Two halves of the same feature:
--  1. AUTO providers — record the OUTCOME of each auto-sync attempt on the source itself, so the
--     dashboard can show *why* a provider is/ isn't syncing (ok / key missing / http error / the
--     provider has no usage API) instead of a silent $0. Keys live in Vercel sensitive env, one per
--     provider; the registry in src/lib/ops/providers.ts maps provider -> env var + capability.
--  2. MANUAL providers — a per-source billing-console deep link so refreshing a balance is two
--     clicks (open the provider's billing page -> copy the number -> paste). Balance staleness is
--     already derivable from balance_updated_at.
--
-- Idempotent: add-column-if-not-exists, safe to re-run.

alter table public.cost_sources
  add column if not exists billing_url       text,
  add column if not exists last_sync_at      timestamptz,
  add column if not exists last_sync_status  text,
  add column if not exists last_sync_detail  text;

-- last_sync_status is a small enum-like set; enforce it but allow NULL (never synced).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'cost_sources_last_sync_status_chk'
  ) then
    alter table public.cost_sources
      add constraint cost_sources_last_sync_status_chk
      check (last_sync_status is null or last_sync_status in
        ('ok', 'key_missing', 'error', 'no_api', 'manual'));
  end if;
end $$;

comment on column public.cost_sources.billing_url is
  'Deep link to the provider''s billing/usage console (for fast manual balance refresh).';
comment on column public.cost_sources.last_sync_status is
  'Outcome of the last auto-sync attempt: ok | key_missing | error | no_api | manual (null = never).';
comment on column public.cost_sources.last_sync_detail is
  'Human-readable detail for the last sync outcome, e.g. "HTTP 401 — admin key required".';
