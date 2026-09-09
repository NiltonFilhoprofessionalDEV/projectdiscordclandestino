import { ScreenSharePresets, type ScreenShareCaptureOptions } from "livekit-client";

export type ScreenShareSurface = "monitor" | "window" | "browser";
export type ScreenShareQuality = "detail" | "motion";

export type ScreenShareConfig = {
  surface: ScreenShareSurface;
  quality: ScreenShareQuality;
  audio: boolean;
};

export const defaultScreenShareConfig: ScreenShareConfig = {
  surface: "monitor",
  quality: "detail",
  audio: true,
};

export function screenShareCaptureOptions(config: ScreenShareConfig): ScreenShareCaptureOptions {
  return {
    audio: config.audio,
    video: { displaySurface: config.surface },
    resolution:
      config.quality === "motion"
        ? ScreenSharePresets.h1080fps30.resolution
        : ScreenSharePresets.h1080fps15.resolution,
    contentHint: config.quality,
    surfaceSwitching: "include",
    systemAudio: config.audio ? "include" : "exclude",
  };
}

export function isScreenShareCancelError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const name = error instanceof Error ? error.name : "";
  return (
    name === "NotAllowedError" ||
    message.includes("cancel") ||
    message.includes("denied") ||
    message.includes("permission")
  );
}
