import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { applySession, restoreSession, type SessionSink } from "./sessionSync.ts";
import { supabase } from "../services/supabase.ts";
import type { Profile } from "./types.ts";

export type { Profile };

export type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

function createSink(
  isCancelled: () => boolean,
  setSession: (session: Session | null) => void,
  setUser: (user: User | null) => void,
  setProfile: (profile: Profile | null) => void,
  setError: (error: string | null) => void,
  setLoading: (loading: boolean) => void,
): SessionSink {
  return { isCancelled, setSession, setUser, setProfile, setError, setLoading };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const sink = createSink(
      () => cancelled,
      setSession,
      setUser,
      setProfile,
      setError,
      setLoading,
    );
    void restoreSession(sink);
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      void applySession(next, sink);
    });
    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ session, user, profile, loading, error, signOut }),
    [session, user, profile, loading, error, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
