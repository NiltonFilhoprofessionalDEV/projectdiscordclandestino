import type { FriendEntry } from "../hooks/useFriends.ts";

export type CallFriendRelation =
  | { kind: "self" }
  | { kind: "accepted" }
  | { kind: "outgoing" }
  | { kind: "incoming"; friendshipId: string }
  | { kind: "none" };

export function callFriendRelation(
  identity: string,
  isLocal: boolean,
  friends: readonly Pick<FriendEntry, "userId">[],
  incoming: readonly Pick<FriendEntry, "userId" | "friendshipId">[],
  outgoing: readonly Pick<FriendEntry, "userId">[] = [],
): CallFriendRelation {
  if (isLocal) {
    return { kind: "self" };
  }
  if (friends.some((entry) => entry.userId === identity)) {
    return { kind: "accepted" };
  }
  const received = incoming.find((entry) => entry.userId === identity);
  if (received) {
    return { kind: "incoming", friendshipId: received.friendshipId };
  }
  if (outgoing.some((entry) => entry.userId === identity)) {
    return { kind: "outgoing" };
  }
  return { kind: "none" };
}
