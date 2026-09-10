import { supabase } from "./supabase.ts";

export type PublicProfile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  presence: string | null;
  activity: string | null;
  lastSeenAt: string | null;
};

type ProfileRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  presence: string | null;
  activity: string | null;
  last_seen_at: string | null;
};

function toPublic(row: ProfileRow): PublicProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    presence: row.presence,
    activity: row.activity,
    lastSeenAt: row.last_seen_at,
  };
}

export async function fetchPublicProfile(userId: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, presence, activity, last_seen_at")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) {
    return null;
  }
  return toPublic(data as ProfileRow);
}
