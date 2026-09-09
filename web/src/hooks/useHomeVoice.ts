import { useEffect, useRef, useState } from "react";
import { ConnectionState } from "livekit-client";
import type { ChannelId } from "../../../shared/community.ts";
import { playBroadcastOnSound, playJoinSound, playLeaveSound } from "../lib/sounds.ts";
import { setRemoteAudioOutput } from "../services/livekit.ts";
import { useConnectionQuality } from "./useConnectionQuality.ts";
import { useMedia } from "./useMedia.ts";
import { useParticipants } from "./useParticipants.ts";
import { useRoom } from "./useRoom.ts";

export function useHomeVoice(
  channelId: ChannelId | null,
  displayName: string,
  avatarUrl: string | null = null,
  avatarByIdentity: Record<string, string | null> = {},
) {
  const voice = useRoom(channelId, { displayName, avatarUrl });
  const media = useMedia(voice.room, voice.findScreenOwner);
  const participants = useParticipants(voice.room).map((participant) => {
    const fromProfile = avatarByIdentity[participant.identity] ?? null;
    const resolvedAvatar =
      participant.avatarUrl || (participant.isLocal ? avatarUrl : null) || fromProfile;
    const speaking =
      participant.isSpeaking || (participant.isLocal && media.localSpeaking);
    return {
      ...participant,
      name: participant.isLocal ? participant.name || displayName : participant.name,
      avatarUrl: resolvedAvatar,
      isSpeaking: speaking,
    };
  });
  const { quality, rttMs } = useConnectionQuality(voice.room);
  const [outputVolume, setOutputVolume] = useState(1);
  const [outputMuted, setOutputMuted] = useState(false);
  const previousConnectionState = useRef(ConnectionState.Disconnected);

  useEffect(() => {
    setRemoteAudioOutput(outputVolume, outputMuted);
  }, [outputMuted, outputVolume]);

  useEffect(() => {
    const previous = previousConnectionState.current;
    if (voice.connectionState === ConnectionState.Connected) {
      playJoinSound();
    }
    if (
      previous === ConnectionState.Connected &&
      voice.connectionState === ConnectionState.Disconnected
    ) {
      playLeaveSound();
    }
    previousConnectionState.current = voice.connectionState;
  }, [voice.connectionState]);

  useEffect(() => {
    if (media.micOn || media.screenOn) {
      playBroadcastOnSound();
    }
  }, [media.micOn, media.screenOn]);

  return {
    voice,
    participants,
    media,
    quality,
    rttMs,
    outputVolume,
    outputMuted,
    setOutputVolume,
    setOutputMuted,
  };
}
