/**
 * POST /api/admin/pipeline/new-ideas/create
 *
 * The ONE intake door (one-door model). Creates (or re-stamps) a product_validation_status
 * INCOMPLETE-SPEC row and CAPTURES optional asset identifiers. It does NOT validate, does NOT
 * grant membership (no card Z, no manifest Y), and does NOT flip is_draft — all of that moves to
 * the GATE (admit). Deployed-vs-new is DERIVED from live-URL presence, never chosen:
 *   liveUrl present ⇒ entry_mode 'review' (a deployed build); else ⇒ 'new' (a fresh idea).
 *
 * There is deliberately NO "new + identifiers → 400" contradiction guard here — under one-door
 * the form posts name + an optional URL together, and a URL simply derives entry_mode='review'.
 * (Guarding against it would 400 the primary deployed-product path — findings #10/#11.)
 *
 * NOTE: liveUrl maps to the existing product_validation_status.mvp_url column. ecc_project_id is
 * the cockpit↔ECC relay join key (B2). All identifiers are captured-but-unvalidated; the gate
 * re-derives + validates.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface Identifiers {
  liveUrl: string
  githubRepo: string
  vercelProject: string
  supabaseRef: string
  eccProjectId: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productName, displayName, liveUrl, githubRepo, vercelProject, supabaseRef, eccProjectId } =
      body as {
        productName: string
        displayName?: string
        liveUrl?: string
        githubRepo?: string
        vercelProject?: string
        supabaseRef?: string
        eccProjectId?: string
      }

    if (!productName) {
      return NextResponse.json({ error: 'productName required' }, { status: 400 })
    }

    const id: Identifiers = {
      liveUrl: (liveUrl ?? '').trim(),
      githubRepo: (githubRepo ?? '').trim(),
      vercelProject: (vercelProject ?? '').trim(),
      supabaseRef: (supabaseRef ?? '').trim(),
      eccProjectId: (eccProjectId ?? '').trim(),
    }

    // Deployed-vs-new is DERIVED from live-URL presence, never chosen.
    const entryMode: 'new' | 'review' = id.liveUrl ? 'review' : 'new'

    const slug = productName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // Captured columns (only those provided are written; absent stay NULL).
    const base: Record<string, unknown> = {
      product_slug: slug,
      display_name: displayName || productName,
      entry_mode: entryMode,
    }
    if (id.liveUrl) base.mvp_url = id.liveUrl // live_url maps to mvp_url
    if (id.githubRepo) base.github_repo = id.githubRepo
    if (id.vercelProject) base.vercel_project = id.vercelProject
    if (id.supabaseRef) base.supabase_ref = id.supabaseRef
    if (id.eccProjectId) base.ecc_project_id = id.eccProjectId

    const { data: existing } = await supabase
      .from('product_validation_status')
      .select('product_slug')
      .eq('product_slug', slug)
      .maybeSingle()

    if (existing) {
      // Re-stamp the captured fields on an in-progress row (don't clobber spec/admission state).
      const { error: updErr } = await supabase
        .from('product_validation_status')
        .update(base)
        .eq('product_slug', slug)
      if (updErr) {
        console.error('[create-idea] update error:', updErr)
        return NextResponse.json({ error: updErr.message }, { status: 500 })
      }
      return NextResponse.json({ productSlug: slug, alreadyExists: true, entryMode })
    }

    const { error } = await supabase
      .from('product_validation_status')
      .insert({ ...base, created_at: new Date().toISOString() })

    if (error) {
      console.error('[create-idea] Insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ productSlug: slug, alreadyExists: false, entryMode })
  } catch (error) {
    console.error('[create-idea] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
