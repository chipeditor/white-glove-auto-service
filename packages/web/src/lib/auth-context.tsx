'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { User, UserRole } from '@/shared/types';

interface AuthState {
  supabaseUser: SupabaseUser | null;
  profile: User | null;
  role: UserRole | null;
  organizationId: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({
  supabaseUser: null,
  profile: null,
  role: null,
  organizationId: null,
  loading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    supabaseUser: null,
    profile: null,
    role: null,
    organizationId: null,
    loading: true,
  });

  useEffect(() => {
    const supabase = createClient();

    async function loadProfile(supabaseUser: SupabaseUser) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      let role: UserRole | null = null;
      let organizationId: string | null = null;

      if (profile) {
        const { data: membership } = await supabase
          .from('memberships')
          .select('role, organization_id')
          .eq('user_id', profile.id)
          .eq('is_active', true)
          .limit(1)
          .single();

        if (membership) {
          role = membership.role as UserRole;
          organizationId = membership.organization_id;
        }
      }

      setState({
        supabaseUser,
        profile: profile as User | null,
        role,
        organizationId,
        loading: false,
      });
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        loadProfile(user);
      } else {
        setState((s) => ({ ...s, loading: false }));
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user);
      } else {
        setState({
          supabaseUser: null,
          profile: null,
          role: null,
          organizationId: null,
          loading: false,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return <AuthContext value={state}>{children}</AuthContext>;
}
