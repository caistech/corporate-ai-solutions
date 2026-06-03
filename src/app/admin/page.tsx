import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutGrid, Workflow, CreditCard, Star, Settings, Plus, ArrowRight, Package } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

interface ProductSummary {
  ideas: number
  inProgress: number
  completed: number
}

async function getProductSummary(): Promise<ProductSummary> {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: products } = await supabase
    .from('product_validation_status')
    .select('*')

  if (!products || products.length === 0) {
    return { ideas: 0, inProgress: 0, completed: 0 }
  }

  const specFields = [
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

  let ideas = 0
  let inProgress = 0
  let completed = 0

  for (const product of products) {
    const populatedFields = specFields.filter(field => 
      product[field] !== null && product[field] !== ''
    ).length

    const hasGo = await supabase
      .from('pipeline_gates')
      .select('id')
      .eq('product_slug', product.product_slug)
      .eq('gate', 'GO')
      .eq('status', 'pass')
      .maybeSingle()

    if (populatedFields < 14) {
      ideas++
    } else if (hasGo) {
      completed++
    } else {
      inProgress++
    }
  }

  return { ideas, inProgress, completed }
}

const NAV_CARDS = [
  { 
    href: '/admin/pipeline', 
    label: 'Pipeline', 
    icon: LayoutGrid, 
    description: 'Portfolio validation & product management',
    primary: true
  },
  { 
    href: '/admin/methodology', 
    label: 'Methodology', 
    icon: Workflow, 
    description: 'Validation framework & standards'
  },
  { 
    href: '/admin/ops', 
    label: 'Ops', 
    icon: CreditCard, 
    description: 'Operational management & billing'
  },
  { 
    href: '/admin/reviews', 
    label: 'Reviews', 
    icon: Star, 
    description: 'Performance reviews & feedback'
  },
  { 
    href: '/admin/settings', 
    label: 'Settings', 
    icon: Settings, 
    description: 'Account & system configuration'
  }
]

export default async function AdminDashboard() {
  const summary = await getProductSummary()

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Pipeline Admin</h1>
          <p className="text-gray-400">
            Product validation factory — manage your portfolio from idea to launch
          </p>
        </div>

        {/* Pipeline Card - Primary */}
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6 mb-6 border border-blue-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-700 rounded-lg">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Pipeline</h2>
                <p className="text-blue-200 text-sm">Portfolio validation & management</p>
              </div>
            </div>
            <Link
              href="/admin/pipeline/new-ideas"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-900 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Product
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-blue-300" />
                <span className="text-blue-200 text-sm">Ideas</span>
              </div>
              <p className="text-3xl font-bold">{summary.ideas}</p>
              <p className="text-blue-300 text-xs mt-1">Not yet started</p>
            </div>
            <div className="bg-blue-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <ArrowRight className="w-4 h-4 text-yellow-300" />
                <span className="text-blue-200 text-sm">In Progress</span>
              </div>
              <p className="text-3xl font-bold">{summary.inProgress}</p>
              <p className="text-blue-300 text-xs mt-1">In pipeline</p>
            </div>
            <div className="bg-blue-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-green-300" />
                <span className="text-blue-200 text-sm">Completed</span>
              </div>
              <p className="text-3xl font-bold">{summary.completed}</p>
              <p className="text-blue-300 text-xs mt-1">Passed GO gate</p>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <Link
              href="/admin/pipeline"
              className="text-sm text-blue-200 hover:text-white underline"
            >
              View Pipeline →
            </Link>
            <Link
              href="/admin/pipeline/new-ideas"
              className="text-sm text-blue-200 hover:text-white underline"
            >
              View Ideas →
            </Link>
          </div>
        </div>

        {/* Other Nav Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {NAV_CARDS.slice(1).map(card => (
            <Link
              key={card.href}
              href={card.href}
              className="bg-gray-800 hover:bg-gray-750 rounded-lg p-4 border border-gray-700 transition-colors group"
            >
              <card.icon className="w-6 h-6 mb-3 text-gray-400 group-hover:text-white transition-colors" />
              <h3 className="font-medium mb-1">{card.label}</h3>
              <p className="text-sm text-gray-500">{card.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
