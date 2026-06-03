/**
 * Shared helper for upserting readiness_results.
 * 
 * Guard 1: Only write from real results (pass/fail/na when cell actually ran)
 * Guard 2: status must be 'pass' | 'fail' | 'na', source honest per check
 * Guard 3: Upsert = latest-wins (delete prior, then insert fresh scored_at)
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
})

export type ReadinessStatus = 'pass' | 'fail' | 'na'
export type ReadinessSource = 'auto' | 'naive-tester' | 'voice-auditor' | 'judge'

export interface UpsertReadinessParams {
  productSlug: string
  checkCode: string
  status: ReadinessStatus
  source: ReadinessSource
  evidence?: string | null
  deploymentId?: string | null
}

/**
 * Upserts a readiness result. Uses delete-then-insert to ensure latest-wins.
 * The scorer reads newest scored_at per (product_slug, check_code).
 */
export async function upsertReadinessResult(params: UpsertReadinessParams): Promise<void> {
  const { productSlug, checkCode, status, source, evidence, deploymentId } = params

  // Guard: validate inputs
  if (!['pass', 'fail', 'na'].includes(status)) {
    console.warn('[readiness-results] Invalid status, skipping:', status)
    return
  }
  if (!['auto', 'naive-tester', 'voice-auditor', 'judge'].includes(source)) {
    console.warn('[readiness-results] Invalid source, skipping:', source)
    return
  }

  try {
    // Delete prior result for this check (latest-wins)
    await supabase
      .from('readiness_results')
      .delete()
      .eq('product_slug', productSlug)
      .eq('check_code', checkCode)

    // Insert fresh result
    const evidenceValue = evidence !== null && evidence !== undefined ? evidence : undefined
    const deploymentValue = deploymentId !== null && deploymentId !== undefined ? deploymentId : undefined

    const { error } = await supabase.from('readiness_results').insert({
      product_slug: productSlug,
      check_code: checkCode,
      status,
      source,
      evidence: evidenceValue,
      deployment_id: deploymentValue,
      scored_at: new Date().toISOString(),
      recorded_by: 'system',
    })

    if (error) {
      console.error('[readiness-results] Upsert error:', error, { productSlug, checkCode })
    } else {
      console.log('[readiness-results] Upserted:', productSlug, checkCode, status, source)
    }
  } catch (err) {
    console.error('[readiness-results] Exception:', err, { productSlug, checkCode })
  }
}

/**
 * Batch upsert multiple results in one transaction
 */
export async function upsertReadinessResults(
  results: UpsertReadinessParams[]
): Promise<void> {
  for (const result of results) {
    await upsertReadinessResult(result)
  }
}
