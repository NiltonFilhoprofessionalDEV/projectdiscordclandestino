import { handle } from "hono/vercel";
import { app } from "./app.ts";

export default handle(app);
