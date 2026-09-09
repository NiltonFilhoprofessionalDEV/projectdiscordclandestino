import type { FriendEntry } from "../hooks/useFriends.ts";

export function enrichFriendsWithCallPresence(
  friends: FriendEntry[],
  liveParticipantIds: ReadonlySet<string>,
  voiceLabel: string | null,
): FriendEntry[] {
  if (liveParticipantIds.size === 0) {
    return friends;
  }
  return friends.map((entry) => {
    if (!liveParticipantIds.has(entry.userId)) {
      return entry;
    }
    return {
      ...entry,
      presence: "in_voice",
      activity: voiceLabel ? `Em voz: ${voiceLabel}` : entry.activity ?? "Em chamada",
    };
  });
}
