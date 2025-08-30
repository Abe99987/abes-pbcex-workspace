import { useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { User } from '@/utils/api';

/**
 * Supabase-aware auth hook that bridges Supabase auth with PBCEx user data
 * This hook provides dual auth capabilities:
 * 1. Native PBCEx auth (current implementation)
 * 2. Supabase auth (future migration path)
 */

interface SupabaseAuthState {
  supabaseUser: SupabaseUser | null;
  supabaseSession: unknown;
  isSupabaseReady: boolean;
  isSupabaseEnabled: boolean;
}

export function useSupabaseAuth() {
  const [supabaseAuth, setSupabaseAuth] = useState<SupabaseAuthState>({
    supabaseUser: null,
    supabaseSession: null,
    isSupabaseReady: false,
    isSupabaseEnabled: false,
  });

  useEffect(() => {
    // Check if Supabase should be enabled
    const supabaseEnabled = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    if (!supabaseEnabled) {
      setSupabaseAuth(prev => ({
        ...prev,
        isSupabaseReady: true,
        isSupabaseEnabled: false,
      }));
      return;
    }

    const supabase = createClient();

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.warn('Supabase session error:', error);
        }

        setSupabaseAuth({
          supabaseUser: session?.user || null,
          supabaseSession: session,
          isSupabaseReady: true,
          isSupabaseEnabled: true,
        });
      } catch (error) {
        console.warn('Supabase initialization error:', error);
        setSupabaseAuth(prev => ({
          ...prev,
          isSupabaseReady: true,
          isSupabaseEnabled: false,
        }));
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Supabase auth event:', event);

      setSupabaseAuth(prev => ({
        ...prev,
        supabaseUser: session?.user || null,
        supabaseSession: session,
      }));

      // TODO: Sync with PBCEx backend when user logs in/out via Supabase
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in via Supabase:', session.user.email);
        // Could trigger a backend API call to sync user data
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out via Supabase');
        // Could trigger logout in the legacy auth system
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithSupabase = async (email: string, password: string) => {
    if (!supabaseAuth.isSupabaseEnabled) {
      throw new Error('Supabase auth is not enabled');
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  };

  const signUpWithSupabase = async (
    email: string,
    password: string,
    userData?: Partial<User>
  ) => {
    if (!supabaseAuth.isSupabaseEnabled) {
      throw new Error('Supabase auth is not enabled');
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
          ? {
              first_name: userData.firstName,
              last_name: userData.lastName,
              phone: userData.phone,
            }
          : undefined,
      },
    });

    if (error) {
      throw error;
    }

    return data;
  };

  const signOutFromSupabase = async () => {
    if (!supabaseAuth.isSupabaseEnabled) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  };

  const syncUserWithBackend = async (
    supabaseUser: SupabaseUser
  ): Promise<User | null> => {
    try {
      // Convert Supabase user to PBCEx user format
      const pbcexUser: Partial<User> = {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        firstName: supabaseUser.user_metadata?.first_name,
        lastName: supabaseUser.user_metadata?.last_name,
        phone: supabaseUser.user_metadata?.phone,
        emailVerified: !!supabaseUser.email_confirmed_at,
        phoneVerified: !!supabaseUser.phone_confirmed_at,
        // Default values for PBCEx-specific fields
        kycStatus: 'NOT_STARTED',
        twoFactorEnabled: false,
        role: 'USER',
      };

      // TODO: Call backend API to sync/create user
      // const response = await api.auth.syncSupabaseUser(pbcexUser);
      // return response.data.user;

      // For now, return the converted user
      return pbcexUser as User;
    } catch (error) {
      console.error('Failed to sync Supabase user with backend:', error);
      return null;
    }
  };

  return {
    ...supabaseAuth,
    signInWithSupabase,
    signUpWithSupabase,
    signOutFromSupabase,
    syncUserWithBackend,
  };
}
