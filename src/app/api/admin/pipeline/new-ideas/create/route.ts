/**
 * POST /api/admin/pipeline/new-ideas/create
 * 
 * Creates a new product_validation_status row for a new idea.
 * This is the entry point that creates the INCOMPLETE-SPEC row.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productName, displayName } = body as {
      productName: string
      displayName?: string
    }

    if (!productName) {
      return NextResponse.json({ error: 'productName required' }, { status: 400 })
    }

    const slug = productName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: existing } = await supabase
      .from('product_validation_status')
      .select('product_slug')
      .eq('product_slug', slug)
      .single()

    if (existing) {
      return NextResponse.json({ productSlug: slug, alreadyExists: true })
    }

    const { data, error } = await supabase
      .from('product_validation_status')
      .insert({
        product_slug: slug,
        display_name: displayName || productName,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('[create-idea] Insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ productSlug: slug, alreadyExists: false })

  } catch (error) {
    console.error('[create-idea] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
