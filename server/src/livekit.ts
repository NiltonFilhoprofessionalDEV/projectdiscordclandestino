import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import {
  hasLiveKitCredentials,
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET,
  LIVEKIT_URL,
  livekitHttpHost,
} from "./config.ts";
import { ROOMS, type RoomId } from "../../shared/rooms.ts";

export function voiceRoomName(communityId: string, channelId: string): string {
  return `community:${communityId}:voice:${channelId}`;
}

export function createToken(
  identity: string,
  displayName: string,
  roomName: string,
): Promise<string> {
  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity,
    name: displayName,
    ttl: "2h",
  });

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return token.toJwt();
}

export async function occupancyByRoom(): Promise<Record<RoomId, number>> {
  const counts = Object.fromEntries(ROOMS.map((room) => [room.id, 0])) as Record<
    RoomId,
    number
  >;

  if (!hasLiveKitCredentials()) {
    return counts;
  }

  const client = new RoomServiceClient(
    livekitHttpHost(LIVEKIT_URL),
    LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET,
  );

  try {
    const rooms = await client.listRooms(ROOMS.map((room) => room.id));
    for (const room of rooms) {
      if (room.name in counts) {
        counts[room.name as RoomId] = room.numParticipants;
      }
    }
  } catch {
    return counts;
  }

  return counts;
}
