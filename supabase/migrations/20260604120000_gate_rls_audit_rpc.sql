-- 20260604120000_gate_rls_audit_rpc.sql
--
-- RPC for check 38 (38c) — lets the auto checker read live RLS posture through supabase-js,
-- which cannot query pg_catalog directly. Returns one row per app-schema table with a verdict:
--   FAIL: RLS disabled            (rowsecurity = false)
--   FAIL: RLS on, zero policies   (RLS enabled but no policy of any kind — locked out / accidental)
--   pass                          (RLS on with >= 1 policy; selective-policy tables like
--                                  pipeline.audit_log pass, since they have at least one)
--
-- SECURITY DEFINER (owned by the migration role) so it sees the full catalog regardless of caller;
-- locked to service_role only (revoked from public/anon/authenticated) so it is NOT a data-exposure
-- surface — it returns only RLS metadata, never row data, and only the cockpit's service key can call it.
-- search_path is pinned and all catalog objects are fully-qualified (SECURITY DEFINER hardening).
--
-- Idempotent: CREATE OR REPLACE + re-runnable GRANT/REVOKE.

create or replace function public.gate_rls_audit(app_schemas text[])
returns table (
  schemaname   text,
  tablename    text,
  rls_enabled  boolean,
  policy_count bigint,
  verdict      text
)
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select
    t.schemaname::text,
    t.tablename::text,
    t.rowsecurity                              as rls_enabled,
    count(p.policyname)                        as policy_count,
    case
      when not t.rowsecurity                   then 'FAIL: RLS disabled'
      when count(p.policyname) = 0             then 'FAIL: RLS on, zero policies'
      else 'pass'
    end                                        as verdict
  from pg_catalog.pg_tables t
  left join pg_catalog.pg_policies p
    on p.schemaname = t.schemaname
   and p.tablename  = t.tablename
  where t.schemaname = any(app_schemas)
  group by t.schemaname, t.tablename, t.rowsecurity;
$$;

comment on function public.gate_rls_audit(text[]) is
  'Check 38 (38c): per-table RLS verdict for the given app schemas. service_role only. '
  'Returns RLS metadata only (never row data). See migration 20260604120000.';

-- Lock down: not callable by the client-facing roles; only the cockpit service key.
revoke all     on function public.gate_rls_audit(text[]) from public, anon, authenticated;
grant  execute on function public.gate_rls_audit(text[]) to service_role;
