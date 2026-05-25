import { Platform, NavItem, VoiceAgentConfig } from '@/types'

// Site info
export const SITE = {
  name: 'Corporate AI Solutions',
  tagline: "The factory that builds AI companies. One founder. Zero employees.",
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://corporate-ai-solutions.vercel.app',
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'hello@corporateaisolutions.com',
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || '+61402612471',
  phoneFormatted: '+61 402 612 471',
  company: 'Global Buildtech Australia Pty Ltd',
  abn: '54 672 395 685',
  location: 'Brisbane, Queensland, Australia',
}

// Founder info
export const FOUNDER = {
  name: 'Dennis McMahon',
  title: 'Founder & CEO',
  linkedin: 'https://www.linkedin.com/in/denniskl/',
  calendly: 'https://www.calendly.com/mcmdennis',
  youtube: 'https://www.youtube.com/@globalbuildtech',
  github: 'https://github.com/dennissolver',
  githubRepos: 'https://github.com/dennissolver?tab=repositories',
  newsletters: {
    goOffsite: {
      name: 'Go Offsite',
      url: 'https://www.linkedin.com/newsletters/go-offsite-7016211191035289600/',
      description: 'Insights on modular construction and prefab building methods.',
    },
    biAiAdvantage: {
      name: 'BI AI Advantage',
      url: 'https://www.linkedin.com/newsletters/bi-ai-advantage-7218131009064640512/',
      description: 'Business intelligence meets AI for real business outcomes.',
    },
  },
  companies: {
    globalBuildtech: {
      name: 'Global Buildtech',
      url: 'https://www.global-buildtech.com',
      description: 'Modular construction consultancy. 35+ years of building expertise.',
    },
    factory2key: {
      name: 'Factory2Key',
      url: 'https://www.factory2key.com.au',
      description: 'Turnkey modular homes. SDA specialist. Where Checkpoint was born.',
    },
  },
}

// Skool community
export const SKOOL = {
  url: process.env.NEXT_PUBLIC_SKOOL_URL || 'https://www.skool.com/the-easily-distracted-5598',
  name: 'The Easily Distracted',
  tagline: 'No Funnels. No Gurus. Just Problems Worth Solving.',
  description: 'A community for late-night thinkers, chaos navigators, and real-world fixers who can\'t ignore a problem once they see it.',
}

