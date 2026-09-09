import { describe, expect, it } from "vitest";
import type { FriendEntry } from "../hooks/useFriends.ts";
import { enrichFriendsWithCallPresence } from "./presence.ts";

function friend(partial: Partial<FriendEntry> & Pick<FriendEntry, "userId">): FriendEntry {
  return {
    friendshipId: "f1",
    displayName: "Amigo",
    avatarUrl: null,
    presence: "offline",
    activity: null,
    direction: "accepted",
    ...partial,
  };
}

describe("enrichFriendsWithCallPresence", () => {
  it("marks friends in the same LiveKit room as in_voice", () => {
    const result = enrichFriendsWithCallPresence(
      [friend({ userId: "a" }), friend({ userId: "b", presence: "online" })],
      new Set(["a"]),
      "Estudos",
    );
    expect(result[0]?.presence).toBe("in_voice");
    expect(result[0]?.activity).toBe("Em voz: Estudos");
    expect(result[1]?.presence).toBe("online");
  });
});
