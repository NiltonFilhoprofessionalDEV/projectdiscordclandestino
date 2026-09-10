import { supabase } from "./supabase.ts";
import { uploadUserPhoto } from "./avatar.ts";

const MAX_PHOTOS = 8;

export type PublicProfile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  photoUrls: string[];
  presence: string | null;
  activity: string | null;
  lastSeenAt: string | null;
};

type ProfileRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  photo_urls: string[] | null;
  presence: string | null;
  activity: string | null;
  last_seen_at: string | null;
};

function toPublic(row: ProfileRow): PublicProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    photoUrls: (row.photo_urls ?? []).filter((url) => typeof url === "string" && url.length > 0),
    presence: row.presence,
    activity: row.activity,
    lastSeenAt: row.last_seen_at,
  };
}

export async function fetchPublicProfile(userId: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, photo_urls, presence, activity, last_seen_at")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) {
    return null;
  }
  return toPublic(data as ProfileRow);
}

export async function addProfilePhoto(userId: string, file: File): Promise<PublicProfile> {
  const current = await fetchPublicProfile(userId);
  if (!current) {
    throw new Error("Perfil não encontrado.");
  }
  if (current.photoUrls.length >= MAX_PHOTOS) {
    throw new Error(`Você pode enviar até ${MAX_PHOTOS} fotos.`);
  }
  const url = await uploadUserPhoto(userId, file);
  const photoUrls = [...current.photoUrls, url];
  const { data, error } = await supabase
    .from("profiles")
    .update({ photo_urls: photoUrls, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select("id, display_name, avatar_url, photo_urls, presence, activity, last_seen_at")
    .maybeSingle();
  if (error || !data) {
    throw new Error("Não foi possível salvar a foto.");
  }
  return toPublic(data as ProfileRow);
}

export { MAX_PHOTOS };
