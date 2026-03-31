import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { notifySubmission } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { name, email, phone, company, source_page, source_agent, intent, problem_description } = body

    if (!name || !email || !intent) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, intent' },
        { status: 400 }
      )
    }

    const supabase = supabaseAdmin()

    const { data, error } = await supabase
      .from('leads')
      .insert({
        name,
        email,
        phone,
        company,
        source_page,
        source_agent,
        intent,
        problem_description,
        qualified: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 })
    }

    await notifySubmission('New Lead', {
      Name: name, Email: email, Phone: phone, Company: company,
      Source: source_page, Agent: source_agent, Intent: intent, Problem: problem_description,
    })

    return NextResponse.json({ success: true, lead: data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin()
    
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
    }

    return NextResponse.json({ leads: data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
