import Link from 'next/link'
import { ArrowRight, Package } from 'lucide-react'
import OnboardingCoach from '@/components/admin/OnboardingCoach'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// The 14 graded validation fields — EXACT column names on product_validation_status
// (source of truth: ValidationFieldsEditor.tsx + api/admin/pipeline/[productId]/validation
// ALLOWED_FIELDS). A "new idea" is a row with <14 of these populated (INCOMPLETE-SPEC).
// Do NOT add why_now / mvp_url here — those are not graded spec fields.
const SPEC_FIELDS = [
  'promise',
  'distributor',
  'end_user',
  'friction',
  'distributor_outcomes',
  'end_user_outcomes',
  'core_mechanism',
  'icp_geography',
  'icp_partner_type',
  'icp_buyer_title',
  'icp_verticals',
  'icp_company_size',
  'icp_stage',
  'exclusions',
] as const

interface IdeaProduct {
  product_slug: string
  display_name: string | null
  created_at: string
  populated_fields: number
}

async function getIdeas(): Promise<IdeaProduct[]> {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // .returns<>() pins the row shape so supabase-js skips type-level parsing of the
  // dynamic select string (otherwise the row collapses to a ParserError type).
  const { data: products, error } = await supabase
    .from('product_validation_status')
    .select(`product_slug, display_name, created_at, ${SPEC_FIELDS.join(', ')}`)
    .order('created_at', { ascending: false })
    .returns<Record<string, unknown>[]>()

  if (error) {
    console.error('getIdeas: select failed', error.message)
    return []
  }
  if (!products) return []

  return products
    .map((p) => {
      let populated = 0
      for (const field of SPEC_FIELDS) {
        const v = p[field]
        // Uniform presence check: non-null and non-empty (matches the survey's
        // fixed-denominator-14 rule; not the has_* flags).
        if (v !== null && v !== undefined && String(v).trim() !== '') populated++
      }
      return {
        product_slug: p.product_slug as string,
        display_name: (p.display_name as string | null) ?? null,
        created_at: p.created_at as string,
        populated_fields: populated,
      }
    })
    // A new idea = INCOMPLETE-SPEC = fewer than all 14 graded fields present.
    .filter((p) => p.populated_fields < SPEC_FIELDS.length)
}

export default async function NewIdeasPage({
  searchParams,
}: {
  searchParams?: { pending?: string }
}) {
  const ideas = await getIdeas()
  const pendingSlug = searchParams?.pending?.trim() || null

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/admin/pipeline" className="text-blue-400 hover:text-blue-300 text-sm">
              ← Back to Products
            </Link>
          </div>
          <h1 className="text-3xl font-bold mb-2">New product</h1>
          <p className="text-gray-400">
            This is the one door into the pipeline. Name a product and the coach draws out its full
            spec — the promise, the distributor, the end user, the friction it removes. Already built?
            Add its live URL and the coach audits the live build into spec instead of starting from
            scratch. A product gets a card <em>only</em> after it passes the coach&rsquo;s admit gate.
          </p>
        </div>

        {/* Redirected here by the one-door guard — a Pending product tried to open its card. */}
        {pendingSlug && (
          <div className="mb-8 rounded-lg border border-amber-700/50 bg-amber-900/20 p-4">
            <p className="text-amber-200 text-sm font-medium mb-1">
              ⏳ <span className="font-mono">{pendingSlug}</span> is Pending — no card yet.
            </p>
            <p className="text-amber-300/80 text-sm">
              It hasn&rsquo;t passed onboarding. Start (or resume) it with the coach below — enter the
              same name to pick up where it left off. The card opens the moment it passes the admit gate.
            </p>
          </div>
        )}

        {/* The conversational coach (create → converse → admit) */}
        <OnboardingCoach />

        {/* Existing ideas (INCOMPLETE-SPEC rows) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Ideas in progress</h2>
            <span className="text-sm text-gray-400">
              {ideas.length} idea{ideas.length !== 1 ? 's' : ''} not yet admitted
            </span>
          </div>

          {ideas.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
              <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No ideas in progress.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* One-door: a Pending idea has NO card. It resumes in the coach above (enter the
                  same name) — never a link to /admin/pipeline/[slug] (the guard would bounce it
                  straight back here). These rows are a backlog readout, not a way to a card. */}
              {ideas.map((idea) => (
                <div
                  key={idea.product_slug}
                  className="block bg-gray-800 rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-medium">
                        {idea.display_name || idea.product_slug}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {idea.populated_fields}/{SPEC_FIELDS.length} fields populated
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 text-xs text-amber-300 whitespace-nowrap">
                      <ArrowRight className="w-4 h-4" />
                      Resume in the coach above
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: `${(idea.populated_fields / SPEC_FIELDS.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}