/**
 * ElevenLabs and Resend API clients
 */

const ELEVENLABS_API = 'https://api.elevenlabs.io/v1'
const RESEND_API = 'https://api.resend.com'

// ElevenLabs
export async function getElevenLabsUsage(): Promise<{ minutes: number; cost: number }> {
  const key = process.env.ELEVENLABS_API_KEY
  if (!key) return { minutes: 0, cost: 0 }
  
  try {
    const res = await fetch(`${ELEVENLABS_API}/usage`, {
      headers: {
        'xi-api-key': key,
      },
    })
    
    if (!res.ok) {
      return { minutes: 0, cost: 0 }
    }
    
    const data = await res.json()
    return {
      minutes: Math.round((data.minutes_used || 0) * 10) / 10,
      cost: data.billing_cost || 0,
    }
  } catch (err) {
    console.error('[ElevenLabs] Usage error:', err)
    return { minutes: 0, cost: 0 }
  }
}

// Resend
export async function getResendUsage(): Promise<{ emails: number; cost: number }> {
  const key = process.env.RESEND_API_KEY
  if (!key) return { emails: 0, cost: 0 }
  
  try {
    const res = await fetch(`${RESEND_API}/usage`, {
      headers: {
        Authorization: `Bearer ${key}`,
      },
    })
    
    if (!res.ok) {
      return { emails: 0, cost: 0 }
    }
    
    const data = await res.json()
    return {
      emails: data.emails_sent || 0,
      cost: 0, // Resend doesn't expose cost directly
    }
  } catch (err) {
    console.error('[Resend] Usage error:', err)
    return { emails: 0, cost: 0 }
  }
}
