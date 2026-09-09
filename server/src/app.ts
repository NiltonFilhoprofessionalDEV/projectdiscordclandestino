import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  hasLiveKitCredentials,
  LIVEKIT_URL,
  resolveCorsOrigin,
  supabaseServerConfigStatus,
} from "./config.ts";
import { createAuthMiddleware, type AuthEnv } from "./http/auth.ts";
import { registerChannelRoutes } from "./http/channels.ts";
import { registerCommunityRoutes } from "./http/communities.ts";
import type { AppDeps } from "./http/deps.ts";
import { registerInviteRoutes } from "./http/invites.ts";
import { registerLiveKitTokenRoute } from "./http/livekit-token.ts";
import { registerVoiceOccupancyRoute } from "./http/voice-occupancy.ts";
import { roomsPayload } from "./http-handlers.ts";
import { createToken, listVoiceOccupants } from "./livekit.ts";
import { allowRequest } from "./rateLimit.ts";
import { createCommunityRepository } from "./repositories/communityRepository.ts";
import { createUserClient, requireUser } from "./supabase.ts";

function productionDeps(): AppDeps {
  return {
    requireUser,
    getRepository: (accessToken) =>
      createCommunityRepository(createUserClient(accessToken)),
    issueLiveKitToken: createToken,
    listVoiceOccupants,
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

  app.get("/api/health", (c) =>
    c.json({
      ok: true,
      livekit: hasLiveKitCredentials(),
      ...supabaseServerConfigStatus(),
    }),
  );
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
  registerVoiceOccupancyRoute(app, deps);

  app.onError((error, c) => {
    const detail = error instanceof Error ? error.message : "";
    console.error("unhandled", { name: error.name, message: detail });
    const configHint =
      /Supabase/.test(detail)
        ? "Configure SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY e SUPABASE_SECRET_KEY na Vercel e faça Redeploy."
        : "Não foi possível concluir a operação.";
    return c.json(
      {
        ok: false,
        error: {
          code: "INTERNAL",
          message: configHint,
        },
      },
      500,
    );
  });

  return app;
}

export const app = createApp();
export default app;
