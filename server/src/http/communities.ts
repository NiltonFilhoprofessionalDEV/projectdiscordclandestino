import type { Hono } from "hono";
import {
  parseChannelName,
  parseCommunityName,
} from "../../../shared/community.ts";
import type {
  CreateChannelInput,
  CreateCommunityInput,
  CreateInviteInput,
} from "../../../shared/api.ts";
import { fail } from "../repositories/errors.ts";
import { rateLimitKey } from "../rateLimit.ts";
import type { AuthEnv } from "./auth.ts";
import type { AppDeps } from "./deps.ts";
import { apiJson, clientIp, rateLimited, readJson } from "./result.ts";

function parseCommunityBody(body: unknown) {
  if (!body || typeof body !== "object") {
    return fail("VALIDATION", "JSON inválido.");
  }
  const { name, visibility } = body as Record<string, unknown>;
  if (visibility !== "public" && visibility !== "private") {
    return fail("VALIDATION", "Visibilidade inválida.");
  }
  if (typeof name !== "string") {
    return fail("VALIDATION", "Digite um nome com pelo menos 2 caracteres.");
  }
  const parsed = parseCommunityName(name);
  if (!parsed.ok) {
    return fail("VALIDATION", parsed.error);
  }
  return {
    ok: true as const,
    data: { name: parsed.value, visibility } satisfies CreateCommunityInput,
  };
}

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

function parseInviteBody(body: unknown) {
  if (body == null) {
    return { ok: true as const, data: {} satisfies CreateInviteInput };
  }
  if (typeof body !== "object") {
    return fail("VALIDATION", "JSON inválido.");
  }
  const { expiresAt, maxUses } = body as Record<string, unknown>;
  if (expiresAt !== undefined && expiresAt !== null && typeof expiresAt !== "string") {
    return fail("VALIDATION", "Data de expiração inválida.");
  }
  if (maxUses !== undefined && maxUses !== null && typeof maxUses !== "number") {
    return fail("VALIDATION", "Limite de usos inválido.");
  }
  return {
    ok: true as const,
    data: {
      expiresAt: expiresAt ?? null,
      maxUses: maxUses ?? null,
    } satisfies CreateInviteInput,
  };
}

export function registerCommunityRoutes(app: Hono<AuthEnv>, deps: AppDeps) {
  app.get("/api/communities", async (c) => {
    const user = c.get("user");
    const repo = deps.getRepository(c.get("accessToken"));
    return apiJson(c, await repo.listCommunities(user.id));
  });

  app.post("/api/communities", async (c) => {
    const user = c.get("user");
    const limit = deps.allowRequest(
      "community.create",
      rateLimitKey(clientIp(c), user.id),
    );
    if (!limit.allowed) {
      return rateLimited(c, limit.retryAfterSeconds);
    }
    const parsedJson = await readJson(c);
    if (!parsedJson.ok) {
      return parsedJson.response;
    }
    const parsed = parseCommunityBody(parsedJson.body);
    if (!parsed.ok) {
      return apiJson(c, parsed);
    }
    const repo = deps.getRepository(c.get("accessToken"));
    return apiJson(c, await repo.createCommunity(user.id, parsed.data), 201);
  });

  app.get("/api/communities/:id", async (c) => {
    const user = c.get("user");
    const repo = deps.getRepository(c.get("accessToken"));
    return apiJson(c, await repo.getCommunity(user.id, c.req.param("id")));
  });

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

  app.post("/api/communities/:id/invites", async (c) => {
    const user = c.get("user");
    const limit = deps.allowRequest(
      "invite.create",
      rateLimitKey(clientIp(c), user.id),
    );
    if (!limit.allowed) {
      return rateLimited(c, limit.retryAfterSeconds);
    }
    const parsedJson = await readJson(c);
    if (!parsedJson.ok) {
      return parsedJson.response;
    }
    const parsed = parseInviteBody(parsedJson.body);
    if (!parsed.ok) {
      return apiJson(c, parsed);
    }
    const repo = deps.getRepository(c.get("accessToken"));
    return apiJson(
      c,
      await repo.createInvite(user.id, c.req.param("id"), parsed.data),
      201,
    );
  });
}
