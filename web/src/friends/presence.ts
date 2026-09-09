import type { FriendEntry } from "../hooks/useFriends.ts";

export function enrichFriendsWithCallPresence(
  friends: FriendEntry[],
  liveParticipantIds: ReadonlySet<string>,
  voiceLabel: string | null,
  occupancyIds: ReadonlySet<string> = new Set(),
): FriendEntry[] {
  if (liveParticipantIds.size === 0 && occupancyIds.size === 0) {
    return friends;
  }
  return friends.map((entry) => {
    if (liveParticipantIds.has(entry.userId)) {
      return {
        ...entry,
        presence: "in_voice",
        activity: voiceLabel ? `Em voz: ${voiceLabel}` : entry.activity ?? "Em chamada",
      };
    }
    if (occupancyIds.has(entry.userId) && entry.presence !== "in_voice") {
      return {
        ...entry,
        presence: "in_voice",
        activity: entry.activity ?? "Em chamada",
      };
    }
    return entry;
  });
}

export function occupancyIdentitySet(
  byChannel: Record<string, ReadonlyArray<{ identity: string }>>,
): Set<string> {
  const ids = new Set<string>();
  for (const occupants of Object.values(byChannel)) {
    for (const occupant of occupants) {
      ids.add(occupant.identity);
    }
  }
  return ids;
}
