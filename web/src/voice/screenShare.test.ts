import { describe, expect, it } from "vitest";
import {
  defaultScreenShareConfig,
  isScreenShareCancelError,
  screenShareCaptureOptions,
} from "./screenShare.ts";

describe("screenShareCaptureOptions", () => {
  it("maps monitor + detail to a presentation capture", () => {
    const options = screenShareCaptureOptions(defaultScreenShareConfig);
    expect(options.video).toEqual({ displaySurface: "monitor" });
    expect(options.contentHint).toBe("detail");
    expect(options.audio).toBe(true);
  });

  it("maps window + motion to a gameplay capture", () => {
    const options = screenShareCaptureOptions({
      surface: "window",
      quality: "motion",
      audio: false,
    });
    expect(options.video).toEqual({ displaySurface: "window" });
    expect(options.contentHint).toBe("motion");
    expect(options.audio).toBe(false);
  });
});

describe("isScreenShareCancelError", () => {
  it("treats picker cancel as a user abort", () => {
    expect(isScreenShareCancelError(new Error("Share canceled"))).toBe(true);
    expect(isScreenShareCancelError(Object.assign(new Error("denied"), { name: "NotAllowedError" }))).toBe(
      true,
    );
    expect(isScreenShareCancelError(new Error("network"))).toBe(false);
  });
});
