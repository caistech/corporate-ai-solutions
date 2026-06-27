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
  repoUrl?: string // Public source repo (inspectable/clonable) — distinct from githubUrl's BYOK-clone role. Presence of githubUrl OR repoUrl => the product is "runnable / open" (a visitor can read + clone the source), vs a deployment-only "live landing page".
  trustRecordUrl?: string // Live Platform Trust verification record (/verify/<slug>) — only set where a real scan exists; a trust link must resolve to live state, never a marketing page.
  deployUrl?: string // Vercel Deploy button URL for one-click adoption
  deploymentModes?: Array<
    | 'customer-self-serve' // CQR: end-user clones to monitor any vendor's surfaces
    | 'vendor-self-deploy' // CQR: vendor runs it in their own community channel
    | 'project-owner-self-host' // Preflight: single-project owner runs it for their project
    | 'drafting-firm-self-host' // Preflight: firm runs one deployment across parallel projects
  > // BYOK-free products with multiple deploy audiences
  requiredCredentials?: string[] // Services the user must BYOK (Anthropic, Supabase, etc.) — high-level list for the marketplace card
  requiredStack?: string[] // Platforms the BYOK deploy is opinionated to — e.g. ['GitHub','Vercel','Supabase']. Surfaced on the marketplace card so users know the stack is fixed by design.
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
