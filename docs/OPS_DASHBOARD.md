# Ops Center — Global Buildtech Infrastructure Dashboard

**Goal:** Single pane of glass for all infrastructure costs across all products, clients, and internal tools. Track what's being paid, by whom, and why — with alerts for idle resources and budget overruns.

**Status:** Design spec — not yet implemented.

---

## 1. Why This Exists

Current state:
- Supabase costs visible only via invoice (opaque refs, can't tell what's active)
- Vercel costs spread across products, no unified view
- Client projects mixed with internal — can't see if they're profitable
- No automated idle detection — paying for dead repos

Target state:
- Every cost source tracked with owner/client attribution
- Real-time-ish sync from provider APIs where available
- Clear view: "This month we spent $X, Y% up from last month, here's why"
- Idle resource alerts

---

## 2. Cost Sources Tracked

| Category | Providers | Data Source | Sync Frequency |
|----------|-----------|-------------|----------------|
| **Database** | Supabase | Management API | Daily |
| **Hosting** | Vercel | Vercel API | Daily |
| **LLM APIs** | Anthropic, OpenAI, OpenRouter | Provider usage API | Daily |
| **Voice AI** | ElevenLabs | ElevenLabs API | Daily |
| **Email** | Resend | Resend API | Daily |
| **Code** | GitHub | GitHub API | Daily |
| **Payments** | Stripe | Stripe API | Daily |
| **CRM** | HubSpot, LinkedIn | Manual or API | Monthly |
| **Productivity** | Xero, Zoom, Google, Atlassian, Skool | Bank statement import | Monthly |
| **Domains** | Namecheap, various | Manual | Monthly |
| **Other** | DigitalOcean, Render, Twilio, etc | Bank statement import | Monthly |

---

## 3. Database Schema

```sql
-- Profiles table (per §4 PRODUCT_STANDARDS)
-- Already exists in corporate-ai-solutions, no need to recreate
-- create table if not exists auth.profiles (
--   id              uuid references auth.users(id) primary key,
--   first_name      text,
--   last_name       text,
--   phone           text,
--   company         text,
--   job_title      text,
--   email_marketing_opt_in boolean default false,
--   created_at      timestamptz default now(),
--   updated_at      timestamptz default now()
-- );

-- Organizations (Global Buildtech, clients)
CREATE TABLE organisations (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  type            text not null,  -- 'internal' | 'client' | 'partner'
  parent_id       uuid references organisations(id),
  fixed_mrr_usd   numeric(10,2),   -- what they pay us (for clients)
  status          text default 'active',
  created_at      timestamptz default now()
);

-- Cost sources (what we pay for)
CREATE TABLE cost_sources (
  id              uuid primary key default gen_random_uuid(),
  provider        text not null,  -- 'supabase' | 'vercel' | 'anthropic' | etc
  source_ref      text,           -- project ID, deployment ID, API key ref
  name            text not null,  -- friendly label
  organisation_id uuid references organisations(id),
  billing_model   text,           -- 'fixed' | 'per-use' | 'tiered'
  fixed_cost_usd  numeric(10,2),  -- monthly fixed (if known)
  is_active       boolean default true,
  notes           text,
  created_at      timestamptz default now()
);

-- Individual cost entries (one per source per day)
CREATE TABLE cost_entries (
  id              bigint generated always as identity primary key,
  source_id       uuid references cost_sources(id) on delete cascade,
  entry_date      date not null,
  cost_usd        numeric(10,2) not null,
  usage_json      jsonb,          -- { requests: 123, tokens: 456, storage_gb: 10 }
  source_data     jsonb,          -- raw API response for audit
  created_at      timestamptz default now(),
  unique(source_id, entry_date)
);

-- Index for time-series queries
create index cost_entries_date on cost_entries (entry_date desc);
create index cost_entries_source on cost_entries (source_id, entry_date);

-- Views

-- Latest month summary by provider
create or replace view v_monthly_by_provider as
select 
  date_trunc('month', entry_date) as month,
  cs.provider,
  sum(ce.cost_usd) as total_usd
from cost_entries ce
join cost_sources cs on cs.id = ce.source_id
group by 1, 2
order by 1 desc, 2;

-- Latest month summary by organisation
create or replace view v_monthly_by_org as
select 
  date_trunc('month', ce.entry_date) as month,
  o.name as organisation,
  cs.provider,
  sum(ce.cost_usd) as total_usd
from cost_entries ce
join cost_sources cs on cs.id = ce.source_id
join organisations o on o.id = cs.organisation_id
group by 1, 2, 3
order by 1 desc, 2, 3;

-- Idle detection (no usage in 7 days, not paused)
create or replace view v_idle_sources as
with latest as (
  select source_id, max(entry_date) as last_entry, 
         sum(cost_usd) as total_cost
  from cost_entries 
  where entry_date > now() - interval '14 days'
  group by source_id
),
activity as (
  select source_id, usage_json->>'requests' as requests
  from cost_entries
  where entry_date > now() - interval '7 days'
)
select cs.id, cs.provider, cs.name, cs.organisation_id,
       l.last_entry, l.total_cost,
       coalesce(a.requests::int, 0) as requests_7d
from cost_sources cs
join latest l on l.source_id = cs.id
left join activity a on a.source_id = cs.id
where cs.is_active = true
  and (a.requests::int = 0 or a.requests is null)
  and cs.id not in (select id from cost_sources where name like '%paused%');
```

