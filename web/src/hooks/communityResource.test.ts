import { describe, expect, it } from "vitest";
import type { Channel } from "../../../shared/api.ts";
import type { ChannelId, CommunityId } from "../../../shared/community.ts";
import { beginCommunityResourceLoad, nextActiveTextChannelId } from "./communityResource.ts";

const channel = (id: string, communityId: string): Channel => ({
  id: id as ChannelId,
  communityId: communityId as CommunityId,
  name: id,
  type: "text",
  position: 0,
  companionTextChannelId: null,
});

describe("beginCommunityResourceLoad", () => {
  it("clears items and enters loading when a community is selected", () => {
    expect(beginCommunityResourceLoad("c2")).toEqual({
      items: [],
      status: "loading",
      error: null,
    });
  });

  it("returns idle and empty when no community is selected", () => {
    expect(beginCommunityResourceLoad(null)).toEqual({
      items: [],
      status: "idle",
      error: null,
    });
  });
});

describe("nextActiveTextChannelId", () => {
  it("does not replace the text channel while the new community is loading", () => {
    const previous = channel("old", "c1");
    expect(nextActiveTextChannelId("loading", [], previous.id)).toBe(previous.id);
  });

  it("selects the first text channel of the ready community when the current id is absent", () => {
    const next = channel("new", "c2");
    expect(nextActiveTextChannelId("ready", [next], "old" as ChannelId)).toBe(next.id);
  });
});
