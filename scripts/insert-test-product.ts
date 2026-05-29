import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceKey) {
  console.error('Missing env vars')
  process.exit(1)
}
const supabase = createClient(supabaseUrl, serviceKey)

async function main() {
  const product = {
    product_slug: 'e2e-test-product',
    display_name: 'Smart Distributor Outreach AI',
    promise: 'AI-powered outreach automation for B2B distributors - sends personalized emails at scale using generative AI to qualified leads, increasing conversion by 40%',
    distributor: 'Dennis McMahon - Enterprise software resellers in ANZ region, companies selling to mid-market with 50-500 employees, existing CRM users',
    end_user: 'Dennis Tester - Business owners and sales leaders, decision makers who need lead generation, 3+ years in business, 10-50 employees',
    friction: 'Manual outreach takes 15+ hours/week, generic templates get 2% open rates, no personalization at scale',
    pitch: 'Cut outreach time by 70% with AI that writes like you. Personalized emails that actually get opened. 40% higher conversion than templates.',
    weighted_score_percent: 95,
    has_promise: true,
    has_distributor: true,
    has_end_user: true,
    has_friction: true,
    has_methodology_commitment: true,
    hard_gates_passed: 5,
    gate1_ready: true,
    gate2_ready: true,
    gate3_ready: true,
    gate4_ready: true,
    validation_stage: 'stage_5_mvp_testing',
    regulated: false,
    cta_clicks: 0,
    form_submits: 0,
    meetings_booked: 0,
    replies_received: 0,
  }

  const { data, error } = await supabase
    .from('product_validation_status')
    .upsert(product)
    .select()
    .single()

  if (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }

  console.log('Product created:')
  console.log(JSON.stringify(data, null, 2))
}

main()
