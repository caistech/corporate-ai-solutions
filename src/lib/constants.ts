import { Platform, PricingTier, NavItem, VoiceAgentConfig } from '@/types'

// Site info
export const SITE = {
  name: 'Corporate AI Solutions',
  tagline: "Got a problem? We've probably solved it. If not, let's build it together.",
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://corporateaisolutions.com',
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
      description: 'Modular construction consultancy. 30+ years of building expertise.',
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

// Navigation
export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Solutions',
    href: '/solutions',
    children: [
      { label: 'All Solutions', href: '/solutions' },
      { label: 'High-Stakes Performance', href: '/solutions#performance' },
      { label: 'Business Intelligence', href: '/solutions#intelligence' },
      { label: 'Industry Solutions', href: '/solutions#industry' },
    ],
  },
  { label: 'Partner', href: '/partner' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Community', href: '/community' },
  {
    label: 'About',
    href: '/about',
    children: [
      { label: 'Our Story', href: '/about' },
      { label: 'Voice AI Approach', href: '/voice-ai' },
      { label: 'Investors', href: '/invest-in-the-future-of-ai' },
    ],
  },
]

// All platforms - Parent/Child Structure
// Parents are the main platforms to visit
// Children are examples of white-label output from generators

export const PLATFORMS: Platform[] = [
  // ============================================
  // PARENT PLATFORMS (Public Landing Pages)
  // ============================================

  // Voice Coaching Suite
  {
    id: 'rehearsals-ai',
    name: 'Rehearsals AI',
    slug: 'rehearsals-ai',
    tagline: 'The suite of AI voice coaching verticals',
    problem: 'High-stakes conversations need practice',
    description: 'Our platform generation model for AI voice coaching. Multiple verticals built and ready to spin up for any industry that needs conversation practice.',
    url: 'https://rehearsals-ai.vercel.app',
    status: 'live',
    category: 'voice-coaching',
    hasVoiceAI: true,
    featured: true,
    type: 'parent',
    isGenerator: true,
  },
  {
    id: 'raiseready-template',
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
    children: ['raiseready-impact', 'lionhearted', 'ether-software', 'soxton-law', 'msci', 'creative-action', 'coachingyuk', 'long-tail-ai-ventures'],
  },
  {
    id: 'connexions',
    name: 'Connexions',
    slug: 'connexions',
    tagline: 'White-label AI interviewer and researcher panels',
    problem: 'Customer research and interviews don\'t scale',
    description: 'Generator platform for white-label AI voice interviewers. Customer research, user feedback, exit interviews, compliance audits - all with observable quality and measurable performance.',
    url: 'https://connexions-silk.vercel.app',
    status: 'live',
    category: 'generators',
    hasVoiceAI: true,
    featured: true,
    type: 'parent',
    isGenerator: true,
    children: ['universal-interviews'],
  },

  // Business Tools
  {
    id: 'launchready',
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
    id: 'tourlingo',
    name: 'TourLingo',
    slug: 'tourlingo',
    tagline: 'Multi-language tourism platform',
    problem: 'Tour operators struggle with international visitors',
    description: 'Platform for the tourism guiding industry. Multi-language support, booking management, operator portal. Complete dual-app ecosystem for tour operators and travelers.',
    url: 'https://tour-lingo.vercel.app',
    status: 'live',
    category: 'business-tools',
    hasVoiceAI: true,
    type: 'parent',
  },
  {
    id: 'cleanclose',
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

  // ============================================
  // CHILD PLATFORMS (White-Label Examples)
  // ============================================

  // Children of RaiseReady Template
  {
    id: 'raiseready-impact',
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
  {
    id: 'lionhearted',
    name: 'Lionhearted Business Online',
    slug: 'lionhearted',
    tagline: 'Business coaching with AI pitch practice',
    problem: 'Business coaching clients need pitch confidence',
    description: 'White-label RaiseReady for Lionhearted Business Online. Founder supporter version with customized branding and coaching integration.',
    url: 'https://lionhearted-business-online.vercel.app',
    status: 'live',
    category: 'voice-coaching',
    hasVoiceAI: true,
    type: 'child',
    parentId: 'raiseready-template',
  },
  {
    id: 'ether-software',
    name: 'Ether Software',
    slug: 'ether-software',
    tagline: 'Tech founder pitch preparation',
    problem: 'Software founders pitching to investors',
    description: 'White-label RaiseReady for Ether Software. Founder supporter version customized for tech and software companies.',
    url: 'https://ether-software.vercel.app',
    status: 'live',
    category: 'voice-coaching',
    hasVoiceAI: true,
    type: 'child',
    parentId: 'raiseready-template',
  },
  {
    id: 'soxton-law',
    name: 'Soxton Law AI',
    slug: 'soxton-law',
    tagline: 'Legal sector founder support',
    problem: 'LegalTech founders need specialized practice',
    description: 'White-label RaiseReady for Soxton Law. Customized for legal sector founders and law firm innovation teams.',
    url: 'https://soxton-law-ai.vercel.app',
    status: 'live',
    category: 'voice-coaching',
    hasVoiceAI: true,
    type: 'child',
    parentId: 'raiseready-template',
  },
  {
    id: 'msci',
    name: 'MSCI',
    slug: 'msci',
    tagline: 'Investment firm deal flow platform',
    problem: 'Investment firms managing founder outreach',
    description: 'White-label RaiseReady for MSCI. Investor version for managing incoming pitch outreach and founder qualification.',
    url: 'https://msci-lilac.vercel.app',
    status: 'live',
    category: 'voice-coaching',
    hasVoiceAI: true,
    type: 'child',
    parentId: 'raiseready-template',
  },
  {
    id: 'creative-action',
    name: 'Creative Action Consulting',
    slug: 'creative-action',
    tagline: 'Consulting firm founder support',
    problem: 'Consulting clients preparing for investment',
    description: 'White-label RaiseReady for Creative Action Consulting. Customized for their consulting clients preparing for investment rounds.',
    url: 'https://creative-action-consulting.vercel.app',
    status: 'live',
    category: 'voice-coaching',
    hasVoiceAI: true,
    type: 'child',
    parentId: 'raiseready-template',
  },
  {
    id: 'coachingyuk',
    name: 'CoachingYuk',
    slug: 'coachingyuk',
    tagline: 'AI pitch coaching platform',
    problem: 'Founders need accessible pitch practice',
    description: 'White-label RaiseReady for CoachingYuk. AI-powered pitch coaching with customized branding for Ari\'s coaching practice.',
    url: 'https://coachingyuk.vercel.app',
    status: 'live',
    category: 'voice-coaching',
    hasVoiceAI: true,
    type: 'child',
    parentId: 'raiseready-template',
  },
  {
    id: 'long-tail-ai-ventures',
    name: 'Long Tail AI Ventures',
    slug: 'long-tail-ai-ventures',
    tagline: 'Internal AI pitch coaching demo',
    problem: 'Demonstrating RaiseReady capabilities',
    description: 'Internal white-label RaiseReady demo for Long Tail AI Ventures. Showcases the full founder pitch coaching experience.',
    url: 'https://long-tail-ai-ventures.vercel.app',
    status: 'live',
    category: 'voice-coaching',
    hasVoiceAI: true,
    type: 'child',
    parentId: 'raiseready-template',
  },

  // Children of Connexions
  {
    id: 'universal-interviews',
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
]

// Helper functions
export const getParentPlatforms = () => PLATFORMS.filter(p => p.type === 'parent')
export const getChildPlatforms = () => PLATFORMS.filter(p => p.type === 'child')
export const getGeneratorPlatforms = () => PLATFORMS.filter(p => p.isGenerator)
export const getChildrenOf = (parentId: string) => PLATFORMS.filter(p => p.parentId === parentId)
export const getLivePlatforms = () => PLATFORMS.filter(p => p.status === 'live')
export const getFeaturedPlatforms = () => PLATFORMS.filter(p => p.featured)

// Pricing tiers
export const PRICING_TIERS: PricingTier[] = [
  {
    name: 'Community',
    price: 'Free',
    description: 'Join The Easily Distracted. Share problems, find collaborators.',
    features: [
      'Skool community access',
      'Share problems & ideas',
      'Find potential collaborators',
      'Learn in public',
      'No commitment',
    ],
    cta: {
      label: 'Join Free',
      href: SKOOL.url,
    },
    variant: 'default',
  },
  {
    name: 'Starter',
    price: '$49',
    period: '/mo',
    description: 'Access one platform. Perfect for trying out a specific solution.',
    features: [
      '1 platform access',
      'Unlimited usage',
      'Email support',
      'All future updates',
      'Switch platforms monthly',
    ],
    cta: {
      label: 'Get Started',
      href: '/contact?plan=starter',
    },
    variant: 'default',
  },
  {
    name: 'Pro',
    price: '$199',
    period: '/mo',
    description: 'Full access to all platforms. Best value for power users.',
    features: [
      'All platforms',
      'Unlimited usage',
      'Priority support',
      'Early access to new platforms',
      'API access where available',
      'Custom integrations',
    ],
    cta: {
      label: 'Get Full Access',
      href: '/contact?plan=pro',
    },
    variant: 'featured',
  },
  {
    name: 'Partner',
    price: 'Rev Share',
    description: 'Build something new together. You bring the problem, we build the solution.',
    features: [
      'Custom solution built for you',
      'Ongoing revenue share (10-30%)',
      'Your name on the product',
      'Direct collaboration',
      'Built in days, not months',
      'No upfront cost',
    ],
    cta: {
      label: "Let's Talk",
      href: '/partner',
    },
    variant: 'partner',
  },
]

// Voice Agents - IDs populated by setup:elevenlabs script or env vars
// After running `npm run setup:elevenlabs`, agent IDs will be in env vars or elevenlabs-agents.ts

export const VOICE_AGENTS: Record<string, VoiceAgentConfig> = {
  alex: {
    agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ALEX || '',
    name: 'Alex',
    personality: 'Warm and approachable, direct and efficient',
    greeting: "Hey! I'm Alex from Long Tail AI Studio. We build AI platforms fast and cheap. Are you looking to use our existing platforms, or do you have a problem you'd like us to solve?",
    pageContext: 'homepage',
    gender: 'male',
    canRoute: {
      solutions: true,
      partner: true,
      community: true,
      pricing: true,
    },
  },
  scout: {
    agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_SCOUT || '',
    name: 'Scout',
    personality: 'Curious and helpful, knowledgeable about platforms',
    greeting: "Hi, I'm Scout! I help people find the right AI platform for their needs. We've got 17 to choose from. What kind of problem are you trying to solve?",
    pageContext: 'marketplace',
    gender: 'female',
    avatar: '/female_avatar.jpeg',
    canRoute: {
      solutions: true,
      partner: true,
      community: false,
      pricing: true,
    },
  },
  morgan: {
    agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_MORGAN || '',
    name: 'Morgan',
    personality: 'Professional and consultative, deal-savvy',
    greeting: "Hello, I'm Morgan. I handle partnerships, investment inquiries, and team opportunities for the studio. Which of these brings you here today?",
    pageContext: 'business',
    gender: 'female',
    avatar: '/female_avatar.jpeg',
    canRoute: {
      solutions: false,
      partner: true,
      community: true,
      pricing: false,
    },
  },
  victoria: {
    agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_VICTORIA || '',
    name: 'Victoria',
    personality: 'Refined and professional, efficient at qualification',
    greeting: "Hello, I'm Victoria. I help qualify investment inquiries for the Long Tail AI Studio. Are you exploring investment opportunities with us today?",
    pageContext: 'invest',
    gender: 'female',
    avatar: '/female_avatar.jpeg',
    canRoute: {
      solutions: false,
      partner: true,
      community: true,
      pricing: false,
    },
  },
}

// Default agent when specific agent isn't available
export const DEFAULT_AGENT = 'alex'

// Stats for homepage
export const STATS = [
  { number: '19', label: 'Platforms Built' },
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