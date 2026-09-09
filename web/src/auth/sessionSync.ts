import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../services/supabase.ts";
import type { Profile } from "./types.ts";

export type SessionSink = {
  isCancelled: () => boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
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

export async function applySession(next: Session | null, sink: SessionSink) {
  if (sink.isCancelled()) {
    return;
  }
  sink.setSession(next);
  sink.setUser(next?.user ?? null);
  if (!next?.user) {
    sink.setProfile(null);
    sink.setError(null);
    return;
  }
  const nextProfile = await fetchProfile(next.user.id);
  if (sink.isCancelled()) {
    return;
  }
  if (!nextProfile) {
    sink.setProfile(null);
    sink.setError("Não foi possível carregar seu perfil.");
    return;
  }
  sink.setProfile(nextProfile);
  sink.setError(null);
}

export async function restoreSession(sink: SessionSink) {
  const { data, error } = await supabase.auth.getSession();
  if (sink.isCancelled()) {
    return;
  }
  if (error) {
    sink.setSession(null);
    sink.setUser(null);
    sink.setProfile(null);
    sink.setError("Não foi possível restaurar a sessão.");
    sink.setLoading(false);
    return;
  }
  await applySession(data.session, sink);
  if (!sink.isCancelled()) {
    sink.setLoading(false);
  }
}
