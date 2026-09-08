import { Hono } from "hono";
import { cors } from "hono/cors";
import { parseDisplayName } from "../../shared/displayName.ts";
import { isKnownRoomId, ROOMS } from "../../shared/rooms.ts";
import { APP_ORIGIN, hasLiveKitCredentials, LIVEKIT_URL } from "./config.ts";
import { createToken, occupancyByRoom } from "./livekit.ts";
import { allowRequest } from "./rateLimit.ts";

export const app = new Hono();

app.use(
  "/api/*",
  cors({
    origin: APP_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

app.get("/api/health", (c) => c.json({ ok: true }));

app.get("/api/rooms", async (c) => {
  const occupancy = await occupancyByRoom();
  return c.json({
    rooms: ROOMS.map((room) => ({
      id: room.id,
      label: room.label,
      occupantCount: occupancy[room.id],
    })),
  });
});

app.post("/api/token", async (c) => {
  const ip =
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    "local";

  if (!allowRequest(ip)) {
    return c.json({ error: "Muitas tentativas. Espere um momento." }, 429);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "JSON inválido." }, 400);
  }

  if (!body || typeof body !== "object") {
    return c.json({ error: "JSON inválido." }, 400);
  }

  const { displayName, roomId } = body as Record<string, unknown>;

  if (typeof roomId !== "string" || !isKnownRoomId(roomId)) {
    return c.json({ error: "Sala desconhecida." }, 400);
  }

  if (typeof displayName !== "string") {
    return c.json({ error: "Nome inválido." }, 400);
  }

  const parsed = parseDisplayName(displayName);
  if (!parsed.ok) {
    return c.json({ error: parsed.error }, 400);
  }

  if (!hasLiveKitCredentials()) {
    return c.json(
      {
        error:
          "LiveKit não está configurado. No dashboard, copie o API Secret real (não as bolinhas ••••) para server/.env e reinicie o servidor.",
      },
      503,
    );
  }

  const token = await createToken(parsed.value, roomId);
  return c.json({ token, url: LIVEKIT_URL, roomId });
});

export default app;
