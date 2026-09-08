import { handle } from "hono/vercel";
import { app } from "../server/src/app.ts";

export const config = {
  runtime: "nodejs",
  maxDuration: 15,
};

export default handle(app);
