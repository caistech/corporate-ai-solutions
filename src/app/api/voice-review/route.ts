/**
 * Voice Review Submission API
 * 
 * Receives voice agent calls from ElevenLabs, transcribes, and stores review.
 * 
 * Flow:
 * 1. Voice agent collects review via phone/web
 * 2. ElevenLabs webhook sends recording URL
 * 3. This API transcribes via OpenAI Whisper
 * 4. Stores in Supabase with source='voice'
 * 5. Admin moderates and approves
 * 6. Auto-publishes to website
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await req.json()
    
    // Validate webhook signature (if using ElevenLabs)
    const signature = req.headers.get('x-elevenlabs-signature')
    // TODO: Verify signature against ELEVENLABS_WEBHOOK_SECRET
    
    // Extract data from voice agent
    const {
      recording_url,
      client_name,
      client_company,
      platform_used,
      rating,
      call_id,
      transcript // ElevenLabs may provide this
    } = body
    
    let reviewText = transcript
    
    // If no transcript provided, transcribe the recording
    if (!reviewText && recording_url) {
      reviewText = await transcribeRecording(recording_url)
    }
    
    if (!reviewText) {
      return NextResponse.json(
        { error: 'No review text or recording provided' },
        { status: 400 }
      )
    }
    
    // Store review
    const { data, error } = await supabase
      .from('client_reviews')
      .insert({
        client_name: client_name || 'Anonymous Voice Caller',
        client_company: client_company || null,
        review_text: reviewText,
        rating: rating || 5,
        platform_used: platform_used || null,
        source: 'voice',
        source_metadata: {
          recording_url,
          call_id,
          received_at: new Date().toISOString()
        },
        status: 'pending'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Failed to store voice review:', error)
      return NextResponse.json(
        { error: 'Failed to store review' },
        { status: 500 }
      )
    }
    
    // Send notification to admin (optional)
    await notifyAdminOfNewReview(data.id, 'voice')
    
    return NextResponse.json({
      success: true,
      review_id: data.id,
      message: 'Review submitted successfully. Thank you for your feedback!'
    })
    
  } catch (error) {
    console.error('Voice review API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function transcribeRecording(recordingUrl: string): Promise<string> {
  try {
    // Download recording
    const response = await fetch(recordingUrl)
    const audioBlob = await response.blob()
    
    // Transcribe with OpenAI Whisper
    const formData = new FormData()
    formData.append('file', audioBlob, 'recording.mp3')
    formData.append('model', 'whisper-1')
    
    const transcribeResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: formData
    })
    
    const result = await transcribeResponse.json()
    return result.text
    
  } catch (error) {
    console.error('Transcription error:', error)
    return ''
  }
}

async function notifyAdminOfNewReview(reviewId: string, source: string) {
  // TODO: Send email/Slack notification
  // For now, just log
  console.log(`New ${source} review submitted: ${reviewId}`)
}
