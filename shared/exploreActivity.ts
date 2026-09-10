import type { ActiveVoiceRoom, CommunitySummary } from "./api.ts";

export const PRESENCE_STALE_MS = 120_000;

export type MemberPresenceRow = {
  communityId: string;
  userId: string;
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

function occupantIdentity(value: unknown): string | null {
  if (!value || typeof value !== "object" || !("identity" in value)) {
    return null;
  }
  const identity = (value as { identity: unknown }).identity;
  return typeof identity === "string" && identity.length > 0 ? identity : null;
}

function addOnlineUser(online: Map<string, Set<string>>, communityId: string, userId: string) {
  const users = online.get(communityId) ?? new Set<string>();
  users.add(userId);
  online.set(communityId, users);
}

export function attachExplorePresence(
  summaries: CommunitySummary[],
  members: MemberPresenceRow[],
  voiceChannels: VoiceChannelRow[],
  occupantsByChannel: Record<string, readonly unknown[]>,
  nowMs = Date.now(),
): CommunitySummary[] {
  const online = new Map<string, Set<string>>();
  for (const row of members) {
    if (!row.userId || !isLivePresence(row.presence, row.lastSeenAt, nowMs)) {
      continue;
    }
    addOnlineUser(online, row.communityId, row.userId);
  }

  const rooms = new Map<string, ActiveVoiceRoom[]>();
  for (const channel of voiceChannels) {
    const occupants = occupantsByChannel[channel.channelId] ?? [];
    for (const occupant of occupants) {
      const identity = occupantIdentity(occupant);
      if (identity) {
        addOnlineUser(online, channel.communityId, identity);
      }
    }
    if (occupants.length === 0) {
      continue;
    }
    const list = rooms.get(channel.communityId) ?? [];
    list.push({ name: channel.name, occupantCount: occupants.length });
    rooms.set(channel.communityId, list);
  }

  return summaries.map((item) => ({
    ...item,
    onlineCount: online.get(item.id)?.size ?? 0,
    activeRooms: rooms.get(item.id) ?? [],
  }));
}
