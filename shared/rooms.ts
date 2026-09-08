export type RoomId = "geral" | "jogos" | "reuniao" | "desenvolvimento";

export type RoomDefinition = {
  id: RoomId;
  label: string;
};

export const ROOMS: readonly RoomDefinition[] = [
  { id: "geral", label: "Geral" },
  { id: "jogos", label: "Jogos" },
  { id: "reuniao", label: "Reunião" },
  { id: "desenvolvimento", label: "Desenvolvimento" },
] as const;

const ROOM_IDS = new Set<string>(ROOMS.map((room) => room.id));

export function isKnownRoomId(id: string): id is RoomId {
  return ROOM_IDS.has(id);
}

export function getRoomLabel(id: string): string {
  return ROOMS.find((room) => room.id === id)?.label ?? id;
}
