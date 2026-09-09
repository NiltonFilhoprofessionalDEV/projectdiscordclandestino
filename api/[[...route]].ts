import { handle } from "@hono/node-server/vercel";
import { app } from "../server/src/app.ts";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handle(app);
