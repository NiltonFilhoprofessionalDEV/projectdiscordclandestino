import { describe, expect, it } from "vitest";
import { voiceMicIconClass, voiceMicOpen, voiceNameClass } from "./voiceChrome.ts";

describe("voiceChrome", () => {
  it("uses coral when the mic is hard-muted", () => {
    expect(voiceNameClass(false, false)).toBe("text-coral");
    expect(voiceNameClass(false, true)).toBe("text-coral");
    expect(voiceMicOpen(false, true, false)).toBe(false);
  });

  it("keeps the name blue in voice-activity mode while the icon follows speech", () => {
    expect(voiceNameClass(true, true)).toBe("text-blue");
    expect(voiceMicIconClass(true, true)).toBe("text-blue");
    expect(voiceMicOpen(true, true, false)).toBe(false);
    expect(voiceMicOpen(true, true, true)).toBe(true);
  });

  it("uses neutral cloud for continuous transmission", () => {
    expect(voiceNameClass(true, false)).toBe("text-cloud");
    expect(voiceMicOpen(true, false, false)).toBe(true);
  });
});
