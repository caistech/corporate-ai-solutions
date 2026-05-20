import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { notifySubmission } from '@/lib/email'

const EngagementInquirySchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  role: z.string().max(200).optional(),
  org_name: z.string().max(200).optional(),
  org_type: z.enum(['vc-fund', 'studio', 'accelerator', 'dev-shop', 'other']).optional(),
  aum_or_revenue: z.string().max(200).optional(),
  cohort_size: z.coerce.number().int().nonnegative().optional(),
  cohort_industries: z.string().max(500).optional(),
  target_window: z.enum(['jan-mar', 'jul-sep', 'either']).optional(),
  engagement_length: z.enum(['3-month', '6-month', 'flexible']).optional(),
  deal_shape: z.enum(['A', 'B', 'C', 'open']).optional(),
  past_cohort_outcomes: z.string().max(2000).optional(),
  notes: z.string().max(4000).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = EngagementInquirySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid inquiry payload', issues: parsed.error.issues },
        { status: 400 }
      )
    }

    const referrer = request.headers.get('referer') || request.headers.get('referrer') || null

    const supabase = supabaseAdmin()
    const { data, error } = await supabase
      .from('engagement_inquiries')
      .insert({ ...parsed.data, referrer, status: 'new' })
      .select()
      .single()

    if (error) {
      console.error('Supabase error (engagement_inquiries insert):', error)
      return NextResponse.json({ error: 'Failed to submit inquiry' }, { status: 500 })
    }

    // Best-effort email notification — Resend is a no-op without RESEND_API_KEY.
    await notifySubmission('New Studio-in-Residence Inquiry', {
      Name: parsed.data.name,
      Email: parsed.data.email,
      Role: parsed.data.role,
      Organization: parsed.data.org_name,
      'Org Type': parsed.data.org_type,
      'AUM / Revenue': parsed.data.aum_or_revenue,
      'Cohort Size': parsed.data.cohort_size?.toString(),
      'Cohort Industries': parsed.data.cohort_industries,
      'Target Window': parsed.data.target_window,
      'Engagement Length': parsed.data.engagement_length,
      'Deal Shape': parsed.data.deal_shape,
      'Past Cohort Outcomes': parsed.data.past_cohort_outcomes,
      Notes: parsed.data.notes,
      Referrer: referrer,
    })

    return NextResponse.json({ success: true, inquiry: { id: data.id } })
  } catch (error) {
    console.error('API error (/api/engagement):', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
