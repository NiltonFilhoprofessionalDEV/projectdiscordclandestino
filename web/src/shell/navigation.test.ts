import { describe, expect, it } from "vitest";
import type { ChannelId } from "../../../shared/community.ts";
import {
  applyLeaveVoice,
  applySelectText,
  initialShellNav,
} from "./navigation.ts";

const text = "text-1" as ChannelId;
const voice = "voice-1" as ChannelId;

describe("applySelectText", () => {
  it("does not clear the active voice channel", () => {
    const next = applySelectText(
      { ...initialShellNav, activeVoiceChannelId: voice, surface: "voice" },
      text,
    );
    expect(next.activeTextChannelId).toBe(text);
    expect(next.activeVoiceChannelId).toBe(voice);
    expect(next.surface).toBe("text");
  });
});

describe("applyLeaveVoice", () => {
  it("clears only voice state and keeps the text channel", () => {
    const next = applyLeaveVoice({
      ...initialShellNav,
      activeVoiceChannelId: voice,
      activeTextChannelId: text,
      surface: "voice",
    });
    expect(next.activeVoiceChannelId).toBeNull();
    expect(next.activeTextChannelId).toBe(text);
    expect(next.surface).toBe("text");
  });
});
