import { describe, expect, it } from "vitest";
import type { FriendEntry } from "../hooks/useFriends.ts";
import { enrichFriendsWithCallPresence, occupancyIdentitySet } from "./presence.ts";

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

  it("marks friends present in community voice occupancy as in_voice", () => {
    const result = enrichFriendsWithCallPresence(
      [friend({ userId: "a" }), friend({ userId: "b" })],
      new Set(),
      null,
      new Set(["b"]),
    );
    expect(result[0]?.presence).toBe("offline");
    expect(result[1]?.presence).toBe("in_voice");
    expect(result[1]?.activity).toBe("Em chamada");
  });
});

describe("occupancyIdentitySet", () => {
  it("flattens occupant identities across channels", () => {
    expect(
      occupancyIdentitySet({
        c1: [{ identity: "a" }],
        c2: [{ identity: "b" }, { identity: "a" }],
      }),
    ).toEqual(new Set(["a", "b"]));
  });
});
