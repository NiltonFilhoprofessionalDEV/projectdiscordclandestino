import type { ChannelId } from "../../../shared/community.ts";
import { useConnectionQuality } from "./useConnectionQuality.ts";
import { useMedia } from "./useMedia.ts";
import { useParticipants } from "./useParticipants.ts";
import { useRoom } from "./useRoom.ts";

export function useHomeVoice(channelId: ChannelId | null, displayName: string) {
  const voice = useRoom(channelId);
  const participants = useParticipants(voice.room).map((participant) =>
    participant.isLocal
      ? { ...participant, name: participant.name || displayName }
      : participant,
  );
  const media = useMedia(voice.room, voice.findScreenOwner);
  const { quality, rttMs } = useConnectionQuality(voice.room);
  return { voice, participants, media, quality, rttMs };
}
