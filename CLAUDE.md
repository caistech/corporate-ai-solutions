<!-- SESSION CONTEXT - Injected by Easy Claude Code -->
## Prior Session Context

> Continuing from a recent session. Pick up where you left off.

### Last Session Summary
I can't access `/home/runner/PycharmProjects/` — it's outside the allowed working directory for this session (`/home/runner/work/corporate-ai-solutions/corporate-ai-solutions`).

Could you share the list of projects from PycharmProjects? You can paste:
- The directory listing (output of `ls ~/PycharmProjects/`)
- Or a list of project names/URLs you want added

I'll then update the `PLATFORMS` array in `constants.ts` accordingly.

### Recent Conversation (last 2 turns)
**User (3m ago):** go to constants.ts and update Marketplace with all current Projects in PycharmProjects

**Claude (2m ago):** I can't access `/home/runner/PycharmProjects/` — it's outside the allowed working directory for this session (`/home/runner/work/corporate-ai-solutions/corporate-ai-solutions`).

Could you share the list of projects from PycharmProjects? You can paste:
- The directory listing (output of `ls ~/PycharmProjects/`)
- Or a list of project names/URLs you want added

I'll then update the `PLATFORMS` array in `constants.ts` accordingly.

### Instructions
- Continue from the context above. Do not ask the user to re-explain.
- When you make significant decisions, emit: <!-- MEMORY type=decision importance=8 | description -->
- When you create files, emit: <!-- MEMORY type=file_created importance=6 | path/to/file.ts - description -->
<!-- END SESSION CONTEXT -->
# Corporate AI Solutions — Project Instructions

## What is this?
Marketing site and SaaS marketplace for Corporate AI Solutions (Longtail AI venture studio). Showcases 17 AI product verticals, handles subscriptions, partner applications, investor inquiries, and voice AI agents.

## Tech Stack
- **Frontend/API**: Next.js 14 (App Router, TypeScript strict, Tailwind CSS)
- **Database**: Supabase (PostgreSQL + Auth + RLS) — project `tfgtfhwvrswjvkyeyvsp`, **ap-south-1 (Mumbai)**, not Sydney. Data residency is disclosed in `/privacy`; see the portfolio region audit before claiming AU hosting anywhere.
- **Payments**: Stripe (4 subscription tiers + credit packages)
- **Voice AI**: ElevenLabs (4 agents: Alex, Scout, Morgan, Victoria)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Deployment**: Vercel

## Key Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npm run setup` — Interactive setup wizard (Vercel + Supabase + Stripe + ElevenLabs)
- `npm run db:migrate` — Push migrations to Supabase
- `npm run db:generate` — Generate TypeScript types from DB schema

## Architecture
```
src/
  app/
    page.tsx           # Homepage
    marketplace/       # 17-product marketplace
    studio/            # Portfolio, thesis, invest, join pages
    pricing/           # Subscription tiers
    partner/           # Partnership applications
    deck/              # Investor deck
    launchstack/       # Partner platform
    api/
      checkout/        # Stripe checkout
      webhooks/        # Stripe webhooks
      voice/           # Voice agent API
      investors/       # Investor inquiries
      leads/           # Lead capture
  components/
    layout/            # Header, Footer
    ui/                # Button, Card, etc.
    voice/             # Voice agent widget
  lib/
    constants.ts       # Site config (17 platforms)
    supabase.ts        # Supabase client
    elevenlabs.ts      # Voice AI utilities
```

## Conventions
- Server Components by default
- API routes for external integrations (Stripe, ElevenLabs)
- RLS on all Supabase tables via `get_user_org_id()`
- All secrets in `.env.local`, never inline
- Image optimization via Next.js Image with domain whitelist

## Supabase Auth Pattern (MANDATORY)
**NEVER use service role key for auth checks** — it bypasses cookies and can't detect user sessions.

- Auth checks: Use `createServerClient` with `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `cookies()` from 'next/headers'
- Data operations: Use service role key via `createClient()` from '@supabase/supabase-js'

Example for API routes needing auth:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getUser() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n) => cookieStore.get(n)?.value, set() {}, remove() {} } }
  )
  return supabase.auth.getUser()
}
```

## Watch out for
- TypeScript strict mode is on
- 4 ElevenLabs voice agents each have unique system prompts — don't merge them
- Stripe has both subscription products AND credit packages
- `constants.ts` is the source of truth for the 17-product portfolio
- Permanent redirect: `/invest` → `/invest-in-the-future-of-ai`

## DEBUGGING STANDARD (MANDATORY)
**Default strategy: Preemptively add logging at every step so issues are traceable without iterative add-test-add cycles.**

- Add console.log at every decision point in API routes (before DB calls, after, before returns)
- Include relevant context in logs: `{ action: 'name', input: x, output: y, userId: z }`
- Log the same thing in multiple places to trace full flow (e.g., PATCH before update, PATCH result, GET returns)
- Never remove useful debug logs — if they're helping now, they'll help again
- Use structured log prefixes: `[PATCH]`, `[GET]`, `[VALIDATE]`, `[TEST]` for easy grep filtering
- This applies to ALL new code: APIs, components, utilities
