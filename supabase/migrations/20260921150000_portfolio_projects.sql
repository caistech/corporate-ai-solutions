-- portfolio_projects — the richer, portfolio-level record behind /portfolio-admin.
--
-- portfolio_manifest (20260605120000) stays exactly what its own comment says it is: the
-- cockpit's thin MEMBERSHIP gate (slug, vercel_project_id, supabase_project_ref, category).
-- It is read by external tooling (portfolio-env-sync, the marketplace) and this migration does
-- NOT touch it or add an FK onto it — a new "add a project" entry point should not be coupled to
-- that gate's existing consumers.
--
-- This table holds what /portfolio-admin actually needs to show and capture: what a project IS
-- (objectives, description) and where to go to actually operate it (portal_url — the project's
-- own portal, e.g. Kira's is kiraexec.com, entirely outside this repo/domain). Soft-keyed by slug
-- (matched against portfolio_manifest.slug when a row exists there) rather than FK'd, because a
-- portfolio-admin registration is a lighter act than the full methodology/validation admission —
-- it should never be blocked on a product also existing in the validation pipeline's gate table.
--
-- origin distinguishes how the record was created: 'operator' (typed/seeded directly) vs
-- 'voice_interview' (captured via the Kira-shaped "Add New Project" interview — not yet wired;
-- interview_summary is the extraction result sink once it is).
--
-- RLS: service-role only, admin-surface (same posture as portfolio_manifest / readiness_criteria).
-- Idempotent; safe to re-run.

CREATE TABLE IF NOT EXISTS portfolio_projects (
  slug              TEXT PRIMARY KEY,
  display_name      TEXT NOT NULL,
  objectives        TEXT,
  description       TEXT,
  portal_url        TEXT,
  origin            TEXT NOT NULL DEFAULT 'operator' CHECK (origin IN ('operator', 'voice_interview')),
  interview_summary TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE portfolio_projects IS
  'Portfolio-level project record behind /portfolio-admin — what a project is + where its own portal lives. Soft-keyed by slug against portfolio_manifest, not FK''d. Service-role only. 2026-09-21.';

-- Seed the first real entry: Kira, executing the portfolio -> Kira structure this table exists
-- for. Content reflects the actual product as built (business-genome capture, owner-independence
-- objective), not placeholder text.
INSERT INTO portfolio_projects (slug, display_name, objectives, description, portal_url, origin)
VALUES (
  'kira',
  'Kira',
  'Help a business owner build a business with minimal owner dependence and maximum '
  || 'defensible sale value — captured as an evidence-based Business Genome, proven (eventually) '
  || 'by the owner being able to step away for weeks without material disruption.',
  'AI voice agent + persistent business-genome memory, sold through a consultant/distributor '
  || 'relationship (business coaches, accountants, TAB-type advisers) rather than direct to the '
  || 'business owner. Each level of the hierarchy (portfolio -> distributor/consultant -> client '
  || 'organisation -> person) gets its own contextual Kira, all built on one auth/identity/'
  || 'organisation model.',
  'https://kiraexec.com',
  'operator'
)
ON CONFLICT (slug) DO NOTHING;
