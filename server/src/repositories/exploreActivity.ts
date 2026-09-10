import type { ApiResult } from "../../../shared/api.ts";
import type { MemberPresenceRow, VoiceChannelRow } from "../../../shared/exploreActivity.ts";
import type { DbClient } from "./client.ts";
import { mapRepositoryError } from "./errors.ts";

export type ExploreActivity = {
  members: MemberPresenceRow[];
  voiceChannels: VoiceChannelRow[];
};

type ProfilePresence = {
  id: string;
  presence: string | null;
  last_seen_at: string | null;
};

async function listMemberProfiles(
  client: DbClient,
  userIds: string[],
): Promise<ApiResult<Map<string, ProfilePresence>>> {
  const byId = new Map<string, ProfilePresence>();
  if (userIds.length === 0) {
    return { ok: true, data: byId };
  }

  const { data, error } = await client
    .from("profiles")
    .select("id, presence, last_seen_at")
    .in("id", userIds);
  if (error) {
    return mapRepositoryError(error);
  }
  for (const row of data ?? []) {
    byId.set(row.id, row);
  }
  return { ok: true, data: byId };
}

export async function listExploreActivity(
  client: DbClient,
  communityIds: string[],
): Promise<ApiResult<ExploreActivity>> {
  if (communityIds.length === 0) {
    return { ok: true, data: { members: [], voiceChannels: [] } };
  }

  const [{ data: members, error: memberError }, { data: channels, error: channelError }] =
    await Promise.all([
      client
        .from("community_members")
        .select("community_id, user_id")
        .in("community_id", communityIds),
      client
        .from("channels")
        .select("id, community_id, name")
        .in("community_id", communityIds)
        .eq("type", "voice")
        .order("position", { ascending: true }),
    ]);

  if (memberError) {
    return mapRepositoryError(memberError);
  }
  if (channelError) {
    return mapRepositoryError(channelError);
  }

  const memberRows = members ?? [];
  const profiles = await listMemberProfiles(
    client,
    [...new Set(memberRows.map((row) => row.user_id))],
  );
  if (!profiles.ok) {
    return profiles;
  }

  return {
    ok: true,
    data: {
      members: memberRows.map((row) => {
        const profile = profiles.data.get(row.user_id);
        return {
          communityId: row.community_id,
          userId: row.user_id,
          presence: profile?.presence ?? null,
          lastSeenAt: profile?.last_seen_at ?? null,
        };
      }),
      voiceChannels: (channels ?? []).map((row) => ({
        communityId: row.community_id,
        channelId: row.id,
        name: row.name,
      })),
    },
  };
}
