# Corporate AI Solutions — Project Instructions

## What is this?
Marketing site and SaaS marketplace for Corporate AI Solutions (Longtail AI venture studio). Showcases 17 AI product verticals, handles subscriptions, partner applications, investor inquiries, and voice AI agents.

## Tech Stack
- **Frontend/API**: Next.js 14 (App Router, TypeScript strict, Tailwind CSS)
- **Database**: Supabase (PostgreSQL + Auth + RLS) — Sydney region
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

## Watch out for
- TypeScript strict mode is on
- 4 ElevenLabs voice agents each have unique system prompts — don't merge them
- Stripe has both subscription products AND credit packages
- `constants.ts` is the source of truth for the 17-product portfolio
- Permanent redirect: `/invest` → `/invest-in-the-future-of-ai`
