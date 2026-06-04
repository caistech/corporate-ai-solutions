-- Ops Cost Tracking - Infrastructure expense management
-- Tracks all costs across products, clients, and internal tools

-- Organisations (Global Buildtech + clients)
create table if not exists public.organisations (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  type            text not null check (type in ('internal', 'client', 'partner')),
  parent_id       uuid references public.organisations(id),
  fixed_mrr_usd   numeric(10,2),
  status          text not null default 'active' check (status in ('active', 'paused', 'archived')),
  created_at      timestamptz default now()
);

-- Cost sources (what we pay for)
create table if not exists public.cost_sources (
  id              uuid primary key default gen_random_uuid(),
  provider        text not null,
  source_ref      text,
  name            text not null,
  organisation_id uuid references public.organisations(id),
  billing_model   text check (billing_model in ('fixed', 'per-use', 'tiered')),
  fixed_cost_usd  numeric(10,2),
  is_active       boolean default true,
  notes           text,
  created_at      timestamptz default now()
);

-- Individual cost entries (one per source per day)
create table if not exists public.cost_entries (
  id              bigint generated always as identity primary key,
  source_id       uuid not null references public.cost_sources(id) on delete cascade,
  entry_date      date not null,
  cost_usd        numeric(10,2) not null,
  usage_json      jsonb,
  source_data     jsonb,
  created_at      timestamptz default now(),
  unique(source_id, entry_date)
);

-- Indexes
create index if not exists cost_entries_date on public.cost_entries (entry_date desc);
create index if not exists cost_entries_source on public.cost_entries (source_id, entry_date);

-- View: Monthly by provider
create or replace view public.v_monthly_by_provider as
select
  date_trunc('month', ce.entry_date) as month,
  cs.provider,
  sum(ce.cost_usd) as total_usd
from public.cost_entries ce
join public.cost_sources cs on cs.id = ce.source_id
group by 1, 2
order by 1 desc, 2;

-- View: Monthly by organisation
create or replace view public.v_monthly_by_org as
select
  date_trunc('month', ce.entry_date) as month,
  o.name as organisation,
  cs.provider,
  sum(ce.cost_usd) as total_usd
from public.cost_entries ce
join public.cost_sources cs on cs.id = ce.source_id
join public.organisations o on o.id = cs.organisation_id
group by 1, 2, 3
order by 1 desc, 2, 3;

-- View: Idle detection
create or replace view public.v_idle_sources as
with latest as (
  select source_id, max(entry_date) as last_entry,
         sum(cost_usd) as total_cost
  from public.cost_entries
  where entry_date > now() - interval '14 days'
  group by source_id
),
activity as (
  select source_id, usage_json->>'requests' as requests
  from public.cost_entries
  where entry_date > now() - interval '7 days'
)
select cs.id, cs.provider, cs.name, cs.organisation_id,
       l.last_entry, l.total_cost,
       coalesce(a.requests::int, 0) as requests_7d
from public.cost_sources cs
join latest l on l.source_id = cs.id
left join activity a on a.source_id = cs.id
where cs.is_active = true
  and (a.requests::int = 0 or a.requests is null)
  and cs.id not in (
    select id from public.cost_sources where name ilike '%paused%'
  );

-- Seed: Global Buildtech internal org
insert into public.organisations (id, name, type, status)
values ('00000000-0000-0000-0000-000000000001', 'Global Buildtech Australia', 'internal', 'active')
on conflict do nothing;

-- RLS (service role only - internal admin tool)
alter table public.organisations enable row level security;
alter table public.cost_sources enable row level security;
alter table public.cost_entries enable row level security;

-- No anon policies - this is admin-only
-- comment on tables
comment on table public.organisations is 'Organisations: Global Buildtech and clients';
comment on table public.cost_sources is 'Cost sources: subscriptions, APIs, services we pay for';
comment on table public.cost_entries is 'Daily cost entries per source';
