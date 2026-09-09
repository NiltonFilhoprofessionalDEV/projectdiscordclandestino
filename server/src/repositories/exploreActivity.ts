import type { ApiResult } from "../../../shared/api.ts";
import type { MemberPresenceRow, VoiceChannelRow } from "../../../shared/exploreActivity.ts";
import type { DbClient } from "./client.ts";
import { mapRepositoryError } from "./errors.ts";

export type ExploreActivity = {
  members: MemberPresenceRow[];
  voiceChannels: VoiceChannelRow[];
};

function profileFromMember(row: {
  community_id: string;
  profiles:
    | { presence: string | null; last_seen_at: string | null }
    | { presence: string | null; last_seen_at: string | null }[]
    | null;
}): MemberPresenceRow {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    communityId: row.community_id,
    presence: profile?.presence ?? null,
    lastSeenAt: profile?.last_seen_at ?? null,
  };
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
        .select("community_id, profiles(presence, last_seen_at)")
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

  return {
    ok: true,
    data: {
      members: (members ?? []).map(profileFromMember),
      voiceChannels: (channels ?? []).map((row) => ({
        communityId: row.community_id,
        channelId: row.id,
        name: row.name,
      })),
    },
  };
}
