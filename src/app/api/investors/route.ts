import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { notifySubmission } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name, email, phone, company, investor_type,
      check_size_range, interest_areas, how_heard, notes
    } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email' },
        { status: 400 }
      )
    }

    const supabase = supabaseAdmin()

    const { data, error } = await supabase
      .from('investor_leads')
      .insert({
        name, email, phone, company, investor_type,
        check_size_range, interest_areas, how_heard, notes,
        status: 'new'
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to submit inquiry' }, { status: 500 })
    }

    await notifySubmission('New Investor Inquiry', {
      Name: name, Email: email, Phone: phone, Company: company,
      Type: investor_type, 'Check Size': check_size_range,
      'Interest Areas': Array.isArray(interest_areas) ? interest_areas.join(', ') : interest_areas,
      'How Heard': how_heard, Notes: notes,
    })

    return NextResponse.json({ success: true, investor: data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
