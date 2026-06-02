/**
 * /api/cron/cost-sync — Daily sync of Supabase project costs
 * 
 * Fetches all Supabase projects via Management API, syncs to cost_sources,
 * and creates daily cost_entries with compute cost and usage.
 * 
 * Auth: CRON_SECRET Bearer token
 * Schedule: Daily 6am (configure in vercel.json)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { listProjects, getProjectAddons, getProjectUsage, getComputeSizeFromAddons } from '@/lib/ops/supabase-management'
import { monthlyComputeUsd } from '@/lib/ops/compute-pricing'

const INTERNAL_ORG_ID = '00000000-0000-0000-0000-000000000001'

async function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  return token === process.env.CRON_SECRET
}

export async function POST(request: NextRequest) {
  console.log('[cost-sync] Starting Supabase cost sync')
  
  // Verify cron auth
  if (!verifyCronAuth(request)) {
    console.error('[cost-sync] Unauthorized access attempt')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const supabase = await getServiceRoleClient()
    
    // Fetch all projects from Supabase Management API
    const projects = await listProjects()
    console.log(`[cost-sync] Found ${projects.length} projects`)
    
    const today = new Date().toISOString().split('T')[0]
    let synced = 0
    let errors = 0
    
    for (const project of projects) {
      try {
        // Get compute size
        const addons = await getProjectAddons(project.ref)
        const computeSize = getComputeSizeFromAddons(addons)
        const estMonthlyUsd = monthlyComputeUsd(computeSize)
        
        // Get 24h request count
        const requests24h = await getProjectUsage(project.ref)
        
        // Upsert cost source
        const { error: sourceError } = await supabase
          .from('cost_sources')
          .upsert({
            provider: 'supabase',
            source_ref: project.ref,
            name: project.name || project.ref,
            organisation_id: INTERNAL_ORG_ID,
            billing_model: 'fixed',
            fixed_cost_usd: estMonthlyUsd,
            is_active: project.status === 'ACTIVE_HEALTHY',
            notes: JSON.stringify({ status: project.status }),
          }, {
            onConflict: 'source_ref',
          })
        
        if (sourceError) {
          console.error(`[cost-sync] Error upserting source ${project.ref}:`, sourceError)
          errors++
          continue
        }
        
        // Get the source ID
        const { data: sourceData } = await supabase
          .from('cost_sources')
          .select('id')
          .eq('source_ref', project.ref)
          .single()
        
        if (!sourceData) {
          console.error(`[cost-sync] Could not find source after insert: ${project.ref}`)
          errors++
          continue
        }
        
        // Upsert daily cost entry
        const { error: entryError } = await supabase
          .from('cost_entries')
          .upsert({
            source_id: sourceData.id,
            entry_date: today,
            cost_usd: estMonthlyUsd,
            usage_json: {
              requests: requests24h,
              compute_size: computeSize,
            },
            source_data: {
              project_ref: project.ref,
              project_status: project.status,
              addons: addons.addons,
            },
          }, {
            onConflict: 'source_id,entry_date',
            ignoreDuplicates: false,
          })
        
        if (entryError) {
          console.error(`[cost-sync] Error upserting entry for ${project.ref}:`, entryError)
          errors++
          continue
        }
        
        synced++
        console.log(`[cost-sync] Synced ${project.name || project.ref}: $${estMonthlyUsd}/mo, ${requests24h} requests`)
      } catch (projectError) {
        console.error(`[cost-sync] Error processing project ${project.ref}:`, projectError)
        errors++
      }
    }
    
    console.log(`[cost-sync] Completed: ${synced} synced, ${errors} errors`)
    
    return NextResponse.json({
      success: true,
      projects_total: projects.length,
      synced,
      errors,
      date: today,
    })
  } catch (error) {
    console.error('[cost-sync] Fatal error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}

// Also allow GET for manual testing
export async function GET(request: NextRequest) {
  return POST(request)
}
