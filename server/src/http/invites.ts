import type { Hono } from "hono";
import { rateLimitKey } from "../rateLimit.ts";
import type { AuthEnv } from "./auth.ts";
import type { AppDeps } from "./deps.ts";
import { apiJson, clientIp, rateLimited } from "./result.ts";

export function registerInviteRoutes(app: Hono<AuthEnv>, deps: AppDeps) {
  app.post("/api/invites/:token/accept", async (c) => {
    const user = c.get("user");
    const limit = deps.allowRequest(
      "invite.accept",
      rateLimitKey(clientIp(c), user.id),
    );
    if (!limit.allowed) {
      return rateLimited(c, limit.retryAfterSeconds);
    }
    const repo = deps.getRepository(c.get("accessToken"));
    return apiJson(
      c,
      await repo.acceptInvite(user.id, decodeURIComponent(c.req.param("token"))),
    );
  });

  app.delete("/api/invites/:id", async (c) => {
    const repo = deps.getRepository(c.get("accessToken"));
    return apiJson(
      c,
      await repo.revokeInvite(c.get("user").id, c.req.param("id")),
    );
  });
}
