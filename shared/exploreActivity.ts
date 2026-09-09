import type { ActiveVoiceRoom, CommunitySummary } from "./api.ts";

export const PRESENCE_STALE_MS = 120_000;

export type MemberPresenceRow = {
  communityId: string;
  presence: string | null;
  lastSeenAt: string | null;
};

export type VoiceChannelRow = {
  communityId: string;
  channelId: string;
  name: string;
};

export function isLivePresence(
  presence: string | null | undefined,
  lastSeenAt: string | null | undefined,
  nowMs = Date.now(),
): boolean {
  if (presence !== "online" && presence !== "in_voice") {
    return false;
  }
  if (!lastSeenAt) {
    return false;
  }
  const age = nowMs - new Date(lastSeenAt).getTime();
  return !Number.isNaN(age) && age <= PRESENCE_STALE_MS;
}

export function visibleExploreRooms(rooms: ActiveVoiceRoom[], limit = 2) {
  const occupied = rooms.filter((room) => room.occupantCount > 0);
  return {
    shown: occupied.slice(0, limit),
    extra: Math.max(0, occupied.length - limit),
  };
}

export function attachExplorePresence(
  summaries: CommunitySummary[],
  members: MemberPresenceRow[],
  voiceChannels: VoiceChannelRow[],
  occupantsByChannel: Record<string, readonly unknown[]>,
  nowMs = Date.now(),
): CommunitySummary[] {
  const online = new Map<string, number>();
  for (const row of members) {
    if (!isLivePresence(row.presence, row.lastSeenAt, nowMs)) {
      continue;
    }
    online.set(row.communityId, (online.get(row.communityId) ?? 0) + 1);
  }

  const rooms = new Map<string, ActiveVoiceRoom[]>();
  for (const channel of voiceChannels) {
    const occupantCount = occupantsByChannel[channel.channelId]?.length ?? 0;
    if (occupantCount === 0) {
      continue;
    }
    const list = rooms.get(channel.communityId) ?? [];
    list.push({ name: channel.name, occupantCount });
    rooms.set(channel.communityId, list);
  }

  return summaries.map((item) => ({
    ...item,
    onlineCount: online.get(item.id) ?? 0,
    activeRooms: rooms.get(item.id) ?? [],
  }));
}
