import { serve } from "@hono/node-server";
import { app } from "./app.ts";
import { PORT } from "./config.ts";

if (!process.env.VERCEL) {
  serve({ fetch: app.fetch, port: PORT }, (info) => {
    console.log(`API em http://localhost:${info.port}`);
  });
}
