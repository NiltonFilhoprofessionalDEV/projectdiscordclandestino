import type { RoomId } from "../../../shared/rooms.ts";

export type RoomOccupancy = {
  id: RoomId;
  label: string;
  occupantCount: number;
};

export async function fetchRooms(): Promise<RoomOccupancy[]> {
  const res = await fetch("/api/rooms");
  if (!res.ok) {
    throw new Error("Não foi possível carregar as salas.");
  }
  const body = (await res.json()) as { rooms: RoomOccupancy[] };
  return body.rooms;
}

export async function fetchToken(
  displayName: string,
  roomId: RoomId,
): Promise<{ token: string; url: string; roomId: RoomId }> {
  const res = await fetch("/api/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ displayName, roomId }),
  });

  const body = (await res.json()) as { token?: string; url?: string; error?: string };
  if (!res.ok || !body.token || !body.url) {
    throw new Error(body.error ?? "Não foi possível entrar na sala.");
  }

  return { token: body.token, url: body.url, roomId };
}
