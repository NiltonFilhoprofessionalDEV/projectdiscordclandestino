import { Hono } from "hono";
import { cors } from "hono/cors";
import { resolveCorsOrigin } from "./config.ts";
import { roomsPayload, tokenPayload } from "./http-handlers.ts";

export const app = new Hono();

app.use(
  "/api/*",
  cors({
    origin: (origin) => resolveCorsOrigin(origin),
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

app.get("/api/health", (c) => c.json({ ok: true }));

app.get("/api/rooms", async (c) => c.json(await roomsPayload()));

app.post("/api/token", async (c) => {
  const ip =
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    "local";

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "JSON inválido." }, 400);
  }

  const result = await tokenPayload(body, ip);
  return c.json(result.body, result.status);
});

export default app;
