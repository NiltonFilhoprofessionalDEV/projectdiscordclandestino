import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { ApiErrorCode, ApiResult } from "../../../shared/api.ts";

const STATUS: Record<ApiErrorCode, ContentfulStatusCode> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION: 400,
  CONFLICT: 409,
  RATE_LIMITED: 429,
};

export function apiJson<T>(
  c: Context,
  result: ApiResult<T>,
  successStatus: ContentfulStatusCode = 200,
) {
  if (result.ok) {
    return c.json(result, successStatus);
  }
  return c.json(result, STATUS[result.error.code]);
}

export function rateLimited(c: Context, retryAfterSeconds: number) {
  c.header("Retry-After", String(retryAfterSeconds));
  return c.json(
    {
      ok: false,
      error: {
        code: "RATE_LIMITED" as const,
        message: "Muitas tentativas. Espere um momento.",
      },
    },
    429,
  );
}

export async function readJson(
  c: Context,
): Promise<{ ok: true; body: unknown } | { ok: false; response: Response }> {
  try {
    return { ok: true, body: await c.req.json() };
  } catch {
    return {
      ok: false,
      response: c.json(
        {
          ok: false,
          error: { code: "VALIDATION", message: "JSON inválido." },
        },
        400,
      ),
    };
  }
}

export function clientIp(c: Context): string {
  return (
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") ||
    "local"
  );
}
