import { handle } from "hono/vercel";
import { app } from "../server/src/app.ts";

export default handle(app);
