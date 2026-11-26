import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';
import {
  clearAuthCache,
  getProfileCache,
  getSessionCache,
  setAccessToken,
  setProfileCache,
  setSessionCache,
} from '../services/authToken.js';
import { connectRealtime, disconnectRealtime } from '../services/realtime.js';
import { supabase } from '../services/supabase.js';

export const AuthContext = createContext(null);

const payload = (response) => response.data.data;
const cachedSession = getSessionCache();
const cachedProfile = getProfileCache();

const rememberSession = (session) => {
  setAccessToken(session?.access_token ?? null);
  setSessionCache(session ?? null);
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(cachedSession);
  const [profile, setProfile] = useState(cachedProfile);
  const [loading, setLoading] = useState(!cachedSession);
  const [profileLoading, setProfileLoading] = useState(false);

  const refreshProfile = useCallback(async () => {
    try {
      const nextProfile = payload(await api.get('/auth/me')).profile;
      setProfile(nextProfile);
      setProfileCache(nextProfile);
      return nextProfile;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      rememberSession(data.session);
      setSession(data.session);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      if (event === 'SIGNED_OUT') {
        clearAuthCache();
        setProfile(null);
      }
      rememberSession(nextSession);
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;

    if (!userId) {
      setProfile(null);
      return undefined;
    }

    let active = true;
    const needsProfile = !profile || profile.id !== userId;

    if (needsProfile) setProfileLoading(true);

    api
      .get('/auth/me')
      .then((response) => {
        if (!active) return;
        const nextProfile = payload(response).profile;
        setProfile(nextProfile);
        setProfileCache(nextProfile);
      })
      .catch(() => {
        if (active && needsProfile) setProfile(null);
      })
      .finally(() => {
        if (active && needsProfile) setProfileLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    const token = session?.access_token;
    if (!token) {
      disconnectRealtime();
      return undefined;
    }
    connectRealtime(token);
    return () => disconnectRealtime();
  }, [session?.access_token]);

  const signIn = async (email, password) => {
    const result = payload(await api.post('/auth/login', { email, password }));
    if (!result.session) throw new Error('Sign in did not return a session. Confirm your email and try again.');
    const { data, error } = await supabase.auth.setSession(result.session);
    if (error) throw new Error(error.message);
    rememberSession(data.session);
    setSession(data.session);
    return result;
  };

  const signUp = async ({ fullName, email, password }) => {
    const result = payload(await api.post('/auth/register', { fullName, email, password }));
    if (!result.session) return result;

    const { data, error } = await supabase.auth.setSession(result.session);
    if (error) throw new Error(error.message);
    rememberSession(data.session);
    setSession(data.session);
    return result;
  };

  const signOut = async () => {
    await api.post('/auth/logout').catch(() => null);
    await supabase.auth.signOut();
    clearAuthCache();
    setSession(null);
    setProfile(null);
  };

  const requestPasswordReset = async (email) => {
    await api.post('/auth/forgot-password', { email });
  };

  const resetPassword = async (password) => {
    await api.post('/auth/reset-password', { password });
  };

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      role: profile?.role ?? null,
      isAdmin: profile?.role === 'admin',
      loading,
      profileLoading,
      signIn,
      signUp,
      signOut,
      requestPasswordReset,
      resetPassword,
      refreshProfile,
    }),
    [session, profile, loading, profileLoading, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
