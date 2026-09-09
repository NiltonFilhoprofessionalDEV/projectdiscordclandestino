import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  hasLiveKitCredentials,
  LIVEKIT_URL,
  resolveCorsOrigin,
} from "./config.ts";
import { createAuthMiddleware, type AuthEnv } from "./http/auth.ts";
import { registerChannelRoutes } from "./http/channels.ts";
import { registerCommunityRoutes } from "./http/communities.ts";
import type { AppDeps } from "./http/deps.ts";
import { registerInviteRoutes } from "./http/invites.ts";
import { registerLiveKitTokenRoute } from "./http/livekit-token.ts";
import { roomsPayload } from "./http-handlers.ts";
import { createToken } from "./livekit.ts";
import { allowRequest } from "./rateLimit.ts";
import { createCommunityRepository } from "./repositories/communityRepository.ts";
import { createUserClient, requireUser } from "./supabase.ts";

function productionDeps(): AppDeps {
  return {
    requireUser,
    getRepository: (accessToken) =>
      createCommunityRepository(createUserClient(accessToken)),
    issueLiveKitToken: createToken,
    hasLiveKitCredentials,
    livekitUrl: LIVEKIT_URL,
    allowRequest,
  };
}

export function createApp(deps: AppDeps = productionDeps()): Hono<AuthEnv> {
  const app = new Hono<AuthEnv>();

  app.use(
    "/api/*",
    cors({
      origin: (origin) => resolveCorsOrigin(origin),
      allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      exposeHeaders: ["Retry-After"],
    }),
  );

  app.get("/api/health", (c) => c.json({ ok: true }));
  app.get("/api/rooms", async (c) => c.json(await roomsPayload()));

  const auth = createAuthMiddleware(deps.requireUser);
  app.use("/api/communities", auth);
  app.use("/api/communities/*", auth);
  app.use("/api/channels/*", auth);
  app.use("/api/invites/*", auth);
  app.use("/api/livekit/*", auth);

  registerCommunityRoutes(app, deps);
  registerChannelRoutes(app, deps);
  registerInviteRoutes(app, deps);
  registerLiveKitTokenRoute(app, deps);

  app.onError((error, c) => {
    console.error("unhandled", { name: error.name });
    return c.json(
      {
        ok: false,
        error: {
          code: "INTERNAL",
          message: "Não foi possível concluir a operação.",
        },
      },
      500,
    );
  });

  return app;
}

export const app = createApp();
export default app;
