// Platform/Solution types
export interface Platform {
  id: string
  name: string
  slug: string
  tagline: string
  problem: string
  description: string
  url: string
  status: 'live' | 'building' | 'planned'
  category: 'voice-coaching' | 'business-tools' | 'generators' | 'infrastructure'
  hasVoiceAI: boolean
  featured?: boolean
  type: 'parent' | 'child'
  parentId?: string // For child platforms
  children?: string[] // IDs of child platforms for parents
  isGenerator?: boolean // Can generate white-label versions

  // BYOK / methodology monetisation fields (Phase 1c — added 2026-05-20).
  // All optional; existing entries remain valid without these.
  releaseMode?: 'commercial' | 'byok-free' | 'paid-client' | 'in-migration' | 'placeholder'
  githubUrl?: string // Public repo for byok-free releases
  deployUrl?: string // Vercel Deploy button URL for one-click adoption
  deploymentModes?: Array<'customer-self-serve' | 'vendor-self-deploy'> // CQR-shaped products with multiple deploy modes
  requiredCredentials?: string[] // Services the user must BYOK (Anthropic, Supabase, etc.) — high-level list for the marketplace card
  marketplaceHidden?: boolean // Hide from public marketplace render (e.g. paid-client engagements that live on /clients instead)
}

// Lead types
export interface Lead {
  id?: string
  created_at?: string
  name: string
  email: string
  phone?: string
  company?: string
  source_page: string
  source_agent?: string
  intent: 'subscribe' | 'partner' | 'demo' | 'question' | 'community'
  problem_description?: string
  qualified?: boolean
  notes?: string
}

// Voice conversation types
export interface VoiceConversation {
  id?: string
  created_at?: string
  session_id: string
  agent_name: string
  page: string
  transcript?: Array<{
    role: 'user' | 'agent'
    content: string
    timestamp: string
  }>
  duration_seconds?: number
  outcome?: 'lead_captured' | 'routed' | 'abandoned' | 'faq_answered' | 'community_referred'
  lead_id?: string
}

// Waitlist types
export interface WaitlistEntry {
  id?: string
  created_at?: string
  email: string
  platform: string
  source?: string
}

// Voice agent config
export interface VoiceAgentConfig {
  agentId: string
  name: string
  personality: string
  greeting: string
  pageContext: string
  gender?: 'male' | 'female'
  avatar?: string
  canRoute: {
    solutions: boolean
    partner: boolean
    community: boolean
    pricing: boolean
  }
}

// Page meta types
export interface PageMeta {
  title: string
  description: string
  ogImage?: string
}

// Navigation types
export interface NavItem {
  label: string
  href: string
  children?: NavItem[]
}

// Form state types
export interface FormState {
  isSubmitting: boolean
  isSuccess: boolean
  isError: boolean
  message?: string
}