---

## 4. Integration with Existing Admin Chrome

The Ops Dashboard reuses the **existing admin layout** at `src/app/admin/layout.tsx` which already provides:
- Persistent left-side navbar (collapses to drawer on mobile)
- Settings link at bottom
- Sign Out at bottom
- Active-route indicator

Ops pages are mounted under `/admin/ops/*` and inherit this chrome automatically.

```
/admin/ops                     → Dashboard overview (index)
/admin/ops/infrastructure      → Supabase, Vercel, GitHub
/admin/ops/apis               → Anthropic, OpenAI, ElevenLabs, Resend
/admin/ops/clients            → Client cost allocation
/admin/ops/sources            → Manage cost sources
```

**Settings** — Reuses existing `/admin/settings` page (no duplicate needed).

---

## 5. Page Layout (per §5 PRODUCT_STANDARDS)

Every page includes an explanatory header:

```tsx
// /admin/ops/page.tsx example
export default function OpsDashboard() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1>Ops Center</h1>
      <p className="mt-1 text-sm text-slate-500">
        Overview of all infrastructure costs across products and clients.
        Tracks spend, detects idle resources, and surfaces budget alerts.
      </p>
      {/* ... content */}
    </div>
  )
}
```

---

## 5. Dashboard Page (`/admin/ops`)

### Header Stats

```
┌─────────────────────────────────────────────────────────────────────┐
│  OPS CENTER                                              Settings │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ THIS MONTH           │  │ LAST MONTH      │  │ TREND        │  │
│  │ $4,847               │  │ $4,312          │  │ +12.4%       │  │
│  │ Total Infrastructure│  │                 │  │              │  │
│  └──────────────────────┘  └──────────────────┘  └──────────────┘  │
│                                                                     │
│  ─── By Provider ─────────────────────────────────────────────────  │
│                                                                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │
│  │ Supabase   │ │ Vercel     │ │ LLM APIs   │ │ Voice      │       │
│  │ $397 (8%)  │ │ $2,100(43%)│ │ $890 (18%) │ │ $340 (7%)  │       │
│  │ ████████░░ │ │ ██████████ │ │ ██████░░░░ │ │ ███░░░░░░░ │       │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘       │
│                                                                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │
│  │ Email      │ │ Code       │ │ Productivity│ │ Other      │       │
│  │ $85 (2%)   │ │ $68 (1%)   │ │ $450 (9%)  │ │ $517 (11%) │       │
│  │ █░░░░░░░░░ │ │ █░░░░░░░░░ │ │ █████░░░░░░ │ │ ██████░░░░ │       │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘       │
│                                                                     │
│  ─── Alerts ──────────────────────────────────────────────────────  │
│                                                                     │
│  ⚠️ 3 idle Supabase projects detected (~$29/mo)                  │
│  ⚠️ Vercel bandwidth at 80% of plan limit                         │
│  ℹ️  JetBrains renewal due in 30 days ($458)                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Provider Breakdown Tables

Each provider section shows:
- Source name (friendly)
- Organisation (internal/client)
- Current month cost
- Usage metrics (requests, tokens, storage)
- Trend (↑↓ vs last month)
- Status badge (active/watch/paused)

---

## 6. Infrastructure Page (`/admin/ops/infrastructure`)

### Supabase Section

```
┌─────────────────────────────────────────────────────────────────────┐
│  SUPABASE PROJECTS                              [Sync Now] [+ Add]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Filter: [All ▼] [Active ▼] [Idle ▼]                               │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ Project        │ Size    │ Requests  │ Est $/mo │ Status      │ │
│  │----------------|---------|-----------|----------|------------│ │
│  │ corp-ai-sol...│ Micro   │ 12,400    │ $9.68    │ ● Active   │ │
│  │ mmcbuild-prod │ Small   │ 45,200    │ $57.50   │ ● Active   │ │
│  │ kira-rho      │ Micro   │ 8,100     │ $9.68    │ ● Active   │ │
│  │ [IDLE] connex │ Micro   │ 0         │ $9.68    │ ○ Watch    │ │
│  │ [PAUSED] test │ —       │ —         │ $0.00    │ ■ Paused   │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  TOTAL: 41 projects | $397/mo | 3 idle                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Vercel Section

Similar table showing deployments, bandwidth, serverless function usage.

---

## 7. APIs Page (`/admin/ops/apis`)

