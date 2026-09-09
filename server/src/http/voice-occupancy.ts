import type { Hono } from "hono";
import type { ChannelId } from "../../../shared/community.ts";
import { rateLimitKey } from "../rateLimit.ts";
import type { AuthEnv } from "./auth.ts";
import type { AppDeps } from "./deps.ts";
import { apiJson, clientIp, rateLimited } from "./result.ts";

export function registerVoiceOccupancyRoute(app: Hono<AuthEnv>, deps: AppDeps) {
  app.get("/api/communities/:id/voice-occupancy", async (c) => {
    const user = c.get("user");
    const limit = deps.allowRequest(
      "livekit.occupancy",
      rateLimitKey(clientIp(c), user.id),
    );
    if (!limit.allowed) {
      return rateLimited(c, limit.retryAfterSeconds);
    }

    const communityId = c.req.param("id");
    const repo = deps.getRepository(c.get("accessToken"));
    const access = await repo.listMemberVoiceChannels(user.id, communityId);
    if (!access.ok) {
      return apiJson(c, access);
    }

    const byChannel = await deps.listVoiceOccupants(
      access.data.communityId,
      access.data.channelIds,
    );

    return apiJson(c, {
      ok: true,
      data: {
        channels: access.data.channelIds.map((channelId: ChannelId) => ({
          channelId,
          occupants: byChannel[channelId] ?? [],
        })),
      },
    });
  });
}
