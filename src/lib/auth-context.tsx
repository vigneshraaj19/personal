import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { fetchMyProfile } from './auth-api';
import type { Profile } from './types';

// No Supabase Auth session anymore — "being logged in" just means we
// have a user id stashed locally and a matching row in `users`.
const STORAGE_KEY = 'jira_clone_user_id';

interface AuthContextValue {
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  /** Call after a successful signIn()/signUp()/adminCreateUser() to log this browser in as that user. */
  setCurrentUser: (profile: Profile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedId = localStorage.getItem(STORAGE_KEY);
    if (!storedId) {
      setLoading(false);
      return;
    }
    fetchMyProfile(storedId)
      .then((p) => setProfile(p))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const p = await fetchMyProfile(profile.id);
      setProfile(p);
    } catch {
      // keep the last known profile on a transient fetch error
    }
  }, [profile?.id]);

  const setCurrentUser = useCallback((p: Profile) => {
    localStorage.setItem(STORAGE_KEY, p.id);
    setProfile(p);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setProfile(null);
  }, []);

  const value: AuthContextValue = {
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    refreshProfile,
    setCurrentUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
