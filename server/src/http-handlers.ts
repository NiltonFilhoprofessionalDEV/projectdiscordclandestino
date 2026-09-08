import { parseDisplayName } from "../../shared/displayName.ts";
import { isKnownRoomId, ROOMS } from "../../shared/rooms.ts";
import { hasLiveKitCredentials, LIVEKIT_URL } from "./config.ts";
import { createToken, occupancyByRoom } from "./livekit.ts";
import { allowRequest } from "./rateLimit.ts";

export async function roomsPayload() {
  const occupancy = await occupancyByRoom();
  return {
    rooms: ROOMS.map((room) => ({
      id: room.id,
      label: room.label,
      occupantCount: occupancy[room.id],
    })),
  };
}

export async function tokenPayload(
  body: unknown,
  ip: string,
): Promise<{ status: number; body: Record<string, unknown> }> {
  if (!allowRequest(ip)) {
    return { status: 429, body: { error: "Muitas tentativas. Espere um momento." } };
  }

  if (!body || typeof body !== "object") {
    return { status: 400, body: { error: "JSON inválido." } };
  }

  const { displayName, roomId } = body as Record<string, unknown>;

  if (typeof roomId !== "string" || !isKnownRoomId(roomId)) {
    return { status: 400, body: { error: "Sala desconhecida." } };
  }

  if (typeof displayName !== "string") {
    return { status: 400, body: { error: "Nome inválido." } };
  }

  const parsed = parseDisplayName(displayName);
  if (!parsed.ok) {
    return { status: 400, body: { error: parsed.error } };
  }

  if (!hasLiveKitCredentials()) {
    return {
      status: 503,
      body: {
        error:
          "LiveKit não está configurado na Vercel. Adicione LIVEKIT_URL, LIVEKIT_API_KEY e LIVEKIT_API_SECRET em Settings → Environment Variables e faça Redeploy.",
      },
    };
  }

  const token = await createToken(parsed.value, roomId);
  return { status: 200, body: { token, url: LIVEKIT_URL, roomId } };
}
