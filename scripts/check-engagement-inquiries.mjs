// One-shot diagnostic: list rows in engagement_inquiries.
// Loads .env.local for SUPABASE_URL + SERVICE_ROLE_KEY; safe to delete after.
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

const { data, error } = await supabase
  .from('engagement_inquiries')
  .select('id, created_at, name, email, role, org_name, org_type, aum_or_revenue, cohort_size, cohort_industries, target_window, engagement_length, deal_shape, status, referrer')
  .order('created_at', { ascending: false })
  .limit(20)

if (error) {
  console.error('Query error:', error.message)
  process.exit(1)
}

console.log(`Found ${data.length} row(s) in engagement_inquiries:\n`)
for (const row of data) {
  console.log(`  ${row.created_at}  ${row.email}  (${row.name})`)
  console.log(`    org: ${row.org_name || '-'} / type: ${row.org_type || '-'} / aum: ${row.aum_or_revenue || '-'}`)
  console.log(`    cohort: size=${row.cohort_size ?? '-'} industries=${row.cohort_industries || '-'}`)
  console.log(`    window: ${row.target_window || '-'} / length: ${row.engagement_length || '-'} / shape: ${row.deal_shape || '-'}`)
  console.log(`    referrer: ${row.referrer || '-'} / status: ${row.status}`)
  console.log('')
}
