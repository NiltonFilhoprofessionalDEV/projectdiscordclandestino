import type { Hono } from "hono";
import { rateLimitKey } from "../rateLimit.ts";
import type { AuthEnv } from "./auth.ts";
import type { AppDeps } from "./deps.ts";
import { parseInviteBody } from "./inviteInput.ts";
import { apiJson, clientIp, rateLimited, readJson } from "./result.ts";

function registerCreateInvite(app: Hono<AuthEnv>, deps: AppDeps) {
  app.post("/api/communities/:id/invites", async (c) => {
    const user = c.get("user");
    const limit = deps.allowRequest(
      "invite.create",
      rateLimitKey(clientIp(c), user.id),
    );
    if (!limit.allowed) {
      return rateLimited(c, limit.retryAfterSeconds);
    }
    const parsedJson = await readJson(c, { emptyAsObject: true });
    if (!parsedJson.ok) {
      return parsedJson.response;
    }
    const parsed = parseInviteBody(parsedJson.body);
    if (!parsed.ok) {
      return apiJson(c, parsed);
    }
    const repo = deps.getRepository(c.get("accessToken"));
    return apiJson(
      c,
      await repo.createInvite(user.id, c.req.param("id"), parsed.data),
      201,
    );
  });
}

function registerAcceptInvite(app: Hono<AuthEnv>, deps: AppDeps) {
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
}

function registerRevokeInvite(app: Hono<AuthEnv>, deps: AppDeps) {
  app.delete("/api/invites/:id", async (c) => {
    const repo = deps.getRepository(c.get("accessToken"));
    return apiJson(
      c,
      await repo.revokeInvite(c.get("user").id, c.req.param("id")),
    );
  });
}

export function registerInviteRoutes(app: Hono<AuthEnv>, deps: AppDeps) {
  registerCreateInvite(app, deps);
  registerAcceptInvite(app, deps);
  registerRevokeInvite(app, deps);
}
