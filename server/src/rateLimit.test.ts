import { describe, expect, it } from "vitest";
import { createRateLimiter, rateLimitKey } from "./rateLimit.ts";

describe("rateLimitKey", () => {
  it("combines IP and authenticated user id", () => {
    expect(rateLimitKey("127.0.0.1", "user-1")).toBe("127.0.0.1:user-1");
    expect(rateLimitKey("127.0.0.1")).toBe("127.0.0.1");
  });
});

describe("createRateLimiter", () => {
  it("allows named operations until the window is exhausted", () => {
    const limiter = createRateLimiter({
      "community.create": { windowMs: 60_000, max: 2 },
    });

    expect(limiter.allow("community.create", "ip:user")).toEqual({ allowed: true });
    expect(limiter.allow("community.create", "ip:user")).toEqual({ allowed: true });

    const denied = limiter.allow("community.create", "ip:user");
    expect(denied.allowed).toBe(false);
    if (!denied.allowed) {
      expect(denied.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it("isolates operations and keys", () => {
    const limiter = createRateLimiter({
      "community.create": { windowMs: 60_000, max: 1 },
      "livekit.token": { windowMs: 60_000, max: 1 },
    });

    expect(limiter.allow("community.create", "ip:a").allowed).toBe(true);
    expect(limiter.allow("community.create", "ip:b").allowed).toBe(true);
    expect(limiter.allow("livekit.token", "ip:a").allowed).toBe(true);
    expect(limiter.allow("community.create", "ip:a").allowed).toBe(false);
  });
});
