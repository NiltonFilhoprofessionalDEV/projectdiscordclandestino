import type { IncomingMessage, ServerResponse } from "node:http";
import { roomsPayload } from "./http-handlers.ts";

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(body));
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
