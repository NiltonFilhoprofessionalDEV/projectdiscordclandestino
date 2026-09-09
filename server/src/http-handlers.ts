import { occupancyByRoom } from "./livekit.ts";
import { ROOMS } from "../../shared/rooms.ts";

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
