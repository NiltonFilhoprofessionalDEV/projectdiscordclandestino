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

export const SIMPLE_SCREEN_SHARE: ScreenShareCaptureOptions = {
  audio: false,
  video: true,
};

export function isMobileScreenShareHost(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function canCaptureDisplay(): boolean {
  return typeof navigator.mediaDevices?.getDisplayMedia === "function";
}

export function screenShareCaptureOptions(
  config: ScreenShareConfig,
  host: { mobile?: boolean } = {},
): ScreenShareCaptureOptions {
  const mobile = host.mobile ?? isMobileScreenShareHost();
  if (mobile) {
    return {
      ...SIMPLE_SCREEN_SHARE,
      resolution: ScreenSharePresets.h720fps15.resolution,
      contentHint: config.quality,
    };
  }
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
    name === "AbortError" ||
    name === "NotAllowedError" ||
    message.includes("cancel") ||
    message.includes("denied") ||
    message.includes("permission")
  );
}

export function screenShareErrorMessage(error: unknown): string {
  const name = error instanceof Error ? error.name : "";
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (name === "NotSupportedError" || message.includes("not supported")) {
    return "Este celular não transmite tela neste navegador. No iPhone use o Safari; no Android, o Chrome.";
  }
  if (name === "NotFoundError") {
    return "Nenhuma tela disponível para transmitir neste aparelho.";
  }
  return "Não foi possível compartilhar a tela.";
}
