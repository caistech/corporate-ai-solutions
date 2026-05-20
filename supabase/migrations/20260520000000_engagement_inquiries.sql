-- Studio-in-residence engagement inquiries.
-- Captured by /engagement page form -> /api/engagement -> here.
-- Schema mirrors the inquiry-capture fields locked in docs/BYOK_PIVOT_REQUIREMENTS.md
-- (the "Inquiry capture" block under "/engagement page spec").

-- gen_random_uuid() ships with Supabase by default; no extension needed.

CREATE TABLE IF NOT EXISTS engagement_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Contact
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT,
    org_name TEXT,

    -- Org context (for qualification + Shape-B fit check)
    org_type TEXT,            -- 'vc-fund' | 'studio' | 'accelerator' | 'dev-shop' | 'other'
    aum_or_revenue TEXT,      -- Free-form so $30M AUM / $1M ARR / "n/a" all work

    -- Engagement context
    cohort_size INT,
    cohort_industries TEXT,
    target_window TEXT,       -- 'jan-mar' | 'jul-sep' | 'either'
    engagement_length TEXT,   -- '3-month' | '6-month' | 'flexible'
    deal_shape TEXT,          -- 'A' | 'B' | 'C' | 'open'

    -- Shape-B qualification evidence (per docs/BYOK_PIVOT_REQUIREMENTS.md)
    past_cohort_outcomes TEXT,

    -- Freeform
    notes TEXT,

    -- Ops
    status TEXT DEFAULT 'new', -- 'new' | 'qualified' | 'in-call' | 'closed-won' | 'closed-no-fit'
    referrer TEXT
);

CREATE INDEX IF NOT EXISTS idx_engagement_email ON engagement_inquiries(email);
CREATE INDEX IF NOT EXISTS idx_engagement_status ON engagement_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_engagement_target_window ON engagement_inquiries(target_window);

-- Row-level security per the global CLAUDE.md rule.
-- Form submission goes via the API route using the service-role key (server-side only).
-- No anon-role policy needed because the public form does not read this table.
ALTER TABLE engagement_inquiries ENABLE ROW LEVEL SECURITY;

-- Anyone hitting Supabase with the anon key sees nothing (no policy = deny).
-- The service role bypasses RLS by design; the /api/engagement route uses it.
