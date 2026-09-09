import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import type { Database } from "../../../shared/database.types.ts";
import { supabase } from "../services/supabase.ts";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

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

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) {
    return null;
  }
  return data;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function applySession(next: Session | null) {
      if (cancelled) {
        return;
      }
      setSession(next);
      setUser(next?.user ?? null);
      if (!next?.user) {
        setProfile(null);
        setError(null);
        return;
      }
      const nextProfile = await fetchProfile(next.user.id);
      if (cancelled) {
        return;
      }
      if (!nextProfile) {
        setProfile(null);
        setError("Não foi possível carregar seu perfil.");
        return;
      }
      setProfile(nextProfile);
      setError(null);
    }

    async function restore() {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (cancelled) {
        return;
      }
      if (sessionError) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setError("Não foi possível restaurar a sessão.");
        setLoading(false);
        return;
      }
      await applySession(data.session);
      if (!cancelled) {
        setLoading(false);
      }
    }

    void restore();

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession);
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
