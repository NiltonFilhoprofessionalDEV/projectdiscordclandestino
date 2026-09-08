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
  micOn: boolean;
  cameraPublication: TrackPublication | null;
  screenPublication: TrackPublication | null;
};

function publicationOf(participant: Participant, source: Track.Source) {
  const pub =
    participant.getTrackPublication(source) ??
    Array.from(participant.trackPublications.values()).find((item) => item.source === source);
  if (!pub || pub.isMuted || !pub.track) {
    return null;
  }
  return pub;
}

function toView(participant: Participant, isLocal: boolean): ParticipantView {
  return {
    identity: participant.identity,
    name: participant.name || participant.identity,
    isLocal,
    isSpeaking: participant.isSpeaking,
    micOn: participant.isMicrophoneEnabled,
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
      RoomEvent.LocalTrackPublished,
      RoomEvent.LocalTrackUnpublished,
      RoomEvent.ActiveSpeakersChanged,
      RoomEvent.ParticipantMetadataChanged,
    ] as const;

    const handler = () => refresh();
    events.forEach((event) => room.on(event, handler as never));
    return () => {
      events.forEach((event) => room.off(event, handler as never));
    };
  }, [room, refresh]);

  return participants;
}

export function activeScreenShare(participants: ParticipantView[]): ParticipantView | null {
  return participants.find((participant) => participant.screenPublication) ?? null;
}

