import { AccessToken, RoomServiceClient } from "livekit-server-sdk";

const ROOMS = [
  { id: "geral", label: "Geral" },
  { id: "jogos", label: "Jogos" },
  { id: "reuniao", label: "Reunião" },
  { id: "desenvolvimento", label: "Desenvolvimento" },
];

const ROOM_IDS = new Set(ROOMS.map((room) => room.id));
const hitsByIp = new Map();

function env(name) {
  return (process.env[name] ?? "").trim();
}

function livekitUrl() {
  return env("LIVEKIT_URL");
}

function livekitKey() {
  return env("LIVEKIT_API_KEY");
}

function livekitSecret() {
  return env("LIVEKIT_API_SECRET");
}

function hasLiveKit() {
  const url = livekitUrl();
  const secret = livekitSecret();
  if (!url || !livekitKey() || !secret) {
    return false;
  }
  if (/^[•*x]+$/i.test(secret) || url.includes("your-project")) {
    return false;
  }
  return true;
}

function parseDisplayName(raw) {
  const value = String(raw ?? "").replace(/\s+/g, " ").trim();
  if (value.length < 2) {
    return { ok: false, error: "Digite um nome com pelo menos 2 caracteres." };
  }
  if (value.length > 32) {
    return { ok: false, error: "O nome pode ter no máximo 32 caracteres." };
  }
  if (/[<>]/.test(value) || /[\u0000-\u001F\u007F]/.test(value)) {
    return { ok: false, error: "O nome não pode conter caracteres inválidos." };
  }
  return { ok: true, value };
}

function makeIdentity(name) {
  const slug =
    name
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "user";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const suffix = Array.from(bytes, (byte) => (byte % 36).toString(36)).join("");
  return `${slug}-${suffix}`;
}

function allowRequest(ip) {
  const now = Date.now();
  const recent = (hitsByIp.get(ip) ?? []).filter((stamp) => now - stamp < 60_000);
  if (recent.length >= 20) {
    hitsByIp.set(ip, recent);
    return false;
  }
  recent.push(now);
  hitsByIp.set(ip, recent);
  return true;
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(body));
}

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress ?? "unknown";
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  if (chunks.length === 0) {
    return {};
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export async function handleHealth(_req, res) {
  send(res, 200, { ok: true });
}

export async function handleRooms(req, res) {
  try {
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }

    const counts = Object.fromEntries(ROOMS.map((room) => [room.id, 0]));
    if (hasLiveKit()) {
      try {
        const host = livekitUrl().replace(/^wss:/, "https:").replace(/^ws:/, "http:");
        const client = new RoomServiceClient(host, livekitKey(), livekitSecret());
        const rooms = await client.listRooms(ROOMS.map((room) => room.id));
        for (const room of rooms) {
          if (room.name in counts) {
            counts[room.name] = room.numParticipants;
          }
        }
      } catch (error) {
        console.error("listRooms", error);
      }
    }

    send(res, 200, {
      rooms: ROOMS.map((room) => ({
        id: room.id,
        label: room.label,
        occupantCount: counts[room.id],
      })),
    });
  } catch (error) {
    console.error("GET /api/rooms", error);
    send(res, 500, { error: "Falha ao listar salas." });
  }
}

export async function handleToken(req, res) {
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
    if (!allowRequest(clientIp(req))) {
      send(res, 429, { error: "Muitas tentativas. Espere um momento." });
      return;
    }

    let body;
    try {
      body = await readJson(req);
    } catch {
      send(res, 400, { error: "JSON inválido." });
      return;
    }

    const roomId = body?.roomId;
    const parsed = parseDisplayName(body?.displayName);
    if (typeof roomId !== "string" || !ROOM_IDS.has(roomId)) {
      send(res, 400, { error: "Sala desconhecida." });
      return;
    }
    if (!parsed.ok) {
      send(res, 400, { error: parsed.error });
      return;
    }
    if (!hasLiveKit()) {
      send(res, 503, {
        error:
          "LiveKit não está configurado na Vercel. Cadastre LIVEKIT_URL, LIVEKIT_API_KEY e LIVEKIT_API_SECRET e faça Redeploy.",
      });
      return;
    }

    const token = new AccessToken(livekitKey(), livekitSecret(), {
      identity: makeIdentity(parsed.value),
      name: parsed.value,
      ttl: "2h",
    });
    token.addGrant({
      roomJoin: true,
      room: roomId,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });
    send(res, 200, {
      token: await token.toJwt(),
      url: livekitUrl(),
      roomId,
    });
  } catch (error) {
    console.error("POST /api/token", error);
    send(res, 500, { error: "Falha ao gerar token." });
  }
}
