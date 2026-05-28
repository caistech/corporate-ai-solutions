/**
 * Auth Utilities
 * 
 * Helper functions for checking authentication and admin access
 * Used by API endpoints to verify user identity and admin status
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

interface AuthUser {
  id: string;
  email?: string;
}

interface AuthContext {
  user: AuthUser | null;
  isAdmin: boolean;
}

/**
 * Extract auth token from request and verify with Supabase
 */
export async function getAuth(request: NextRequest): Promise<AuthContext> {
  try {
    // Get the Authorization header or cookie
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.replace('Bearer ', '');

    if (!bearerToken) {
      // Try to get from cookies (for browser requests)
      const cookieHeader = request.headers.get('cookie');
      if (!cookieHeader) {
        return { user: null, isAdmin: false };
      }
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current user from token
    let user: AuthUser | null = null;
    
    if (bearerToken) {
      const { data, error } = await supabase.auth.getUser(bearerToken);
      if (data?.user) {
        user = {
          id: data.user.id,
          email: data.user.email,
        };
      }
    } else {
      // For cookie-based auth, we'd need additional logic
      // For now, API endpoints should use Bearer tokens
      return { user: null, isAdmin: false };
    }

    if (!user) {
      return { user: null, isAdmin: false };
    }

    // Check if user is in ADMIN_EMAILS
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());
    const isAdmin = user.email ? adminEmails.includes(user.email) : false;

    return { user, isAdmin };
  } catch (error) {
    console.error('Auth check error:', error);
    return { user: null, isAdmin: false };
  }
}

/**
 * Verify admin access (used by middleware)
 */
export function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());
  return adminEmails.includes(email);
}
