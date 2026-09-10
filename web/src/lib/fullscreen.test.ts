import { describe, expect, it, vi } from "vitest";
import { enterFullscreen } from "./fullscreen.ts";

describe("enterFullscreen", () => {
  it("uses requestFullscreen when available", async () => {
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    await enterFullscreen({ requestFullscreen } as unknown as HTMLElement);
    expect(requestFullscreen).toHaveBeenCalledTimes(1);
  });
});
