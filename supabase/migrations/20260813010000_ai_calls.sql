-- Wave 0, slice 0B — CALL-GRAIN telemetry.
--
-- WHY A SECOND TABLE RATHER THAN MORE COLUMNS ON usage_events.
-- usage_events has one row per (call, unit_type). That grain answers "what did it cost" and cannot
-- answer "what happened":
--   * latency is a property of a CALL, not of a token count;
--   * a FAILED call emits no unit rows at all, so the existing design is structurally blind to
--     errors — the single signal a routing policy most needs;
--   * there is no id joining the input_tokens row to the output_tokens row of the same call.
-- So usage_events keeps doing cost, unchanged, and this table records observation. They join on
-- call_id. Nothing that reads usage_events today has to change.

-- ── The link. Nullable on purpose: every pre-0B writer stays valid. ────────────────────────────
alter table public.usage_events add column if not exists call_id uuid;
create index if not exists usage_events_call on public.usage_events (call_id) where call_id is not null;

comment on column public.usage_events.call_id is
  'Links this unit row to the ai_calls row that produced it. Null for usage reported outside a call.';

-- ── ai_calls ──────────────────────────────────────────────────────────────────────────────────
create table if not exists public.ai_calls (
  -- Client-generated so the meter can stamp the unit rows with it before either is sent.
  call_id            uuid primary key,
  product_slug       text not null,
  environment        text,

  -- WHAT WAS ASKED FOR vs WHAT SERVED IT. Under any router these diverge, and the divergence is
  -- precisely what a later routing policy has to learn from.
  provider           text not null,
  model_requested    text,
  model_used         text,

  -- The canonical operation vocabulary, also written to usage_events.api. Free text, not an enum:
  -- the vocabulary will move, and a deploy should not be blocked by a CHECK on a label.
  operation          text not null,
  -- Bump when the prompt changes. A quality trend spanning a prompt rewrite compares two different
  -- things, and that is impossible to reconstruct after the fact.
  operation_version  text,

  started_at         timestamptz not null default now(),
  latency_ms         integer,
  status             text not null check (status in ('ok','error','timeout','refused')),
  error_class        text check (error_class in ('rate_limit','auth','server','schema','timeout','other')),

  -- Retries and fallbacks are ROWS chained by root_call_id, never a counter. A retry_count integer
  -- cannot express "attempt 1 on model A failed, attempt 2 on model B succeeded" — which is exactly
  -- the fallback-efficacy question worth asking later.
  attempt            smallint not null default 1,
  root_call_id       uuid,
  fallback_from      text,

  -- Denormalised so day-to-day queries need no join; usage_events remains the audit trail.
  input_tokens       integer,
  output_tokens      integer,
  cache_read_tokens  integer,
  cache_write_tokens integer,

  -- numeric(18,10), NOT usage_events' numeric(14,6). Measured 2026-08-13: a real 7-token
  -- text-embedding-3-small call costs $0.00000014 and rounds to 0.000000 at 6dp while priced=true —
  -- the "silent $0" the metering design explicitly set out to avoid, arriving via rounding instead
  -- of via a missing price. Analysis needs the fraction; the cost table keeps its own shape.
  cost_usd           numeric(18,10),
  priced             boolean not null default false,

  -- TRI-STATE, and the null is load-bearing: NOT APPLICABLE, never "failed". Coercing it to false
  -- would make every unvalidated operation look unreliable and poison any future policy.
  structured_valid   boolean,
  schema_name        text,
  refusal_class      text,

  -- Tool-use reliability, measured rather than benchmarked.
  tools_offered      smallint,
  tools_called       smallint,
  tools_wellformed   smallint,

  session_id         text,
  request_id         text,
  -- Hash or opaque id ONLY. Never an email (DATA_STANDARD S4). There is deliberately no column for
  -- prompt or completion text: this table records what happened, never what was said.
  user_ref           text,

  metadata           jsonb,
  created_at         timestamptz not null default now()
);

comment on table public.ai_calls is
  'One row per observed AI call: model, operation, latency, status, quality signals. Joins to usage_events on call_id. Grain is the CALL; usage_events is the UNIT.';

create index if not exists ai_calls_op_model  on public.ai_calls (operation, model_used, started_at desc);
create index if not exists ai_calls_product   on public.ai_calls (product_slug, started_at desc);
create index if not exists ai_calls_failures  on public.ai_calls (status, started_at desc) where status <> 'ok';
create index if not exists ai_calls_root      on public.ai_calls (root_call_id) where root_call_id is not null;

-- Service-role only, matching usage_events and model_prices: no anon policies.
alter table public.ai_calls enable row level security;

-- ── The view that makes the loop readable by a human, before any router exists ─────────────────
create or replace view public.v_model_performance as
select
  operation,
  provider,
  coalesce(model_used, model_requested)                       as model,
  count(*)                                                    as calls,
  round(avg(latency_ms))                                      as latency_avg_ms,
  percentile_cont(0.95) within group (order by latency_ms)    as latency_p95_ms,
  sum(cost_usd)                                               as cost_usd,
  sum(cost_usd) / nullif(count(*), 0)                         as usd_per_call,
  avg((structured_valid)::int::numeric)
    filter (where structured_valid is not null)               as validity_rate,
  count(*) filter (where status <> 'ok')::numeric
    / nullif(count(*), 0)                                     as error_rate
from public.ai_calls
group by 1, 2, 3;

comment on view public.v_model_performance is
  'Cost, latency, validity and error rate per (operation, model). The empirical basis for model selection — readable by a person making the decision by hand, long before any automated router exists.';
