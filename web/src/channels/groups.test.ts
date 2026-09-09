import { describe, expect, it } from "vitest";
import type { Channel } from "../../../shared/api.ts";
import type { ChannelId, CommunityId } from "../../../shared/community.ts";
import { groupChannels } from "./groups.ts";

function channel(overrides: Partial<Channel> & Pick<Channel, "id" | "name" | "type" | "position">): Channel {
  return {
    communityId: "c1" as CommunityId,
    companionTextChannelId: null,
    ...overrides,
  };
}

describe("groupChannels", () => {
  it("groups text and voice channels and keeps position order", () => {
    const laterText = channel({
      id: "t2" as ChannelId,
      name: "dev",
      type: "text",
      position: 1,
    });
    const voice = channel({
      id: "v1" as ChannelId,
      name: "geral",
      type: "voice",
      position: 0,
    });
    const firstText = channel({
      id: "t1" as ChannelId,
      name: "geral",
      type: "text",
      position: 0,
    });

    const grouped = groupChannels([laterText, voice, firstText]);

    expect(grouped.text.map((item) => item.name)).toEqual(["geral", "dev"]);
    expect(grouped.voice.map((item) => item.name)).toEqual(["geral"]);
  });
});
