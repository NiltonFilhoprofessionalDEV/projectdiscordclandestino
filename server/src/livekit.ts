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

export type VoiceRoomOccupant = {
  identity: string;
  name: string;
};

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
    canUpdateOwnMetadata: true,
  });

  return token.toJwt();
}

function roomService(): RoomServiceClient | null {
  if (!hasLiveKitCredentials()) {
    return null;
  }
  return new RoomServiceClient(
    livekitHttpHost(LIVEKIT_URL),
    LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET,
  );
}

export async function listVoiceOccupants(
  communityId: string,
  channelIds: readonly string[],
): Promise<Record<string, VoiceRoomOccupant[]>> {
  const empty = Object.fromEntries(
    channelIds.map((channelId) => [channelId, [] as VoiceRoomOccupant[]]),
  );
  const client = roomService();
  if (!client || channelIds.length === 0) {
    return empty;
  }

  const entries = await Promise.all(
    channelIds.map(async (channelId) => {
      try {
        const participants = await client.listParticipants(
          voiceRoomName(communityId, channelId),
        );
        return [
          channelId,
          participants.map((participant) => ({
            identity: participant.identity,
            name: participant.name?.trim() || participant.identity,
          })),
        ] as const;
      } catch {
        return [channelId, [] as VoiceRoomOccupant[]] as const;
      }
    }),
  );

  return Object.fromEntries(entries);
}

export async function occupancyByRoom(): Promise<Record<RoomId, number>> {
  const counts = Object.fromEntries(ROOMS.map((room) => [room.id, 0])) as Record<
    RoomId,
    number
  >;

  const client = roomService();
  if (!client) {
    return counts;
  }

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
