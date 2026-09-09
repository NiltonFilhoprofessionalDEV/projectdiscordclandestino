import { handle } from "hono/vercel";
import app from "../server/src/app.ts";

export const runtime = "nodejs";
export const maxDuration = 15;

export default handle(app);
