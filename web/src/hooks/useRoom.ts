import { useCallback, useEffect, useRef, useState } from "react";
import {
  ConnectionState,
  RoomEvent,
  Track,
  type RemoteTrack,
  type Room,
} from "livekit-client";
import type { RoomId } from "../../../shared/rooms.ts";
import { fetchToken } from "../services/api.ts";
import {
  attachRemoteAudio,
  createLiveKitRoom,
  detachTrack,
} from "../services/livekit.ts";
import { readMicMuted } from "../lib/storage.ts";

export function useRoom(displayName: string, roomId: RoomId | null) {
  const roomRef = useRef<Room | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [connectionState, setConnectionState] = useState(ConnectionState.Disconnected);
  const [error, setError] = useState<string | null>(null);

  const leave = useCallback(async () => {
    const current = roomRef.current;
    roomRef.current = null;
    setRoom(null);
    setConnectionState(ConnectionState.Disconnected);
    if (current) {
      await current.disconnect();
    }
  }, []);

  useEffect(() => {
    if (!roomId) {
      if (roomRef.current) {
        void leave();
      }
      return;
    }

    let cancelled = false;
    const instance = createLiveKitRoom();
    roomRef.current = instance;
    setRoom(instance);

    const onState = (state: ConnectionState) => {
      setConnectionState(state);
    };

    instance.on(RoomEvent.ConnectionStateChanged, onState);
    instance.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
      attachRemoteAudio(track);
    });
    instance.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
      detachTrack(track);
    });

    async function connect() {
      try {
        setError(null);
        const { token, url } = await fetchToken(displayName, roomId!);
        if (cancelled) {
          return;
        }
        await instance.connect(url, token);
        await instance.startAudio();
        try {
          await instance.localParticipant.setMicrophoneEnabled(!readMicMuted());
        } catch {
          setError("Microfone indisponível. Você ainda pode ouvir a sala.");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Falha ao conectar.");
          setConnectionState(ConnectionState.Disconnected);
        }
      }
    }

    void connect();

    return () => {
      cancelled = true;
      instance.off(RoomEvent.ConnectionStateChanged, onState);
      void instance.disconnect();
      if (roomRef.current === instance) {
        roomRef.current = null;
      }
    };
  }, [displayName, roomId, leave]);

  const findScreenOwner = useCallback((): string | null => {
    const current = roomRef.current;
    if (!current) {
      return null;
    }
    if (current.localParticipant.isScreenShareEnabled) {
      return current.localParticipant.name || current.localParticipant.identity;
    }
    for (const participant of current.remoteParticipants.values()) {
      const hasShare = Array.from(participant.trackPublications.values()).some(
        (pub) => pub.source === Track.Source.ScreenShare && !pub.isMuted && pub.track,
      );
      if (hasShare) {
        return participant.name || participant.identity;
      }
    }
    return null;
  }, []);

  return {
    room,
    connectionState,
    error,
    leave,
    findScreenOwner,
  };
}
