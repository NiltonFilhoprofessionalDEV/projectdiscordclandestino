import type {
  ApiResult,
  Channel,
  Community,
  CommunityMembership,
  CommunitySummary,
  CreateChannelInput,
  CreateCommunityInput,
  CreatedInvite,
  LiveKitTokenInput,
  LiveKitTokenResponse,
  UpdateChannelInput,
} from "../../../shared/api.ts";
import type { ChannelId, CommunityId, CommunityRole } from "../../../shared/community.ts";
import type { RoomId } from "../../../shared/rooms.ts";
import { supabase } from "./supabase.ts";

export type RoomOccupancy = {
  id: RoomId;
  label: string;
  occupantCount: number;
};

export type CommunityMember = {
  userId: string;
  displayName: string;
  role: CommunityRole;
};

const INTERNAL_ERROR: ApiResult<never> = {
  ok: false,
  error: { code: "INTERNAL", message: "Não foi possível concluir a operação." },
};

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  try {
    const response = await fetch(path, {
      ...init,
      headers: {
        ...init?.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const body = (await response.json()) as ApiResult<T>;
    if (body && typeof body === "object" && "ok" in body) {
      return body;
    }
    return INTERNAL_ERROR;
  } catch {
    return INTERNAL_ERROR;
  }
}

export async function fetchRooms(): Promise<RoomOccupancy[]> {
  const res = await fetch("/api/rooms");
  if (!res.ok) {
    throw new Error("Não foi possível carregar as salas.");
  }
  const body = (await res.json()) as { rooms: RoomOccupancy[] };
  return body.rooms;
}

export function fetchCommunities() {
  return apiRequest<CommunitySummary[]>("/api/communities");
}

export function createCommunity(input: CreateCommunityInput) {
  return apiRequest<Community>("/api/communities", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function createChannel(communityId: CommunityId, input: CreateChannelInput) {
  return apiRequest<Channel>(`/api/communities/${communityId}/channels`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateChannel(channelId: ChannelId, input: UpdateChannelInput) {
  return apiRequest<Channel>(`/api/channels/${channelId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function fetchLiveKitToken(channelId: ChannelId) {
  const body: LiveKitTokenInput = { channelId };
  return apiRequest<LiveKitTokenResponse>("/api/livekit/token", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function createInvite(communityId: CommunityId) {
  return apiRequest<CreatedInvite>(`/api/communities/${communityId}/invites`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function acceptInvite(token: string) {
  return apiRequest<CommunityMembership>(
    `/api/invites/${encodeURIComponent(token)}/accept`,
    { method: "POST", body: JSON.stringify({}) },
  );
}

function mapChannel(row: {
  id: string;
  community_id: string;
  name: string;
  type: Channel["type"];
  position: number;
  companion_text_channel_id: string | null;
}): Channel {
  return {
    id: row.id as ChannelId,
    communityId: row.community_id as CommunityId,
    name: row.name,
    type: row.type,
    position: row.position,
    companionTextChannelId: row.companion_text_channel_id as ChannelId | null,
  };
}

export async function fetchCommunityChannels(
  communityId: CommunityId,
): Promise<ApiResult<Channel[]>> {
  const { data, error } = await supabase
    .from("channels")
    .select("id, community_id, name, type, position, companion_text_channel_id")
    .eq("community_id", communityId)
    .order("position", { ascending: true });
  if (error) {
    return { ok: false, error: { code: "INTERNAL", message: "Não foi possível carregar os canais." } };
  }
  return { ok: true, data: (data ?? []).map(mapChannel) };
}

export async function fetchCommunityMembers(
  communityId: CommunityId,
): Promise<ApiResult<CommunityMember[]>> {
  const { data, error } = await supabase
    .from("community_members")
    .select("user_id, role, profiles(display_name)")
    .eq("community_id", communityId);
  if (error) {
    return { ok: false, error: { code: "INTERNAL", message: "Não foi possível carregar os membros." } };
  }
  const members = (data ?? []).map((row) => {
    const profile = row.profiles as { display_name: string } | { display_name: string }[] | null;
    const named = Array.isArray(profile) ? profile[0] : profile;
    return {
      userId: row.user_id,
      displayName: named?.display_name?.trim() || "Usuário",
      role: row.role,
    };
  });
  members.sort((a, b) => a.displayName.localeCompare(b.displayName, "pt-BR"));
  return { ok: true, data: members };
}