// Navigation — single source of truth for the rendered nav (consumed by
// `app/layout.tsx` via the @caistech/corporate-components <CorporateHeader />).
// Flat shape because CorporateHeader does not support dropdowns; secondary
// pages live in FOOTER_LINKS below.
export const NAV_ITEMS: NavItem[] = [
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Engagement', href: '/engagement' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Studio', href: '/studio' },
  { label: 'Community', href: '/community' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

// Secondary navigation — rendered in the footer via CorporateFooter's `extraLinks`.
// Pages that are real but don't need to compete for primary-nav real-estate.
export const FOOTER_LINKS: NavItem[] = [
  { label: 'Clients', href: '/clients' },
  { label: 'CQR', href: '/marketplace/cqr' },
  { label: 'Voice AI', href: '/voice-ai' },
  { label: 'Solutions', href: '/solutions' },
  { label: 'Studio Thesis', href: '/studio/thesis' },
  { label: 'Studio Portfolio', href: '/studio/portfolio' },
  { label: 'Join the Team', href: '/studio/join' },
]

// All platforms - Parent/Child Structure
// Parents are the main platforms to visit
// Children are examples of white-label output from generators

export const PLATFORMS: Platform[] = [
  // ============================================
  // PARENT PLATFORMS (Public Landing Pages)
  // ============================================

  // ----------------------------------------
  // CORE INFRASTRUCTURE LAYER
  // ----------------------------------------

  {
    id: 'platform-trust',
    releaseMode: 'placeholder',
    name: 'Platform Trust',
    slug: 'platform-trust',
    tagline: 'Universal trust, security, and observability for AI platforms',
    problem: 'Production AI agents need security, audit trails, and compliance evidence — none of it comes free',
    description: 'The brakes layer for the entire platform portfolio. Six modules: automated security scanning, agent quality evals, structured audit logging, per-tenant token/cost metering, permission governance with human-in-the-loop gates, and rate limiting. Compliance evidence for Australian Privacy Act, OWASP Top 10, and SOC 2 readiness — installed as @platform-trust/middleware in every product.',
    url: 'https://platform-trust.vercel.app',
    status: 'live',
    category: 'infrastructure',
    hasVoiceAI: false,
    featured: true,
    type: 'parent',
  },
  {
    id: 'pubguard',
    releaseMode: 'placeholder',
    name: 'PubGuard',
    slug: 'pubguard',
    tagline: 'Automated vulnerability scanning and OWASP compliance for AI platforms',
    problem: 'AI products ship to enterprises without documented security posture — buyers demand evidence',
    description: 'The security scanning engine inside Platform Trust. Runs on PR merge, deploy events, and weekly cron: dependency audits, secret exposure checks, API endpoint classification (read/write, auth-required), agent tool permission surface analysis, and the OWASP Top 10 checklist for API surfaces. Outputs severity-graded findings, downloadable PDF compliance reports for buyer sign-off, and public compliance badges.',
    url: 'https://kira-rho.vercel.app/pubguard/scan',
    status: 'live',
    category: 'infrastructure',
    hasVoiceAI: false,
    type: 'parent',
  },

  // ----------------------------------------
  // GENERATOR PLATFORMS
  // ----------------------------------------

  // Voice Coaching Suite
  {
    id: 'rehearsals-ai',
    releaseMode: 'in-migration',
    name: 'Rehearsals AI',
    slug: 'rehearsals-ai',
    tagline: 'The suite of AI voice coaching verticals',
    problem: 'High-stakes conversations need practice',
    description: 'Our platform generation model for AI voice coaching. Multiple verticals built and ready to spin up for any industry that needs conversation practice.',
    url: 'https://rehearsals-ai.vercel.app',
    status: 'live',
    category: 'generators',
    hasVoiceAI: true,
    featured: true,
    type: 'parent',
    isGenerator: true,
  },
  {
    id: 'raiseready-template',
    releaseMode: 'in-migration',
    name: 'RaiseReady Template',
    slug: 'raiseready-template',
    tagline: 'White-label founder/investor platform generator',
    problem: 'Founders need pitch practice, investors need deal flow management',
    description: 'Generator platform for creating white-label versions for founders to get investment-ready and investors to manage incoming pitch outreach. Spin up customized versions in days.',
    url: 'https://raiseready-template.vercel.app',
    status: 'live',
    category: 'generators',
    hasVoiceAI: true,
    featured: true,
    type: 'parent',
    isGenerator: true,
    children: ['raiseready-impact'],
  },
  {
    id: 'connexions',
    releaseMode: 'in-migration',
    name: 'Connexions',
    slug: 'connexions',
    tagline: 'AI-powered survey and interview analysis',
    problem: 'Qualitative research is time-consuming and insights get lost',
    description: 'Generator platform for white-label AI voice interviewers with enhanced AI analysis. Conduct customer research, user feedback, exit interviews, and compliance audits - then let AI extract themes, sentiment, and actionable insights from your surveys and research interviews automatically.',
    url: 'https://connexions-corporate-ai-solutions.vercel.app',
    status: 'live',
    category: 'generators',
    hasVoiceAI: true,
    featured: true,
    type: 'parent',
    isGenerator: true,
    children: [], // universal-interviews dropped 2026-05-26 (engine shell, not a shippable example) — see its entry
  },
  // UniversalLingo - Real-time Translation Generator
  {
    id: 'universallingo',
    releaseMode: 'in-migration',
    name: 'UniversalLingo',
    slug: 'universallingo',
    tagline: 'Break language barriers in real-time',
    problem: 'Businesses need scalable multilingual communication',
    description: 'Generator platform for real-time AI translation across industries. One core capability—<1s latency translation in 100+ languages—verticalized into industry-specific products. Spin up white-label translation solutions for tourism, healthcare, government, education, hospitality, and more.',
    url: 'https://universal-lingo-marketing.vercel.app',
    status: 'live',
    category: 'generators',
    hasVoiceAI: true,
    featured: true,
    type: 'parent',
    isGenerator: true,
    children: ['tourlingo', 'govlingo', 'censuslingo', 'videolingo', 'hotellingo', 'doctorlingo', 'edulingo', 'personallingo'],
  },

  // ----------------------------------------
  // VOICE COACHING (Non-Generator Parents)
  // ----------------------------------------

  {
    id: 'kira',
    releaseMode: 'in-migration',
    name: 'Kira',
    slug: 'kira',
    tagline: 'Your personalized AI thinking partner',
    problem: 'Generic AI assistants don\'t know your context and make you repeat yourself',
    description: 'Not one AI for everyone — a unique thinking partner built around YOUR specific goal. Whether it\'s career decisions, financial planning, business strategy, or life changes, Kira learns your context through voice conversation and remembers everything. She asks questions before jumping to answers, pushes back when something\'s unclear, and thinks WITH you instead of just answering.',
    url: 'https://kira-rho.vercel.app',
    status: 'live',
    category: 'voice-coaching',
    hasVoiceAI: true,
    featured: true,
    type: 'parent',
    isGenerator: false,
  },

  // ----------------------------------------
  // BUSINESS TOOLS
  // ----------------------------------------

  // FIRST BYOK-FREE RELEASE — Phase 1c of methodology monetisation plan.
  // CQR ships as a public template repo on GitHub with a Vercel Deploy button.
  // Two deployment modes (customer-self-serve / vendor-self-deploy) — one codebase.
  // Sibling: ~/MONETISATION_EXECUTION_PLAN.md, ~/MONETISATION_RULES.md (Rules 9-11),
  // memory: project_cqr_byok_distribution.
  {
    id: 'cqr',
    name: 'Community Question Responder',
    slug: 'cqr',
    tagline: 'Thoughtful drafted replies for community channels. Free, BYOK, your infrastructure.',
    problem: 'Vendor community queues sit unanswered for days; meanwhile, third-party answers get moderated out. Both sides need a tool the channel admin can run themselves.',
    description: 'Polls a community Slack or Discord, classifies incoming questions, retrieves from a vendor-specific knowledge base, drafts a high-quality reply in the operator\'s voice, holds it for one-click approval, posts on approval. Two deployment modes: customer-self-serve (point it at any vendor\'s public surfaces, drafts for you without posting) or vendor-self-deploy (run it in your own community channel, your team approves drafts). One codebase. Same architecture. BYOK across every key — Anthropic, Supabase, Slack, ElevenLabs, OpenAI, Resend. No CAS-owned fallback.',
    url: '/marketplace/cqr',
    status: 'live',
    category: 'business-tools',
    hasVoiceAI: true,
    featured: true,
    type: 'parent',
    releaseMode: 'byok-free',
    githubUrl: 'https://github.com/dennissolver/community-question-responder',
    deployUrl:
      'https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdennissolver%2Fcommunity-question-responder' +
      '&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,' +
      'ANTHROPIC_API_KEY,OPENAI_API_KEY,RESEND_API_KEY,RESEND_FROM_EMAIL,ELEVENLABS_API_KEY,' +
      'CRON_SECRET,NEXT_PUBLIC_APP_URL' +
      '&envDescription=Required+credentials+%E2%80%94+all+BYOK%2C+see+README+for+links' +
      '&envLink=https%3A%2F%2Fgithub.com%2Fdennissolver%2Fcommunity-question-responder%23required-credentials',
    deploymentModes: ['customer-self-serve', 'vendor-self-deploy'],
    requiredStack: ['GitHub', 'Vercel', 'Supabase'],
    requiredCredentials: [
      'ANTHROPIC_API_KEY (or OPENROUTER_API_KEY)',
      'OPENAI_API_KEY (embeddings)',
      'SUPABASE (URL + anon + service-role)',
      'SLACK_BOT_TOKEN + SLACK_SIGNING_SECRET',
      'RESEND_API_KEY',
      'ELEVENLABS_API_KEY (voice agent — auto-provisions agent_id)',
    ],
  },

  {
    id: 'preflight',
    name: 'Preflight',
    slug: 'preflight',
    tagline: 'Drafter-led pre-submission triage for DA drawing sets. BYOK, self-host.',
    problem: 'Drafters discover the same Council-blocking errors set after set; the 5-day round-trip through admin → project owner → AI tools → admin loops the same lessons every quarter.',
    description: 'Drafter drops a PDF; Preflight runs every row of the project\'s accumulated rejection register against the extracted text and project facts, and returns a one-page triage sheet — confirmed OK / needs eyes / hard fails — before the set leaves the drafter\'s desk. Deterministic rules for text / logic / cross-reference checks; tight LLM calls only for manual-check rows (Anthropic Sonnet, or OpenRouter alternative). Per-project KB with Supabase + pgvector; Resend for drafter-link emails and inbound planner / engineer correspondence; Google Drive ingestion via OAuth. Every metered API call lands on the operator\'s account, not ours. Two deployment modes: project-owner-self-host (your own infra, your own register) or drafting-firm-self-host (one deployment across multiple parallel projects).',
    url: 'https://preflight-phi.vercel.app',
    status: 'live',
    category: 'business-tools',
    hasVoiceAI: false,
    featured: true,
    type: 'parent',
    releaseMode: 'byok-free',
    githubUrl: 'https://github.com/dennissolver/preflight',
    deployUrl:
      'https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdennissolver%2Fpreflight' +
      '&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,' +
      'ANTHROPIC_API_KEY,OPENAI_API_KEY,RESEND_API_KEY,RESEND_FROM_EMAIL,' +
      'GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,CRON_SECRET,NEXT_PUBLIC_APP_URL' +
      '&envDescription=Required+credentials+%E2%80%94+all+BYOK%2C+see+README+for+links' +
      '&envLink=https%3A%2F%2Fgithub.com%2Fdennissolver%2Fpreflight%23required-credentials',
    deploymentModes: ['project-owner-self-host', 'drafting-firm-self-host'],
    requiredStack: ['GitHub', 'Vercel', 'Supabase'],
    requiredCredentials: [
      'ANTHROPIC_API_KEY (or OPENROUTER_API_KEY)',
      'OPENAI_API_KEY (embeddings)',
      'SUPABASE (URL + anon + service-role)',
      'RESEND_API_KEY + RESEND_FROM_EMAIL',
      'GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET (Drive ingestion OAuth)',
      'CRON_SECRET (Vercel cron auth)',
    ],
  },

  {
    id: 'launchready',
    releaseMode: 'in-migration',
    name: 'LaunchReady',
    slug: 'launchready',
    tagline: 'Voice-guided IP protection for founders',
    problem: 'Founders\' IP is vulnerable - 72% have unprotected assets',
    description: 'Protect your ideas before someone else does. Voice-guided IP discovery, automatic evidence capture from GitHub, trademark monitoring, patent deadline tracking, and lawyer-ready packages. Free tier with shared infrastructure, $30/mo for dedicated isolation.',
    url: 'https://launchready-ruby.vercel.app',
    status: 'live',
    category: 'business-tools',
    hasVoiceAI: true,
    featured: true,
    type: 'parent',
  },
  {
    id: 'dealfindrs',
    releaseMode: 'in-migration',
    name: 'DealFindrs',
    slug: 'dealfindrs',
    tagline: 'AI-powered property deal assessment',
    problem: 'Property developers waste time on bad deals',
    description: 'Platform for property developers to easily assess deals using AI voice coaches and analysis tools. Fast filtering, smart recommendations, voice-powered deal evaluation.',
    url: 'https://deal-findrs.vercel.app',
    status: 'live',
    category: 'business-tools',
    hasVoiceAI: true,
    featured: true,
    type: 'parent',
  },
  {
    id: 'tenderwatch',
    releaseMode: 'in-migration',
    name: 'TenderWatch',
    slug: 'tenderwatch',
    tagline: 'Government tender monitoring made easy',
    problem: 'Australian businesses miss relevant government tenders',
    description: 'Makes monitoring government tenders in Australia easy and convenient. AI-powered matching, automated alerts, never miss a relevant RFP again.',
    url: 'https://tenderwatch-alpha.vercel.app',
    status: 'live',
    category: 'business-tools',
    hasVoiceAI: false,
    type: 'parent',
  },
  {
    id: 'checkpoint',
    releaseMode: 'paid-client',
    name: 'Checkpoint',
    slug: 'checkpoint',
    tagline: 'Modular industry project management',
    problem: 'Generic project tools don\'t fit industry workflows',
    description: 'Modular industry project management and execution platform. Configurable for construction, manufacturing, services - any industry with complex project workflows.',
    url: 'https://f2k-checkpoint-new.vercel.app',
    status: 'live',
    category: 'business-tools',
    hasVoiceAI: false,
    type: 'parent',
  },
  {
    id: 'cleanclose',
    releaseMode: 'in-migration',
    name: 'CleanClose',
    slug: 'cleanclose',
    tagline: 'Help businesses close down cleanly',
    problem: 'Business shutdown is messy and stressful',
    description: 'Platform to help businesses close down cleanly. Compliance checklists, stakeholder communication, asset management, legal requirements - all in one place.',
    url: 'https://corporateaisolutions.com/cleanclosewaitlist/',
    status: 'building',
    category: 'business-tools',
    hasVoiceAI: false,
    type: 'parent',
  },
  {
    id: 'f2k-fund-tokenisation',
    releaseMode: 'in-migration',
    name: 'F2K Fund Tokenisation',
    slug: 'f2k-fund-tokenisation',
    tagline: 'Tokenised Australian housing fund on Ethereum',
    problem: 'Property investment is illiquid and inaccessible to many investors',
    description: 'Tokenised Australian housing fund using ERC-3643 security tokens on Ethereum. Wholesale investor onboarding, KYC verification, USDC subscriptions, token minting, NAV publication, and quarterly distributions. Full investor portal and admin console.',
    url: 'https://f2-k-fund-tokenisation.vercel.app',
    status: 'live',
    category: 'business-tools',
    hasVoiceAI: false,
    featured: true,
    type: 'parent',
  },
  {
    id: 'storyverse',
    releaseMode: 'in-migration',
    name: 'StoryVerse',
    slug: 'storyverse',
    tagline: 'AI-powered personalised children\'s books',
    problem: 'Generic children\'s books don\'t grow with your child',
    description: 'AI-powered personalised children\'s books that evolve from ages 0-18. Story memory that grows with your child, parent voice cloning for narration in your own voice, and an 18-year journey ending with a graduation anthology. Every book is unique.',
    url: 'https://story-verse-two.vercel.app/',
    status: 'live',
    category: 'business-tools',
    hasVoiceAI: true,
    featured: true,
    type: 'parent',
  },
  {
    id: 'outreachready',
    releaseMode: 'in-migration',
    name: 'OutreachReady',
    slug: 'outreachready',
    tagline: 'AI-powered strategic outreach with voice coaching',
    problem: 'Cold outreach is generic and ineffective',
    description: 'Strategic outreach platform with voice-guided message crafting, AI personalisation, and multi-channel support across LinkedIn, email, and WhatsApp. Strategic journey framework with funnel stages and relationship goals.',
    url: 'https://outreach-ready.vercel.app',
    status: 'live',
    category: 'business-tools',
    hasVoiceAI: true,
    type: 'parent',
  },
  {
    id: 'rnd-tax-tracker',
    releaseMode: 'in-migration',
    name: 'R&D Tax Tracker',
    slug: 'rnd-tax-tracker',
    tagline: 'R&D tax eligibility work recording',
    problem: 'Businesses miss R&D tax credits because they don\'t track eligible work',
    description: 'Platform for recording and tracking work eligible for R&D tax credits. Capture activities, link to eligible categories, and generate compliance-ready documentation for your tax agent.',
    url: 'https://r-and-d-tax-eligibility-work-recording-corporate-ai-solutions.vercel.app',
    status: 'live',
    category: 'business-tools',
    hasVoiceAI: false,
    type: 'parent',
  },
  {
    id: 'ndis-sda-automate',
    releaseMode: 'in-migration',
    marketplaceHidden: true, // Dropped 2026-05-26 (GTM landing-story audit): bare slug hijacked (serves "PF Platform — Property Friends"); single-client instance, no generic product story. Relist when pointed at a product page.
    name: 'NDIS SDA Automate',
    slug: 'ndis-sda-automate',
    tagline: 'NDIS & SDA compliance automation',
    problem: 'NDIS providers drown in compliance paperwork',
    description: 'Automation platform for NDIS and SDA compliance. Streamline participant documentation, service agreements, reporting requirements, and audit preparation for disability service providers.',
    // HIJACKED 2026-05-20: ndissda-automate.vercel.app now returns
    // "PF Platform — Property Friends" (external Vercel user). The bare slug
    // is no longer owned by this team. Team-canonical URL is 401-protected.
    // Resolution gated on custom domain or auth-protection change.
    url: 'https://ndissda-automate.vercel.app',
    status: 'live',
    category: 'business-tools',
    hasVoiceAI: false,
    type: 'parent',
  },
  {
    id: 'smartboard',
    releaseMode: 'in-migration',
    name: 'SmartBoard',
    slug: 'smartboard',
    tagline: 'Intelligent airline boarding management',
    problem: 'Gate congestion wastes time and frustrates passengers',
    description: 'Intelligent airline boarding management system that eliminates gate congestion by assigning passengers specific boarding time windows and overhead bin locations based on carry-on luggage and seat number. Self-configuring bin allocation with no airline API required.',
    url: 'https://smart-board-eight.vercel.app/',
    status: 'live',
    category: 'business-tools',
    hasVoiceAI: false,
    type: 'parent',
  },
  {
    id: 'storefront-mcp',
    releaseMode: 'in-migration',
    name: 'Storefront MCP',
    slug: 'storefront-mcp',
    tagline: 'Agent marketplace via MCP protocol',
    problem: 'AI agents can\'t discover and book real-world services',
    description: 'MCP server exposing the Agent Storefront seller catalog as callable tools for any MCP-compatible agent. Agents can search sellers, check availability, and create bookings — bridging AI assistants to real-world service providers.',
    url: 'https://storefront-mcp-eight.vercel.app/',
    status: 'live',
    category: 'business-tools',
    hasVoiceAI: false,
    type: 'parent',
  },
  {
    id: 'easy-claude-code',
    releaseMode: 'in-migration',
    name: 'Easy Claude Code',
    slug: 'easy-claude-code',
    tagline: 'Browser dashboard for Claude Code sessions',
    problem: 'Claude Code terminal sessions are ephemeral — context dies when you close them',
    description: 'Browser dashboard for managing local Claude Code sessions. Session persistence, project tracking, and remote control via Dispatch. Wraps the raw CLI tool in a persistent, context-aware interface with mobile-triggerable workflows.',
    url: 'https://easy-claude-code.vercel.app',
    status: 'live',
    category: 'business-tools',
    hasVoiceAI: false,
    type: 'parent',
  },

  {
    id: 'disaster-support',
    releaseMode: 'in-migration',
    name: 'Disaster Support',
    slug: 'disaster-support',
    tagline: 'Emergency aid and disaster response coordination',
    problem: 'Disaster response is chaotic and poorly coordinated',
    description: 'Emergency aid and disaster response coordination platform with voice capabilities. Connect affected communities with resources, volunteers, and support services in real-time during natural disasters and emergencies.',
    url: 'https://disaster-support.vercel.app',
    status: 'live',
    category: 'business-tools',
    hasVoiceAI: true,
    type: 'parent',
  },
  {
    id: 'partner-pilot',
    releaseMode: 'in-migration',
    name: 'PartnerPilot',
    slug: 'partner-pilot',
    tagline: 'AI-powered channel partner discovery',
    problem: 'Finding the right channel partners is time-consuming and hit-or-miss',
    description: 'Helps founders find channel partners, enrich contacts, draft outreach, send emails, and track replies. Five-stage hybrid pipeline with Brave Search, Hunter.io email lookup, Claude AI drafting, and email tracking.',
    url: 'https://partner-pilot-corporate-ai-solutions.vercel.app',
    status: 'live',
    category: 'business-tools',
    hasVoiceAI: false,
    type: 'parent',
  },
  {
    id: 'investor-pilot',
    releaseMode: 'in-migration',
    name: 'InvestorPilot',
    slug: 'investor-pilot',
    tagline: 'AI-powered investor relations and deal flow',
    problem: 'Founders struggle to manage investor relationships and deal flow effectively',
    description: 'AI-powered investor relations platform. Manage deal flow, track investor conversations, prepare pitch materials, and streamline the fundraising process with intelligent automation.',
    url: 'https://investor-pilot-pi.vercel.app',
    status: 'live',
    category: 'business-tools',
    hasVoiceAI: false,
    type: 'parent',
  },
  {
    id: 'property-services',
    releaseMode: 'placeholder',
    name: 'Property Services',
    slug: 'property-services',
    tagline: 'Shared property intelligence platform',
    problem: 'Property products duplicate data and infrastructure',
    description: 'Shared property intelligence platform powering F2K, DealFindrs, and MMC Build. Supabase edge functions, TypeScript SDK, 20 LGA databases, and QLD Globe integration. One data layer for all property-related ventures.',
    url: 'https://property-services-kappa.vercel.app/',
    status: 'live',
    category: 'business-tools',
    hasVoiceAI: false,
    type: 'parent',
  },
  {
    id: 'mmcbuild',
    releaseMode: 'paid-client',
    marketplaceHidden: true, // Lives on /clients (Live Commercial Contract); not for public marketplace
    name: 'MMC Build',
    slug: 'mmcbuild',
    tagline: 'Modern methods of construction compliance & management',
    problem: 'MMC projects are buried in compliance, drawings, and document chaos',
    description: 'Property compliance and construction management platform for modern methods of construction. 3D visualization, document processing, and project workflows tailored to modular and prefab builds.',
    // Scrubbed 2026-05-20: was mmcbuild.vercel.app, which now returns "MMC
    // Minting dApp" (external crypto project). mmcbuild-webapp.vercel.app
    // is the team-owned alias that still serves the right content publicly.
    url: 'https://mmcbuild-webapp.vercel.app',
    status: 'live',
    category: 'business-tools',
    hasVoiceAI: false,
    type: 'parent',
  },
  {
    id: 'mova',
    releaseMode: 'in-migration',
    name: 'Mova',
    slug: 'mova',
    tagline: 'Voice-powered multilingual mobility',
    problem: 'Transport providers struggle to serve non-English-speaking riders',
    description: 'AI-powered multi-language mobility and transportation platform. Voice agent handles bookings, navigation, and rider communication in any language — with maps integration and real-time coordination.',
    // Scrubbed 2026-05-20: was mova.vercel.app, which returns "Self Tutor"
    // (external). mova-pi.vercel.app is the team-owned disambiguated alias
    // that still serves the right content publicly.
    url: 'https://mova-pi.vercel.app',
    status: 'live',
    category: 'business-tools',
    hasVoiceAI: true,
    type: 'parent',
  },
  {
    id: 'lingopure-ai',
    releaseMode: 'in-migration',
    marketplaceHidden: true, // Dropped 2026-05-26 (GTM landing-story audit): public tile pointed at a self-disowning demo ("not the real service"). Relist when re-routed to the real LingoPure or the demo owns its story.
    name: 'LingoPure AI',
    slug: 'lingopure-ai',
    tagline: 'AI-first business English platform',
    problem: 'Business English learners need real conversation practice, not textbooks',
    description: 'AI-first business English learning platform with placement assessment, ClassIn integration, and voice agent practice. Students get adaptive lessons and conversation reps with an ElevenLabs-powered tutor.',
    url: 'https://lingo-pure-ai.vercel.app',
    status: 'live',
    category: 'voice-coaching',
    hasVoiceAI: true,
    type: 'parent',
  },
  {
    id: 'hairstylist-ai',
    releaseMode: 'in-migration',
    name: 'HairStylist AI',
    slug: 'hairstylist-ai',
    tagline: 'In-chair AI consultation for stylists',
    problem: 'Clients can\'t visualize a new cut before committing — and stylists lose time on miscommunication',
    description: 'In-chair consultation tool for hair stylists. Take a selfie, generate AI previews of proposed cuts and styles, and align with the client before the first snip. Reduces re-dos and builds confidence in the chair.',
    url: 'https://hair-stylist-ai.vercel.app',
    status: 'live',
    category: 'business-tools',
    hasVoiceAI: false,
    type: 'parent',
  },
  {
    id: 'f2k-offshore-modular',
    releaseMode: 'in-migration',
    name: 'F2K Offshore Modular',
    slug: 'f2k-offshore-modular',
    tagline: 'Pre-vetted offshore modular manufacturer marketplace',
    problem: 'Australian housing buyers can\'t safely source offshore modular manufacturers',
    description: 'Two-sided platform connecting Australian housing buyers with pre-vetted offshore modular manufacturers. Prequalification, compliance verification, and structured deal flow between buyer and factory.',
    url: 'https://f2-k-offshore-modular.vercel.app',
    status: 'live',
    category: 'business-tools',
    hasVoiceAI: false,
    type: 'parent',
  },
  {
    id: 'f2k-projects',
    releaseMode: 'in-migration',
    name: 'Factory2Key Projects',
    slug: 'f2k-projects',
    tagline: 'Public registration of interest for Factory2Key residential developments',
    problem: 'Purchaser-facing project marketing must be cleanly separated from wholesale-investor fund content to manage ASIC/AFSL exposure',
    description: 'Real-estate marketing site for Factory2Key residential developments. Homepage listing current developments, per-project pages with site plans and registration forms, and API routes that send registrant + admin notifications. Deliberately carved out from the fund tokenisation site so purchaser surfaces stay free of any financial-product content. Separate Supabase project, Resend transactional email, and optional GHL CRM forwarding.',
    url: 'https://f2k-projects.vercel.app',
    status: 'live',
    category: 'business-tools',
    hasVoiceAI: false,
    type: 'parent',
  },
  {
    id: 'leadspark',
    releaseMode: 'in-migration',
    name: 'LeadSpark',
    slug: 'leadspark',
    tagline: 'Embeddable AI lead-capture chat widget',
    problem: 'Static contact forms convert poorly and waste warm visitor intent',
    description: 'Multi-tenant lead-capture platform with an embeddable chat widget, voice-enabled qualification, knowledge-base-aware responses, and a tenant portal for lead triage. Drop the widget on any site, capture qualified leads, and route them to your CRM.',
    // NOT-OWNED 2026-05-20: leadspark-tenant.vercel.app returns 404. No
    // team-owned alias active. Resolution gated on re-deploy or custom domain.
    url: 'https://leadspark-tenant.vercel.app',
    status: 'live',
    category: 'business-tools',
    hasVoiceAI: true,
    type: 'parent',
  },
  {
    id: 'omq-outreach',
    releaseMode: 'in-migration',
    name: 'OMQ Outreach',
    slug: 'omq-outreach',
    tagline: 'AI-powered procurement contact discovery and outreach',
    problem: 'Reaching named procurement decision-makers at scale is slow, manual, and brittle',
    description: 'Procurement-focused outreach pipeline: discover named contacts at target organisations via Brave Search and Claude scoring, enrich verified emails through Hunter.io, draft personalised email and LinkedIn copy, send via Resend, and triage replies into a managed cohort queue. Purpose-built for the F2K Offshore Modular Qualified Australian Market Validation campaign.',
    // Scrubbed 2026-05-20: was omq-outreach.vercel.app, which returns the
    // default "Create Next App" template. omq.vercel.app is the team-owned
    // alias that serves the right content publicly.
    url: 'https://omq.vercel.app',
    status: 'live',
    category: 'business-tools',
    hasVoiceAI: false,
    type: 'parent',
  },
  {
    id: 'aiftis',
    releaseMode: 'in-migration',
    marketplaceHidden: true, // Dropped 2026-05-26 (GTM landing-story audit): page is a "working sketch — not for distribution"; not a shippable product. Relist when it's a real product.
    name: 'AIFTIS Recognition Rail',
    slug: 'aiftis',
    tagline: 'Cross-border professional credential infrastructure for ASEAN MRA signatories',
    problem: 'Professionals face 12–18 months of redundant verification when seeking work across ASEAN borders',
    description: 'Trust infrastructure layer above credentialing providers — enables associations to issue, and regulators to verify, portable professional credentials across ASEAN Mutual Recognition Agreement nations. Cryptographic credential wallets, regulator verification portals, and instant access to portable credentials anchored in regional qualification frameworks. Cuts cross-border verification from 12–18 months to 4–6 weeks while preserving each nation\'s regulatory sovereignty.',
    url: 'https://aiftis-demo.vercel.app',
    status: 'live',
    category: 'business-tools',
    hasVoiceAI: false,
    type: 'parent',
  },

  // ============================================
  // CHILD PLATFORMS (White-Label Examples)
  // ============================================

  // ----------------------------------------
  // Children of RaiseReady Template
  // ----------------------------------------

  {
    id: 'raiseready-impact',
    releaseMode: 'in-migration',
    name: 'RaiseReady Impact',
    slug: 'raiseready-impact',
    tagline: 'AI pitch coaching for impact founders',
    problem: 'Impact founders need specialized pitch practice',
    description: 'Live platform for the founder/investor impact sector. Practice pitches with AI investors focused on impact metrics, ESG, and social returns.',
    url: 'https://raiseready-six.vercel.app',
    status: 'live',
    category: 'voice-coaching',
    hasVoiceAI: true,
    type: 'child',
    parentId: 'raiseready-template',
  },

  // ----------------------------------------
  // Children of Connexions
  // ----------------------------------------

  {
    id: 'universal-interviews',
    releaseMode: 'in-migration',
    marketplaceHidden: true, // Dropped 2026-05-26 (GTM landing-story audit): engine shell ("Loading…"), not an end-user product; the value lives in its parent Connexions.
    name: 'Universal Interviews',
    slug: 'universal-interviews',
    tagline: 'AI-powered interview panels',
    problem: 'Scaling customer research interviews',
    description: 'Generated from Connexions. AI interviewer panels for customer research, user feedback, and market validation at scale.',
    url: 'https://universal-interviews.vercel.app',
    status: 'live',
    category: 'voice-coaching',
    hasVoiceAI: true,
    type: 'child',
    parentId: 'connexions',
  },

  // ----------------------------------------
  // Children of UniversalLingo
  // ----------------------------------------

  {
    id: 'tourlingo',
    releaseMode: 'in-migration',
    name: 'TourLingo',
    slug: 'tourlingo',
    tagline: 'Real-time translation for tour groups',
    problem: 'Tour operators struggle with international visitors',
    description: 'Multi-language platform for tourism. Real-time translation, booking management, operator portal. Complete dual-app ecosystem for tour operators and travelers.',
    url: 'https://tour-lingo.vercel.app',
    status: 'live',
    category: 'business-tools',
    hasVoiceAI: true,
    type: 'child',
    parentId: 'universallingo',
  },
  {
    id: 'govlingo',
    releaseMode: 'in-migration',
    name: 'GovLingo',
    slug: 'govlingo',
    tagline: 'Multilingual government service access',
    problem: 'Government services inaccessible to non-English speakers',
    description: 'AI translation platform for government agencies. Enable multilingual access to public services, forms, and citizen communications.',
    url: 'https://universal-lingo-marketing.vercel.app/govlingo',
    status: 'building',
    category: 'business-tools',
    hasVoiceAI: true,
    type: 'child',
    parentId: 'universallingo',
  },
  {
    id: 'censuslingo',
    releaseMode: 'in-migration',
    name: 'CensusLingo',
    slug: 'censuslingo',
    tagline: 'Multilingual census operations support',
    problem: 'Census data collection limited by language barriers',
    description: 'AI translation for large-scale census and survey operations. Enable accurate data collection across all language communities.',
    url: 'https://universal-lingo-marketing.vercel.app/censuslingo',
    status: 'building',
    category: 'business-tools',
    hasVoiceAI: true,
    type: 'child',
    parentId: 'universallingo',
  },
  {
    id: 'videolingo',
    releaseMode: 'in-migration',
    name: 'VideoLingo',
    slug: 'videolingo',
    tagline: 'Real-time translation for video calls',
    problem: 'Remote teams struggle with multilingual communication',
    description: 'AI-powered real-time translation for video conferencing. Break language barriers in Zoom, Teams, and any video platform.',
    url: 'https://universal-lingo-marketing.vercel.app/videolingo',
    status: 'building',
    category: 'business-tools',
    hasVoiceAI: true,
    type: 'child',
    parentId: 'universallingo',
  },
  {
    id: 'hotellingo',
    releaseMode: 'in-migration',
    name: 'HotelLingo',
    slug: 'hotellingo',
    tagline: 'Guest communication for hospitality',
    problem: 'Hotels struggle to serve international guests',
    description: 'AI translation platform for hotels and hospitality. Enable seamless guest communication, concierge services, and room service in any language.',
    url: 'https://universal-lingo-marketing.vercel.app/hotellingo',
    status: 'building',
    category: 'business-tools',
    hasVoiceAI: true,
    type: 'child',
    parentId: 'universallingo',
  },
  {
    id: 'doctorlingo',
    releaseMode: 'in-migration',
    name: 'DoctorLingo',
    slug: 'doctorlingo',
    tagline: 'Medical interpretation made accessible',
    problem: 'Healthcare providers can\'t communicate with non-English patients',
    description: 'AI medical interpretation platform. HIPAA-aware translation for patient consultations, medical history, and care instructions.',
    url: 'https://universal-lingo-marketing.vercel.app/doctorlingo',
    status: 'building',
    category: 'business-tools',
    hasVoiceAI: true,
    type: 'child',
    parentId: 'universallingo',
  },
  {
    id: 'edulingo',
    releaseMode: 'in-migration',
    name: 'EduLingo',
    slug: 'edulingo',
    tagline: 'Classroom translation for inclusive education',
    problem: 'Schools can\'t support non-English speaking students and parents',
    description: 'AI translation for education. Real-time classroom translation, parent-teacher communication, and multilingual learning materials.',
    url: 'https://universal-lingo-marketing.vercel.app/edulingo',
    status: 'building',
    category: 'business-tools',
    hasVoiceAI: true,
    type: 'child',
    parentId: 'universallingo',
  },
  {
    id: 'personallingo',
    releaseMode: 'in-migration',
    name: 'PersonalLingo',
    slug: 'personallingo',
    tagline: 'Your personal interpreter',
    problem: 'Individuals need on-demand translation for daily life',
    description: 'Personal AI interpreter in your pocket. Real-time translation for travel, shopping, appointments, and everyday conversations.',
    url: 'https://universal-lingo-marketing.vercel.app/personallingo',
    status: 'building',
    category: 'business-tools',
    hasVoiceAI: true,
    type: 'child',
    parentId: 'universallingo',
  },
]

// Helper functions
export const getParentPlatforms = () => PLATFORMS.filter(p => p.type === 'parent')
export const getChildPlatforms = () => PLATFORMS.filter(p => p.type === 'child')
export const getGeneratorPlatforms = () => PLATFORMS.filter(p => p.isGenerator)
export const getChildrenOf = (parentId: string) => PLATFORMS.filter(p => p.parentId === parentId)
export const getLivePlatforms = () => PLATFORMS.filter(p => p.status === 'live')
export const getFeaturedPlatforms = () => PLATFORMS.filter(p => p.featured)
export const getVoiceAIPlatforms = () => PLATFORMS.filter(p => p.hasVoiceAI && p.type === 'parent')

// Voice Agents — canonical persona is Morgan (consolidated 2026-05-19 per Wave 3 decision).
// One voice across the whole site so a visitor moving between marketplace, pricing,
// engagement, and studio surfaces experiences the same operator voice.
// IDs populated by setup:elevenlabs script or env vars.

export const VOICE_AGENTS: Record<string, VoiceAgentConfig> = {
  morgan: {
    agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_MORGAN || '',
    name: 'Morgan',
    personality: 'Direct, builder-to-builder, no consulting-copy energy',
    greeting: `Hi, I'm Morgan — the voice agent for Corporate AI Solutions. ${PLATFORMS.length} BYOK-first AI products live in the marketplace, free to clone on your own keys. We also run studio-in-residence engagements and technical advisory retainers. What brought you here?`,
    pageContext: 'canonical',
    gender: 'female',
    avatar: '/female_avatar.jpeg',
    canRoute: {
      solutions: true,
      partner: true,
      community: true,
      pricing: true,
    },
  },
}

// Default agent when specific agent isn't available
export const DEFAULT_AGENT = 'morgan'

// Stats for homepage
export const STATS = [
  { number: String(PLATFORMS.length), label: 'Platforms Built' },
  { number: '72h', label: 'Average Build Time' },
  { number: '35+', label: 'Years Experience' },
]

// Process steps
export const PROCESS_STEPS = [
  {
    number: '01',
    title: 'Learn the Problem',
    description: 'Deep dive into your industry, pain points, and existing workflows. We don\'t build generic solutions—we build YOUR solution.',
    time: 'Day 1',
  },
  {
    number: '02',
    title: 'Define the Solution',
    description: 'Map the user journey, identify AI integration points, and architect a system that actually solves the problem—not just looks good in a demo.',
    time: 'Day 1-2',
  },
  {
    number: '03',
    title: 'Build It Fast',
    description: 'Next.js, Vercel, Supabase, Claude AI, ElevenLabs. Modern stack. Rapid iteration. Working software, not wireframes.',
    time: 'Day 2-4',
  },
  {
    number: '04',
    title: 'Ship & Iterate',
    description: 'Deploy to production. Real users. Real feedback. Continuous improvement. Your solution gets better every day.',
    time: 'Day 5+',
  },
]