import type { Hono } from "hono";
import type { CreateChannelInput, UpdateChannelInput } from "../../../shared/api.ts";
import { parseChannelName } from "../../../shared/community.ts";
import { fail } from "../repositories/errors.ts";
import { rateLimitKey } from "../rateLimit.ts";
import type { AuthEnv } from "./auth.ts";
import type { AppDeps } from "./deps.ts";
import { apiJson, clientIp, rateLimited, readJson } from "./result.ts";

function parseChannelBody(body: unknown) {
  if (!body || typeof body !== "object") {
    return fail("VALIDATION", "JSON inválido.");
  }
  const { name, type } = body as Record<string, unknown>;
  if (type !== "text" && type !== "voice") {
    return fail("VALIDATION", "Tipo de canal inválido.");
  }
  if (typeof name !== "string") {
    return fail("VALIDATION", "Digite um nome de canal.");
  }
  const parsed = parseChannelName(name);
  if (!parsed.ok) {
    return fail("VALIDATION", parsed.error);
  }
  return {
    ok: true as const,
    data: { name: parsed.value, type } satisfies CreateChannelInput,
  };
}

function parseUpdateBody(body: unknown) {
  if (!body || typeof body !== "object") {
    return fail("VALIDATION", "JSON inválido.");
  }
  const { name, position } = body as Record<string, unknown>;
  const input: UpdateChannelInput = {};
  if (name !== undefined) {
    if (typeof name !== "string") {
      return fail("VALIDATION", "Digite um nome de canal.");
    }
    const parsed = parseChannelName(name);
    if (!parsed.ok) {
      return fail("VALIDATION", parsed.error);
    }
    input.name = parsed.value;
  }
  if (position !== undefined) {
    if (typeof position !== "number" || !Number.isInteger(position) || position < 0) {
      return fail("VALIDATION", "Posição inválida.");
    }
    input.position = position;
  }
  if (input.name === undefined && input.position === undefined) {
    return fail("VALIDATION", "Nenhuma alteração enviada.");
  }
  return { ok: true as const, data: input };
}

function registerCreateChannel(app: Hono<AuthEnv>, deps: AppDeps) {
  app.post("/api/communities/:id/channels", async (c) => {
    const user = c.get("user");
    const limit = deps.allowRequest(
      "channel.create",
      rateLimitKey(clientIp(c), user.id),
    );
    if (!limit.allowed) {
      return rateLimited(c, limit.retryAfterSeconds);
    }
    const parsedJson = await readJson(c);
    if (!parsedJson.ok) {
      return parsedJson.response;
    }
    const parsed = parseChannelBody(parsedJson.body);
    if (!parsed.ok) {
      return apiJson(c, parsed);
    }
    const repo = deps.getRepository(c.get("accessToken"));
    return apiJson(
      c,
      await repo.createChannel(user.id, c.req.param("id"), parsed.data),
      201,
    );
  });
}

function registerUpdateChannel(app: Hono<AuthEnv>, deps: AppDeps) {
  app.patch("/api/channels/:id", async (c) => {
    const parsedJson = await readJson(c);
    if (!parsedJson.ok) {
      return parsedJson.response;
    }
    const parsed = parseUpdateBody(parsedJson.body);
    if (!parsed.ok) {
      return apiJson(c, parsed);
    }
    const repo = deps.getRepository(c.get("accessToken"));
    return apiJson(
      c,
      await repo.updateChannel(c.get("user").id, c.req.param("id"), parsed.data),
    );
  });
}

function registerDeleteChannel(app: Hono<AuthEnv>, deps: AppDeps) {
  app.delete("/api/channels/:id", async (c) => {
    const repo = deps.getRepository(c.get("accessToken"));
    return apiJson(
      c,
      await repo.deleteChannel(c.get("user").id, c.req.param("id")),
    );
  });
}

export function registerChannelRoutes(app: Hono<AuthEnv>, deps: AppDeps) {
  registerCreateChannel(app, deps);
  registerUpdateChannel(app, deps);
  registerDeleteChannel(app, deps);
}
