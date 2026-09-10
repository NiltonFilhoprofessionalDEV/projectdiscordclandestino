import type { Hono } from "hono";
import { parseCommunityName } from "../../../shared/community.ts";
import type { CreateCommunityInput, UpdateCommunityInput } from "../../../shared/api.ts";
import { fail } from "../repositories/errors.ts";
import { rateLimitKey } from "../rateLimit.ts";
import type { AuthEnv } from "./auth.ts";
import type { AppDeps } from "./deps.ts";
import { enrichListedCommunities } from "../explore/enrich.ts";
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

function parseUpdateCommunityBody(body: unknown) {
  if (!body || typeof body !== "object") {
    return fail("VALIDATION", "JSON inválido.");
  }
  const { name, visibility, avatarUrl } = body as Record<string, unknown>;
  const data: UpdateCommunityInput = {};
  if (name !== undefined) {
    if (typeof name !== "string") {
      return fail("VALIDATION", "Nome inválido.");
    }
    const parsed = parseCommunityName(name);
    if (!parsed.ok) {
      return fail("VALIDATION", parsed.error);
    }
    data.name = parsed.value;
  }
  if (visibility !== undefined) {
    if (visibility !== "public" && visibility !== "private") {
      return fail("VALIDATION", "Visibilidade inválida.");
    }
    data.visibility = visibility;
  }
  if (avatarUrl !== undefined) {
    if (avatarUrl !== null && typeof avatarUrl !== "string") {
      return fail("VALIDATION", "Avatar inválido.");
    }
    if (typeof avatarUrl === "string" && avatarUrl.length > 2048) {
      return fail("VALIDATION", "URL do avatar inválida.");
    }
    data.avatarUrl = avatarUrl;
  }
  if (data.name === undefined && data.visibility === undefined && data.avatarUrl === undefined) {
    return fail("VALIDATION", "Nenhuma alteração enviada.");
  }
  return { ok: true as const, data };
}

function registerListCommunities(app: Hono<AuthEnv>, deps: AppDeps) {
  app.get("/api/communities", async (c) => {
    const repo = deps.getRepository(c.get("accessToken"));
    const listed = await repo.listCommunities(c.get("user").id);
    if (!listed.ok) {
      return apiJson(c, listed);
    }
    return apiJson(c, {
      ok: true,
      data: await enrichListedCommunities(listed.data, deps),
    });
  });
}

function registerCreateCommunity(app: Hono<AuthEnv>, deps: AppDeps) {
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
}

function registerGetCommunity(app: Hono<AuthEnv>, deps: AppDeps) {
  app.get("/api/communities/:id", async (c) => {
    const repo = deps.getRepository(c.get("accessToken"));
    return apiJson(c, await repo.getCommunity(c.get("user").id, c.req.param("id")));
  });
}

function registerUpdateCommunity(app: Hono<AuthEnv>, deps: AppDeps) {
  app.patch("/api/communities/:id", async (c) => {
    const user = c.get("user");
    const limit = deps.allowRequest(
      "community.update",
      rateLimitKey(clientIp(c), user.id),
    );
    if (!limit.allowed) {
      return rateLimited(c, limit.retryAfterSeconds);
    }
    const parsedJson = await readJson(c);
    if (!parsedJson.ok) {
      return parsedJson.response;
    }
    const parsed = parseUpdateCommunityBody(parsedJson.body);
    if (!parsed.ok) {
      return apiJson(c, parsed);
    }
    const repo = deps.getRepository(c.get("accessToken"));
    return apiJson(c, await repo.updateCommunity(user.id, c.req.param("id"), parsed.data));
  });
}

function registerDeleteCommunity(app: Hono<AuthEnv>, deps: AppDeps) {
  app.delete("/api/communities/:id", async (c) => {
    const user = c.get("user");
    const limit = deps.allowRequest(
      "community.update",
      rateLimitKey(clientIp(c), user.id),
    );
    if (!limit.allowed) {
      return rateLimited(c, limit.retryAfterSeconds);
    }
    const repo = deps.getRepository(c.get("accessToken"));
    return apiJson(c, await repo.deleteCommunity(user.id, c.req.param("id")));
  });
}

export function registerCommunityRoutes(app: Hono<AuthEnv>, deps: AppDeps) {
  registerListCommunities(app, deps);
  registerCreateCommunity(app, deps);
  registerGetCommunity(app, deps);
  registerUpdateCommunity(app, deps);
  registerDeleteCommunity(app, deps);
}
