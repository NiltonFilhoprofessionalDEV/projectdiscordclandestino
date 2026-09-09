import { Hono } from "hono";

const app = new Hono();
app.get("/api/mini", (c) => c.json({ ok: true, mini: true }));
app.all("*", (c) => c.json({ ok: true, path: c.req.path, method: c.req.method }));

export default app;
