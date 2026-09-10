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

function avatarFromUser(user: User): string | null {
  const meta = user.user_metadata ?? {};
  const value = meta.avatar_url ?? meta.picture;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function syncAvatar(user: User, profile: Profile): Promise<Profile> {
  // Don't overwrite a custom/uploaded avatar with the Google picture.
  if (profile.avatar_url) {
    return profile;
  }
  const avatarUrl = avatarFromUser(user);
  if (!avatarUrl) {
    return profile;
  }
  const { data } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select("id, display_name, avatar_url, created_at, updated_at")
    .maybeSingle();
  return data ?? { ...profile, avatar_url: avatarUrl };
}

export function applyAuthSnapshot(next: Session | null, sink: SessionSink) {
  if (sink.isCancelled()) {
    return;
  }
  sink.setSession(next);
  sink.setUser(next?.user ?? null);
  if (!next?.user) {
    sink.setProfile(null);
    sink.setError(null);
    sink.setLoading(false);
    return;
  }
  // Keep the gate on "Carregando sessão…" until loadUserProfile finishes.
  sink.setLoading(true);
}

export async function loadUserProfile(user: User, sink: SessionSink) {
  if (sink.isCancelled()) {
    return;
  }
  const loaded = await fetchProfile(user.id);
  if (sink.isCancelled()) {
    return;
  }
  if (!loaded) {
    sink.setProfile(null);
    sink.setError("Não foi possível carregar seu perfil.");
    sink.setLoading(false);
    return;
  }
  const nextProfile = await syncAvatar(user, loaded);
  if (sink.isCancelled()) {
    return;
  }
  sink.setProfile(nextProfile);
  sink.setError(null);
  sink.setLoading(false);
}

/** Bootstrap from storage/URL — do not rely only on onAuthStateChange INITIAL_SESSION. */
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
  applyAuthSnapshot(data.session, sink);
}


