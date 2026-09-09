import type { User } from "@supabase/supabase-js";
import type { MiddlewareHandler } from "hono";
import type { AuthResult } from "../supabase.ts";

export type AuthEnv = {
  Variables: {
    user: User;
    accessToken: string;
  };
};

export type RequireUser = (
  authorizationHeader: string | undefined,
) => Promise<AuthResult>;

export function createAuthMiddleware(
  requireUser: RequireUser,
): MiddlewareHandler<AuthEnv> {
  return async (c, next) => {
    const header = c.req.header("Authorization");
    const result = await requireUser(header);
    if (!result.ok) {
      return c.json({ ok: false, error: result.error }, 401);
    }

    const accessToken = header?.startsWith("Bearer ")
      ? header.slice("Bearer ".length)
      : "";
    c.set("user", result.user);
    c.set("accessToken", accessToken);
    await next();
  };
}
