import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Only update state for real auth events, not the initial one
        if (event !== 'INITIAL_SESSION') {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      // Try direct first
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (!error) return { data, error: null };
      
      // If network error, fall back to proxy
      if (error.message === 'Failed to fetch') {
        return await authViaProxy('sign_up', email, password);
      }
      return { data, error };
    } catch {
      return await authViaProxy('sign_up', email, password);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!error) return { data, error: null };
      
      if (error.message === 'Failed to fetch') {
        return await authViaProxy('sign_in', email, password);
      }
      return { data, error };
    } catch {
      return await authViaProxy('sign_in', email, password);
    }
  };

  const authViaProxy = async (action: string, email: string, password: string) => {
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const edgeFunctionUrl = `https://${projectId}.supabase.co/functions/v1/auth-proxy`;
      
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data?.msg || data?.error || 'Authentication failed';
        return { data: null, error: { message: errorMsg } };
      }
      
      // Set the session from proxy response
      if (data?.access_token && data?.refresh_token) {
        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
      }
      
      return { data, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      return { data: null, error: { message } };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const updateEmail = async (newEmail: string) => {
    const { data, error } = await supabase.auth.updateUser(
      { email: newEmail },
      { emailRedirectTo: window.location.origin }
    );
    return { data, error };
  };

  const updatePassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser(
      { password: newPassword },
      { emailRedirectTo: window.location.origin }
    );
    return { data, error };
  };

  const updateDisplayName = async (displayName: string) => {
    const { data, error } = await supabase.auth.updateUser({
      data: { display_name: displayName },
    });
    if (!error) {
      setUser(data.user);
    }
    return { data, error };
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateEmail,
    updatePassword,
    updateDisplayName,
  };
}
