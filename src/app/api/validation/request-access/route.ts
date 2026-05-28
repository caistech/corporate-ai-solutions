/**
 * API endpoint: POST /api/validation/request-access
 * 
 * Handles access requests to the methodology cockpit.
 * Stores request in Supabase and triggers notification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

interface AccessRequestBody {
  name: string;
  email: string;
  company: string;
  role: string;
}

/**
 * Send notification email about the access request
 */
async function sendNotificationEmail(request: AccessRequestBody): Promise<void> {
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY not set, skipping email notification');
    return;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@updates.corporateaisolutions.com',
        to: 'dennis@corporateaisolutions.com', // Change to actual admin email
        subject: `New Cockpit Access Request: ${request.name}`,
        html: `
          <h2>New Methodology Cockpit Access Request</h2>
          <p><strong>Name:</strong> ${escapeHtml(request.name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(request.email)}</p>
          <p><strong>Company:</strong> ${escapeHtml(request.company)}</p>
          <p><strong>Role:</strong> ${escapeHtml(request.role)}</p>
          <p><a href="https://app.corporateaisolutions.com/admin/cockpit/requests">View requests</a></p>
        `,
      }),
    });

    if (!response.ok) {
      console.error('Failed to send notification email:', response.statusText);
    }
  } catch (error) {
    console.error('Error sending notification email:', error);
    // Don't fail the request if email notification fails
  }
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, char => map[char]);
}

/**
 * POST /api/validation/request-access
 * 
 * Request body:
 * {
 *   name: string,
 *   email: string,
 *   company: string,
 *   role: "founder" | "product" | "investor" | "consultant" | "other"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: AccessRequestBody = await request.json();

    // Validate required fields
    if (!body.name || !body.email || !body.company || !body.role) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, company, role' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['founder', 'product', 'investor', 'consultant', 'other'];
    if (!validRoles.includes(body.role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Supabase credentials not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Store request in Supabase
    const { data, error } = await supabase
      .from('validation_access_requests')
      .insert({
        name: body.name,
        email: body.email,
        company: body.company,
        role: body.role,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to insert request:', error);
      return NextResponse.json(
        { error: 'Failed to store request' },
        { status: 500 }
      );
    }

    // Send notification email
    await sendNotificationEmail(body);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'We\'ll contact you within 24 hours',
        requestId: data?.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error processing access request:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: 'Failed to process request', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET /api/validation/request-access
 * 
 * Returns list of access requests (authenticated only).
 * Query params:
 * - status: "pending" | "approved" | "rejected" | "contacted"
 * - limit: number (default 50)
 */
export async function GET(request: NextRequest) {
  try {
    // This endpoint requires authentication
    // In a real implementation, check auth header
    // For now, return 403 Forbidden for unauthenticated requests

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Verify token with Supabase auth
    // For now, just allow authenticated requests

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Fetch requests
    let query = supabase
      .from('validation_access_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch requests' },
        { status: 500 }
      );
    }

    return NextResponse.json({ requests: data }, { status: 200 });
  } catch (error) {
    console.error('Error fetching requests:', error);

    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}
