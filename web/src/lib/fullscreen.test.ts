// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { enterFullscreen, isFullscreenActive, toggleFullscreen } from "./fullscreen.ts";

describe("enterFullscreen", () => {
  it("uses requestFullscreen when available", async () => {
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    await enterFullscreen({ requestFullscreen } as unknown as HTMLElement);
    expect(requestFullscreen).toHaveBeenCalledTimes(1);
  });

  it("falls back to video fullscreen helpers when the container fails", async () => {
    const requestFullscreen = vi.fn().mockRejectedValue(new Error("denied"));
    const webkitEnterFullscreen = vi.fn();
    const video = {
      requestFullscreen,
      webkitEnterFullscreen,
    } as unknown as HTMLVideoElement;
    const container = {
      requestFullscreen,
      querySelector: () => video,
    } as unknown as HTMLElement;

    await enterFullscreen(container, video);
    expect(webkitEnterFullscreen).toHaveBeenCalledTimes(1);
  });
});

describe("toggleFullscreen", () => {
  it("exits when the element is already fullscreen", async () => {
    const exitFullscreen = vi.fn().mockResolvedValue(undefined);
    const element = document.createElement("div");
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => element,
    });
    Object.defineProperty(document, "exitFullscreen", {
      configurable: true,
      value: exitFullscreen,
    });

    await toggleFullscreen(element);
    expect(exitFullscreen).toHaveBeenCalledTimes(1);
  });

  it("detects active fullscreen for the target element", () => {
    const element = document.createElement("div");
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => element,
    });
    expect(isFullscreenActive(element)).toBe(true);
  });
});
