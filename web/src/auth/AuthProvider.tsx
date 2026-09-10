import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { applyAuthSnapshot, loadUserProfile, restoreSession, type SessionSink } from "./sessionSync.ts";
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
  updateProfile: (input: {
    displayName: string;
    avatarUrl: string | null;
  }) => Promise<string | null>;
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

const SESSION_LOAD_TIMEOUT_MS = 12_000;

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
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      applyAuthSnapshot(next, sink, event);
    });
    const timeoutId = window.setTimeout(() => {
      if (cancelled) {
        return;
      }
      setLoading((stillLoading) => {
        if (!stillLoading) {
          return stillLoading;
        }
        setError((current) => current ?? "A sessão demorou para carregar. Tente de novo.");
        return false;
      });
    }, SESSION_LOAD_TIMEOUT_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }
    const currentUser = user;
    let cancelled = false;
    const sink = createSink(
      () => cancelled,
      setSession,
      setUser,
      setProfile,
      setError,
      setLoading,
    );
    void loadUserProfile(currentUser, sink);
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const updateProfile = useCallback(
    async (input: {
      displayName: string;
      avatarUrl: string | null;
    }) => {
      if (!user) {
        return "Sessão inválida.";
      }
      const { data, error: updateError } = await supabase
        .from("profiles")
        .update({
          display_name: input.displayName,
          avatar_url: input.avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select("id, display_name, avatar_url, created_at, updated_at")
        .maybeSingle();
      if (updateError || !data) {
        return "Não foi possível salvar o perfil.";
      }
      setProfile((current) => (current ? { ...current, ...data } : data));
      return null;
    },
    [user],
  );

  const value = useMemo(
    () => ({ session, user, profile, loading, error, signOut, updateProfile }),
    [error, loading, profile, session, signOut, updateProfile, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
