import { describe, expect, it, vi } from "vitest";
import { googleEnabledFromSettings, startGoogleSignIn } from "./googleOAuth.ts";

describe("googleEnabledFromSettings", () => {
  it("returns false when google is disabled", () => {
    expect(googleEnabledFromSettings({ external: { google: false, email: true } })).toBe(false);
  });

  it("returns true only when google is enabled", () => {
    expect(googleEnabledFromSettings({ external: { google: true } })).toBe(true);
  });

  it("returns false for malformed payloads", () => {
    expect(googleEnabledFromSettings(null)).toBe(false);
    expect(googleEnabledFromSettings({})).toBe(false);
  });
});

describe("startGoogleSignIn", () => {
  it("does not start OAuth when google is disabled", async () => {
    const oauth = vi.fn();
    const error = await startGoogleSignIn({
      readSettings: async () => ({ external: { google: false } }),
      startOAuth: oauth,
    });
    expect(error).toBe("Google não está configurado neste ambiente.");
    expect(oauth).not.toHaveBeenCalled();
  });

  it("starts OAuth only after settings show google enabled", async () => {
    const oauth = vi.fn().mockResolvedValue({ error: null });
    const error = await startGoogleSignIn({
      readSettings: async () => ({ external: { google: true } }),
      startOAuth: oauth,
    });
    expect(error).toBeNull();
    expect(oauth).toHaveBeenCalledOnce();
  });
});
