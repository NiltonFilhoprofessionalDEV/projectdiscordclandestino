import { describe, expect, it } from "vitest";
import type { Channel } from "../../../shared/api.ts";
import type { ChannelId, CommunityId } from "../../../shared/community.ts";
import { companionChatChannelId } from "./channel.ts";

const textId = "text-1" as ChannelId;
const companionId = "companion-1" as ChannelId;

const voice: Channel = {
  id: "voice-1" as ChannelId,
  communityId: "com-1" as CommunityId,
  name: "Geral",
  type: "voice",
  position: 1,
  companionTextChannelId: companionId,
};

describe("companionChatChannelId", () => {
  it("uses the selected text channel when the center is text", () => {
    expect(companionChatChannelId("text", textId, voice)).toBe(textId);
  });

  it("uses the voice companion channel when the center is voice", () => {
    expect(companionChatChannelId("voice", textId, voice)).toBe(companionId);
  });

  it("returns null when a voice channel has no companion", () => {
    expect(
      companionChatChannelId("voice", textId, { ...voice, companionTextChannelId: null }),
    ).toBeNull();
  });

  it("returns null on explore and preview", () => {
    expect(companionChatChannelId("explore", textId, voice)).toBeNull();
    expect(companionChatChannelId("preview", textId, voice)).toBeNull();
  });
});
