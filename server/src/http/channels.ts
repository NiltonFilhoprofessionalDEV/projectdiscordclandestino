import type { Hono } from "hono";
import type { UpdateChannelInput } from "../../../shared/api.ts";
import { parseChannelName } from "../../../shared/community.ts";
import { fail } from "../repositories/errors.ts";
import type { AuthEnv } from "./auth.ts";
import type { AppDeps } from "./deps.ts";
import { apiJson, readJson } from "./result.ts";

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

export function registerChannelRoutes(app: Hono<AuthEnv>, deps: AppDeps) {
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

  app.delete("/api/channels/:id", async (c) => {
    const repo = deps.getRepository(c.get("accessToken"));
    return apiJson(
      c,
      await repo.deleteChannel(c.get("user").id, c.req.param("id")),
    );
  });
}
