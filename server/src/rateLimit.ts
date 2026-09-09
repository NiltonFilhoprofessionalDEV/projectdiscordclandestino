export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export type RateLimitWindow = {
  windowMs: number;
  max: number;
};

export const RATE_LIMITS = {
  "community.create": { windowMs: 60_000, max: 10 },
  "channel.create": { windowMs: 60_000, max: 20 },
  "invite.create": { windowMs: 60_000, max: 10 },
  "invite.accept": { windowMs: 60_000, max: 20 },
  "message.create": { windowMs: 60_000, max: 60 },
  "livekit.token": { windowMs: 60_000, max: 20 },
  "livekit.occupancy": { windowMs: 60_000, max: 60 },
} as const satisfies Record<string, RateLimitWindow>;

const DEFAULT_WINDOW: RateLimitWindow = { windowMs: 60_000, max: 20 };

export function rateLimitKey(ip: string, userId?: string): string {
  return userId ? `${ip}:${userId}` : ip;
}

export function createRateLimiter(
  limits: Record<string, RateLimitWindow> = RATE_LIMITS,
) {
  const buckets = new Map<string, number[]>();

  return {
    allow(operation: string, key: string): RateLimitResult {
      const { windowMs, max } = limits[operation] ?? DEFAULT_WINDOW;
      const bucketKey = `${operation}:${key}`;
      const now = Date.now();
      const recent = (buckets.get(bucketKey) ?? []).filter(
        (stamp) => now - stamp < windowMs,
      );

      if (recent.length >= max) {
        buckets.set(bucketKey, recent);
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((recent[0]! + windowMs - now) / 1000),
        );
        return { allowed: false, retryAfterSeconds };
      }

      recent.push(now);
      buckets.set(bucketKey, recent);
      return { allowed: true };
    },
  };
}

const defaultLimiter = createRateLimiter();

export function allowRequest(operation: string, key: string): RateLimitResult {
  return defaultLimiter.allow(operation, key);
}
