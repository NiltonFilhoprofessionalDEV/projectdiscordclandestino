import { describe, expect, it } from "vitest";
import type { CommunitySummary } from "./api.ts";
import type { CommunityId } from "./community.ts";
import {
  attachExplorePresence,
  isLivePresence,
  visibleExploreRooms,
} from "./exploreActivity.ts";

const NOW = Date.parse("2026-09-09T22:00:00.000Z");

function summary(id: string, name: string): CommunitySummary {
  return {
    id: id as CommunityId,
    name,
    slug: name.toLowerCase(),
    visibility: "public",
    role: "member",
    avatarUrl: null,
    onlineCount: 0,
    activeRooms: [],
  };
}

describe("isLivePresence", () => {
  it("counts online and in-voice members seen within two minutes", () => {
    expect(isLivePresence("online", "2026-09-09T21:59:00.000Z", NOW)).toBe(true);
    expect(isLivePresence("in_voice", "2026-09-09T21:59:30.000Z", NOW)).toBe(true);
    expect(isLivePresence("offline", "2026-09-09T21:59:00.000Z", NOW)).toBe(false);
    expect(isLivePresence("online", "2026-09-09T21:50:00.000Z", NOW)).toBe(false);
  });
});

describe("attachExplorePresence", () => {
  it("attaches online counts and occupied voice rooms without leaking empty rooms", () => {
    const next = attachExplorePresence(
      [summary("c1", "Arena"), summary("c2", "Quiet")],
      [
        { communityId: "c1", presence: "online", lastSeenAt: "2026-09-09T21:59:00.000Z" },
        { communityId: "c1", presence: "in_voice", lastSeenAt: "2026-09-09T21:59:10.000Z" },
        { communityId: "c1", presence: "offline", lastSeenAt: "2026-09-09T21:59:00.000Z" },
        { communityId: "c2", presence: "online", lastSeenAt: "2026-09-09T21:50:00.000Z" },
      ],
      [
        { communityId: "c1", channelId: "v1", name: "WARZONE" },
        { communityId: "c1", channelId: "v2", name: "Lobby" },
        { communityId: "c2", channelId: "v3", name: "Geral" },
      ],
      {
        v1: [{ identity: "a" }, { identity: "b" }],
        v2: [],
        v3: [],
      },
      NOW,
    );

    expect(next[0]).toMatchObject({
      id: "c1",
      onlineCount: 2,
      activeRooms: [{ name: "WARZONE", occupantCount: 2 }],
    });
    expect(next[1]).toMatchObject({ id: "c2", onlineCount: 0, activeRooms: [] });
  });
});

describe("visibleExploreRooms", () => {
  it("shows two rooms and the leftover count", () => {
    expect(
      visibleExploreRooms([
        { name: "A", occupantCount: 1 },
        { name: "B", occupantCount: 4 },
        { name: "C", occupantCount: 2 },
      ]),
    ).toEqual({
      shown: [
        { name: "A", occupantCount: 1 },
        { name: "B", occupantCount: 4 },
      ],
      extra: 1,
    });
  });
});
