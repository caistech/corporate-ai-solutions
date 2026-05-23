import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { priceId, tier, platforms, email, successUrl, cancelUrl } = body

    if (!priceId) {
      return NextResponse.json({ error: 'Missing priceId' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://corporate-ai-solutions.vercel.app'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email,
      success_url: successUrl || `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${baseUrl}/pricing`,
      metadata: {
        tier: tier || 'starter',
        platforms: platforms?.join(',') || '',
      },
      subscription_data: {
        metadata: {
          tier: tier || 'starter',
          platforms: platforms?.join(',') || '',
        },
      },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ 
      sessionId: session.id, 
      url: session.url 
    })
  } catch (error: any) {
    console.error('Checkout session error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
