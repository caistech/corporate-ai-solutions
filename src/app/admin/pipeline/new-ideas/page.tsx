import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, ArrowRight, Package, Lightbulb } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const SPEC_FIELDS = [
  'promise_statement',
  'distributor_model',
  'end_user',
  'pain_point',
  'competitors',
  'differentiation',
  'pricing_model',
  'go_to_market',
  'mvp_url',
  'why_now',
  'revenue_model',
  'target_market',
  'competitive_advantage',
  'success_metrics'
]

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

  const { data: products } = await supabase
    .from('product_validation_status')
    .select('product_slug, display_name, created_at, promise_statement, distributor_model, end_user, pain_point, competitors, differentiation, pricing_model, go_to_market, mvp_url, why_now, revenue_model, target_market, competitive_advantage, success_metrics')
    .order('created_at', { ascending: false })

  if (!products) return []

  const ideas: IdeaProduct[] = products
    .map((p: Record<string, unknown>) => {
      let populatedFields = 0
      for (const field of SPEC_FIELDS) {
        if (p[field] !== null && p[field] !== '') {
          populatedFields++
        }
      }

      return {
        product_slug: p.product_slug as string,
        display_name: p.display_name as string | null,
        created_at: p.created_at as string,
        populated_fields: populatedFields
      }
    })
    .filter(p => p.populated_fields < 14)

  return ideas
}

export default async function NewIdeasPage() {
  const ideas = await getIdeas()

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/admin/pipeline"
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              ← Back to Pipeline
            </Link>
          </div>
          <h1 className="text-3xl font-bold mb-2">New Idea — Onboarding</h1>
          <p className="text-gray-400">
            Capture new product ideas and walk them through the feasibility gate
          </p>
        </div>

        {/* Onboarding Shell - TODO */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-semibold">Start a New Idea</h2>
          </div>
          
          <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-4 mb-4">
            <p className="text-yellow-200 text-sm">
              <strong>TODO:</strong> office-hours question set + answer→field mapping — pending spec.
            </p>
            <p className="text-yellow-300/70 text-xs mt-2">
              The questions and the answer→field mapping are still being specced. 
              Once ready, this section will guide you through the ideation process.
            </p>
          </div>

          <button
            disabled
            className="px-4 py-2 bg-gray-600 text-gray-300 rounded-lg font-medium cursor-not-allowed opacity-50"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Submit Idea (coming soon)
          </button>
        </div>

        {/* Existing Ideas List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Existing Ideas</h2>
            <span className="text-sm text-gray-400">
              {ideas.length} idea{ideas.length !== 1 ? 's' : ''} waiting
            </span>
          </div>

          {ideas.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
              <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No ideas yet. Click &quot;Submit Idea&quot; above when ready.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ideas.map(idea => (
                <Link
                  key={idea.product_slug}
                  href={`/admin/pipeline/${idea.product_slug}`}
                  className="block bg-gray-800 hover:bg-gray-750 rounded-lg p-4 border border-gray-700 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium group-hover:text-blue-400 transition-colors">
                        {idea.display_name || idea.product_slug}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {idea.populated_fields}/14 fields populated
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 group-hover:text-blue-400 transition-colors">
                      <span className="text-sm">Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full" 
                        style={{ width: `${(idea.populated_fields / 14) * 100}%` }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
