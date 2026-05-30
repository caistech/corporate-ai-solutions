import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      return NextResponse.json(
        { error: 'You must be logged in to access InvestorPilot' },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    const userEmail = profile?.email || user.email;

    const investorpilotSupabase = createClient(
      process.env.INVESTORPILOT_SUPABASE_URL!,
      process.env.INVESTORPILOT_SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { error: magicLinkError } = await investorpilotSupabase.auth.signInWithOtp({
      email: userEmail,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_INVESTORPILOT_URL}/dashboard`,
      },
    });

    if (magicLinkError) {
      console.error('InvestorPilot magic link error:', magicLinkError);
      return NextResponse.json(
        { error: 'Failed to send login link to InvestorPilot' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Login link sent to ${userEmail}. Check your email to access InvestorPilot.`,
    });
  } catch (err) {
    console.error('InvestorPilot login error:', err);
    return NextResponse.json(
      { error: 'Failed to send login link' },
      { status: 500 }
    );
  }
}
