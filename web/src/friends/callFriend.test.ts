import { describe, expect, it } from "vitest";
import { callFriendRelation } from "./callFriend.ts";

describe("callFriendRelation", () => {
  it("skips the local participant", () => {
    expect(callFriendRelation("a", true, [], [], [])).toEqual({ kind: "self" });
  });

  it("detects accepted friends, outgoing and incoming requests", () => {
    expect(
      callFriendRelation("a", false, [{ userId: "a" }], [], []),
    ).toEqual({ kind: "accepted" });
    expect(
      callFriendRelation("b", false, [], [], [{ userId: "b" }]),
    ).toEqual({ kind: "outgoing" });
    expect(
      callFriendRelation("c", false, [], [{ userId: "c", friendshipId: "f1" }], []),
    ).toEqual({ kind: "incoming", friendshipId: "f1" });
  });

  it("offers add when there is no relationship", () => {
    expect(callFriendRelation("z", false, [{ userId: "a" }], [], [])).toEqual({ kind: "none" });
  });
});
