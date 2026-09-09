import type { Hono } from "hono";
import { fail } from "../repositories/errors.ts";
import { rateLimitKey } from "../rateLimit.ts";
import { voiceRoomName } from "../livekit.ts";
import type { AuthEnv } from "./auth.ts";
import type { AppDeps } from "./deps.ts";
import { apiJson, clientIp, rateLimited, readJson } from "./result.ts";

function parseTokenBody(body: unknown) {
  if (!body || typeof body !== "object") {
    return fail("VALIDATION", "JSON inválido.");
  }
  const { channelId } = body as Record<string, unknown>;
  if (typeof channelId !== "string" || !channelId) {
    return fail("VALIDATION", "Canal inválido.");
  }
  return { ok: true as const, data: { channelId } };
}

export function registerLiveKitTokenRoute(app: Hono<AuthEnv>, deps: AppDeps) {
  app.post("/api/livekit/token", async (c) => {
    const user = c.get("user");
    const limit = deps.allowRequest(
      "livekit.token",
      rateLimitKey(clientIp(c), user.id),
    );
    if (!limit.allowed) {
      return rateLimited(c, limit.retryAfterSeconds);
    }
    const parsedJson = await readJson(c);
    if (!parsedJson.ok) {
      return parsedJson.response;
    }
    const parsed = parseTokenBody(parsedJson.body);
    if (!parsed.ok) {
      return apiJson(c, parsed);
    }
    const repo = deps.getRepository(c.get("accessToken"));
    const access = await repo.canJoinVoice(user.id, parsed.data.channelId);
    if (!access.ok) {
      return apiJson(c, access);
    }
    if (!deps.hasLiveKitCredentials()) {
      return c.json(
        {
          ok: false,
          error: {
            code: "VALIDATION",
            message:
              "LiveKit não está configurado. Adicione LIVEKIT_URL, LIVEKIT_API_KEY e LIVEKIT_API_SECRET.",
          },
        },
        503,
      );
    }
    const roomName = voiceRoomName(
      access.data.communityId,
      access.data.channelId,
    );
    const token = await deps.issueLiveKitToken(
      user.id,
      access.data.displayName,
      roomName,
    );
    return apiJson(c, {
      ok: true,
      data: { token, url: deps.livekitUrl, roomName },
    });
  });
}