```
┌─────────────────────────────────────────────────────────────────────┐
│  LLM API SPEND                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  This Month: $890 (Anthropic: $650, OpenAI: $180, OpenRouter: $60) │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ Provider     │ This Mo  │ Last Mo  │ Trend │ Top Project     │ │
│  │--------------|-----------|----------|-------|----------------│ │
│  │ Anthropic    │ $650     │ $580     │ +12%  │ Connexions      │ │
│  │ OpenAI       │ $180     │ $195     │ -8%   │ Kira            │ │
│  │ OpenRouter   │ $60      │ $45      │ +33%  │ Various         │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  VOICE AI (ElevenLabs)                                             │
│                                                                     │
│  This Month: $340 | Minutes: 1,240 | Agents: 4                     │
│                                                                     │
│  EMAIL (Resend)                                                     │
│                                                                     │
│  This Month: $85 | Sent: 12,400 | Bounced: 12                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. Clients Page (`/admin/ops/clients`)

```
┌─────────────────────────────────────────────────────────────────────┐
│  CLIENTS                                           [+ Add Client]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ Client      │ Contract    │ Our Cost  │ They Pay  │ Margin   │ │
│  │--------------|-------------|-----------|-----------|----------│ │
│  │ MMC Build    │ Pass-through│ $890/mo   │ $1,500/mo │ +$610    │ │
│  │ Checkpoint   │ Fixed MRR   │ $450/mo   │ $800/mo   │ +$350    │ │
│  │ Factory2Key  │ Build-only │ $2,100    │ $2,100    │ $0       │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  Click client → see breakdown by provider                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 9. Sync Jobs

| Job | Schedule | What it does |
|-----|----------|--------------|
| `cost-sync-supabase` | Daily 6am | Fetch all projects, sizes, activity from Management API |
| `cost-sync-vercel` | Daily 6am | Fetch deployments, bandwidth, functions from Vercel API |
| `cost-sync-anthropic` | Daily 6am | Fetch token usage from Anthropic |
| `cost-sync-openai` | Daily 6am | Fetch token usage from OpenAI |
| `cost-sync-elevenlabs` | Daily 6am | Fetch minutes from ElevenLabs |
| `cost-sync-resend` | Daily 6am | Fetch email volume from Resend |
| `cost-import-bank` | Monthly | Import NAB statement, categorize |

---

## 10. Alert Rules

| Condition | Action |
|-----------|--------|
| Resource idle 7+ days | Add to idle suspects view |
| Cost > 20% vs last month | Show alert on dashboard |
| Budget threshold (e.g., $5k/mo) | Alert if exceeded |
| New source added | Notify to categorize |

---

## 11. Auth & Access (per SUPABASE AUTH PATTERN)

**Page access:** Routes under `/admin/ops/*` are protected by the existing admin middleware which checks `ADMIN_EMAILS` allowlist.

**Data fetching:** Uses `createServerClient` with cookies from `next/headers` (NOT service role key in client components):

```typescript
// src/app/admin/ops/page.tsx
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getData() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n) => cookieStore.get(n)?.value } }
  )
  // ... query data
}
```

**API sync jobs:** Use service role key (server-only, never exposed to client).

---

## 12. Existing AdminNav Integration

The Ops Dashboard pages reuse `src/components/admin/AdminNav.tsx` which provides:
- Brand header → `/admin/methodology`
- Nav items: Methodology, Pipeline, Product Factory, Reviews
- Footer: Settings (existing `/admin/settings`), Sign Out
- Mobile: hamburger → drawer

Add Ops to nav items:
```tsx
// src/components/admin/AdminNav.tsx
const NAV_ITEMS = [
  { href: '/admin/methodology', label: 'Methodology', icon: Workflow },
  { href: '/admin/pipeline', label: 'Pipeline', icon: LayoutGrid },
  { href: '/admin/ops', label: 'Ops', icon: CreditCard }, // NEW
  // ...
]
```

---

## 13. Implementation Priority

| Phase | What's Built | Effort |
|-------|--------------|--------|
| **1** | Schema + add Ops link to AdminNav + basic dashboard under `/admin/ops` | 1 day |
| **2** | Supabase sync (Management API) + idle detection | 1 day |
| **3** | Vercel sync + infrastructure page | 1 day |
| **4** | LLM API syncs (Anthropic, OpenAI, ElevenLabs, Resend) | 2 days |
| **5** | Client cost allocation + margins | 1 day |
| **6** | Bank statement import + auto-categorize | 2 days |

**Note:** Phases 1-5 each produce a working deliverable. Don't move to next phase until current is live.

---

## 13. Existing Files (from docs folder)

The earlier `docs/corporate ai solutions dashboard/` folder has:
- `20260602000000_cost_visibility.sql` — Supabase-only schema (partial)
- `compute-pricing.ts` — compute size → $/mo lookup
- `supabase-management.ts` — Management API client
- `route.ts` — cron job for daily sync
- `page.tsx` — standalone page (needs to be integrated)

These should be incorporated into the full Ops Dashboard.
