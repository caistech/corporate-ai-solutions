import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { notifySubmission } from '@/lib/email'
import { PLATFORMS } from '@/lib/constants'

// Form gate for /marketplace/<slug>/byok per Decision 2 of
// project_byok_conversion_template_decisions: four fields, canonical intent
// placeholder copy enforced on the page (not here — server validates shape only).
const ByokInquirySchema = z.object({
  product_slug: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(64).optional(),
  intent: z.string().max(4000).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = ByokInquirySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid inquiry payload', issues: parsed.error.issues },
        { status: 400 }
      )
    }

    const platform = PLATFORMS.find((p) => p.slug === parsed.data.product_slug)
    if (!platform || platform.releaseMode !== 'byok-free' || !platform.deployUrl) {
      return NextResponse.json(
        { error: 'Unknown or non-BYOK product' },
        { status: 404 }
      )
    }

    const referrer = request.headers.get('referer') || request.headers.get('referrer') || null
    const userAgent = request.headers.get('user-agent') || null

    const supabase = supabaseAdmin()
    const { data, error } = await supabase
      .from('byok_inquiries')
      .insert({
        ...parsed.data,
        referrer,
        user_agent: userAgent,
        status: 'new',
      })
      .select('id')
      .single()

    if (error) {
      console.error('Supabase error (byok_inquiries insert):', error)
      return NextResponse.json({ error: 'Failed to submit inquiry' }, { status: 500 })
    }

    await notifySubmission(`New BYOK inquiry — ${platform.name}`, {
      Product: platform.name,
      Slug: platform.slug,
      Name: parsed.data.name,
      Email: parsed.data.email,
      Phone: parsed.data.phone,
      Intent: parsed.data.intent,
      Referrer: referrer,
    })

    // Decision 4 — submit redirects the user to the product's Vercel Deploy
    // URL. Return it in the response so the client can window.location it.
    return NextResponse.json({
      success: true,
      inquiry: { id: data.id },
      deployUrl: platform.deployUrl,
    })
  } catch (error) {
    console.error('API error (/api/byok-inquiry):', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
