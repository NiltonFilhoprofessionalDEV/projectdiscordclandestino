import { describe, expect, it } from "vitest";
import type { Channel } from "../../../shared/api.ts";
import type { ChannelId, CommunityId } from "../../../shared/community.ts";
import { centerSurfaceLabel } from "./selection.ts";

const text: Channel = {
  id: "t1" as ChannelId,
  communityId: "c1" as CommunityId,
  name: "geral",
  type: "text",
  position: 0,
  companionTextChannelId: null,
};

const voice: Channel = {
  id: "v1" as ChannelId,
  communityId: "c1" as CommunityId,
  name: "voz-geral",
  type: "voice",
  position: 0,
  companionTextChannelId: "t1" as ChannelId,
};

describe("centerSurfaceLabel", () => {
  it("names Explore independently of an active voice channel", () => {
    expect(
      centerSurfaceLabel({
        surface: "explore",
        textChannel: text,
        voiceChannel: voice,
      }),
    ).toBe("Explore");
  });

  it("names the selected text channel while voice can remain connected", () => {
    expect(
      centerSurfaceLabel({
        surface: "text",
        textChannel: text,
        voiceChannel: voice,
      }),
    ).toBe("#geral");
  });

  it("names the selected voice channel when it is the center surface", () => {
    expect(
      centerSurfaceLabel({
        surface: "voice",
        textChannel: text,
        voiceChannel: voice,
      }),
    ).toBe("voz-geral");
  });

  it("names a public preview without pretending the user joined", () => {
    expect(
      centerSurfaceLabel({
        surface: "preview",
        textChannel: text,
        voiceChannel: voice,
      }),
    ).toBe("Não membro");
  });
});
