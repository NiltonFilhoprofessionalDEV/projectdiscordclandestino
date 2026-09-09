import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChannelId } from "../../../shared/community.ts";

const getSession = vi.fn();
const from = vi.fn();

vi.mock("./supabase.ts", () => ({
  supabase: {
    auth: { getSession },
    from,
  },
}));

describe("apiRequest", () => {
  beforeEach(() => {
    getSession.mockReset();
    from.mockReset();
    vi.unstubAllGlobals();
  });

  it("sends the session access token as a Bearer header", async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: "tok_abc" } } });
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ ok: true, data: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { apiRequest } = await import("./api.ts");
    await apiRequest("/api/communities");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/communities",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer tok_abc",
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("returns API error payloads as values instead of throwing", async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: "tok_abc" } } });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          ok: false,
          error: { code: "UNAUTHENTICATED", message: "Entre para continuar." },
        }),
      }),
    );

    const { apiRequest } = await import("./api.ts");
    const result = await apiRequest("/api/communities");

    expect(result).toEqual({
      ok: false,
      error: { code: "UNAUTHENTICATED", message: "Entre para continuar." },
    });
  });

  it("returns INTERNAL when the network request fails", async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: "tok_abc" } } });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("offline")),
    );

    const { apiRequest } = await import("./api.ts");
    const result = await apiRequest("/api/communities");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INTERNAL");
    }
  });
});

describe("fetchLiveKitToken", () => {
  beforeEach(() => {
    getSession.mockReset();
    vi.unstubAllGlobals();
  });

  it("posts { channelId } to /api/livekit/token", async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: "tok_abc" } } });
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        ok: true,
        data: { token: "lk", url: "wss://livekit", roomName: "community:c:voice:v" },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { fetchLiveKitToken } = await import("./api.ts");
    const result = await fetchLiveKitToken("voice-1" as ChannelId);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/livekit/token",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ channelId: "voice-1" }),
      }),
    );
    expect(result).toEqual({
      ok: true,
      data: { token: "lk", url: "wss://livekit", roomName: "community:c:voice:v" },
    });
  });
});
