import { useCallback, useEffect, useState } from "react";
import {
  RoomEvent,
  Track,
  type Participant,
  type Room,
  type TrackPublication,
} from "livekit-client";

export type ParticipantView = {
  identity: string;
  name: string;
  isLocal: boolean;
  isSpeaking: boolean;
  /** Intenção de mic disponível (true também em VAD silencioso). */
  micOn: boolean;
  /** Modo "só transmite quando fala" ativo no participante. */
  voiceActivityOn: boolean;
  avatarUrl: string | null;
  cameraPublication: TrackPublication | null;
  screenPublication: TrackPublication | null;
};

function publicationOf(participant: Participant, source: Track.Source) {
  const pub =
    participant.getTrackPublication(source) ??
    Array.from(participant.trackPublications.values()).find((item) => item.source === source);
  if (!pub?.track) {
    return null;
  }
  if (source === Track.Source.Camera && participant.isCameraEnabled) {
    return pub;
  }
  if (pub.isMuted) {
    return null;
  }
  return pub;
}

function readMetadata(participant: Participant): {
  avatarUrl: string | null;
  voiceActivityOn: boolean;
} {
  try {
    const raw = participant.metadata;
    if (!raw) {
      return { avatarUrl: null, voiceActivityOn: false };
    }
    const parsed = JSON.parse(raw) as { avatarUrl?: unknown; voiceActivity?: unknown };
    return {
      avatarUrl: typeof parsed.avatarUrl === "string" && parsed.avatarUrl ? parsed.avatarUrl : null,
      voiceActivityOn: parsed.voiceActivity === true,
    };
  } catch {
    return { avatarUrl: null, voiceActivityOn: false };
  }
}

function toView(participant: Participant, isLocal: boolean): ParticipantView {
  const meta = readMetadata(participant);
  return {
    identity: participant.identity,
    name: participant.name || participant.identity,
    isLocal,
    isSpeaking: participant.isSpeaking,
    // Com VAD remoto, isMicrophoneEnabled fica false no silêncio — metadata marca o modo.
    micOn: meta.voiceActivityOn || participant.isMicrophoneEnabled,
    voiceActivityOn: meta.voiceActivityOn,
    avatarUrl: meta.avatarUrl,
    cameraPublication: publicationOf(participant, Track.Source.Camera),
    screenPublication: publicationOf(participant, Track.Source.ScreenShare),
  };
}

function snapshot(room: Room): ParticipantView[] {
  return [
    toView(room.localParticipant, true),
    ...Array.from(room.remoteParticipants.values()).map((participant) =>
      toView(participant, false),
    ),
  ];
}

const SPEAKING_POLL_MS = 120;

export function useParticipants(room: Room | null): ParticipantView[] {
  const [participants, setParticipants] = useState<ParticipantView[]>([]);

  const refresh = useCallback(() => {
    if (room) {
      setParticipants(snapshot(room));
    }
  }, [room]);

  useEffect(() => {
    if (!room) {
      setParticipants([]);
      return;
    }

    refresh();
    const events = [
      RoomEvent.ParticipantConnected,
      RoomEvent.ParticipantDisconnected,
      RoomEvent.TrackMuted,
      RoomEvent.TrackUnmuted,
      RoomEvent.TrackPublished,
      RoomEvent.TrackUnpublished,
      RoomEvent.TrackSubscribed,
      RoomEvent.TrackUnsubscribed,
      RoomEvent.LocalTrackPublished,
      RoomEvent.LocalTrackUnpublished,
      RoomEvent.TrackStreamStateChanged,
      RoomEvent.MediaDevicesError,
      RoomEvent.ActiveSpeakersChanged,
      RoomEvent.ParticipantMetadataChanged,
    ] as const;

    const handler = () => refresh();
    events.forEach((event) => room.on(event, handler as never));
    // Poll leve: isSpeaking muda com frequência e ActiveSpeakersChanged às vezes atrasa.
    const pollId = window.setInterval(refresh, SPEAKING_POLL_MS);
    return () => {
      events.forEach((event) => room.off(event, handler as never));
      window.clearInterval(pollId);
    };
  }, [room, refresh]);

  return participants;
}

export function activeScreenShare(participants: ParticipantView[]): ParticipantView | null {
  return participants.find((participant) => participant.screenPublication) ?? null;
}
