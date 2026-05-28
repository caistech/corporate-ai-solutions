'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface User {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          setState({
            user: null,
            isLoading: false,
            error,
          });
        } else {
          setState({
            user: user as User | null,
            isLoading: false,
            error: null,
          });
        }
      } catch (err) {
        setState({
          user: null,
          isLoading: false,
          error: err instanceof Error ? err : new Error('Unknown auth error'),
        });
      }
    };

    checkAuth();

    // Optional: listen for auth state changes
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        user: session?.user as User | null,
        isLoading: false,
        error: null,
      });
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return state;
}
