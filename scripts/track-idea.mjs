// Ad-hoc: track where a freshly-submitted idea landed in the cockpit pipeline.
// Run: node --env-file=.env.local scripts/track-idea.mjs executor
import { createClient } from '@supabase/supabase-js'

const needle = (process.argv[2] || 'executor').toLowerCase()
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in env')
  process.exit(1)
}
console.log('Cockpit ref:', url.replace(/^https:\/\//, '').split('.')[0], '\nSearching for:', needle, '\n')
const sb = createClient(url, key)

async function show(table, filterCol = 'product_slug') {
  const { data, error } = await sb.from(table).select('*')
  if (error) {
    console.log(`--- ${table}: ERROR ${error.message}`)
    return []
  }
  const rows = (data || []).filter((r) =>
    String(r[filterCol] ?? '').toLowerCase().includes(needle) ||
    String(r.display_name ?? '').toLowerCase().includes(needle),
  )
  console.log(`=== ${table} — ${rows.length} match(es) ===`)
  for (const r of rows) console.log(JSON.stringify(r, null, 2))
  if (!rows.length) console.log('(none)')
  console.log('')
  return rows
}

const pvs = await show('product_validation_status')
const cards = await show('methodology_hypothesis_cards')

// Readiness results for any matched slug.
const slugs = [...new Set([...pvs, ...cards].map((r) => r.product_slug).filter(Boolean))]
for (const slug of slugs) {
  const { data } = await sb.from('readiness_results').select('check_code,status,source,scored_at,evidence').eq('product_slug', slug)
  console.log(`=== readiness_results for "${slug}" — ${data?.length ?? 0} row(s) ===`)
  for (const r of (data || []).sort((a, b) => String(a.check_code).localeCompare(String(b.check_code))))
    console.log(`  #${r.check_code} ${r.status} (${r.source}) ${r.scored_at ?? ''}`)
  if (!data?.length) console.log('  (none yet)')
}
