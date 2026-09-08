import type { IncomingMessage, ServerResponse } from "node:http";
import { roomsPayload, tokenPayload } from "./http-handlers.ts";

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(body));
}

function clientIp(req: IncomingMessage): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return req.socket.remoteAddress ?? "unknown";
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  if (chunks.length === 0) {
    return {};
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export async function handleHealth(_req: IncomingMessage, res: ServerResponse) {
  send(res, 200, { ok: true });
}

export async function handleRooms(req: IncomingMessage, res: ServerResponse) {
  try {
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }
    send(res, 200, await roomsPayload());
  } catch (error) {
    console.error("GET /api/rooms", error);
    send(res, 500, { error: "Falha ao listar salas." });
  }
}

export async function handleToken(req: IncomingMessage, res: ServerResponse) {
  try {
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }
    if (req.method !== "POST") {
      send(res, 405, { error: "Use POST." });
      return;
    }
    let body: unknown;
    try {
      body = await readJson(req);
    } catch {
      send(res, 400, { error: "JSON inválido." });
      return;
    }
    const result = await tokenPayload(body, clientIp(req));
    send(res, result.status, result.body);
  } catch (error) {
    console.error("POST /api/token", error);
    send(res, 500, { error: "Falha ao gerar token." });
  }
}
