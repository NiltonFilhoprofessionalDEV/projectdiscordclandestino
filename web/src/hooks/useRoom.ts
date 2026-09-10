import { useCallback, useEffect, useRef, useState } from "react";
import {
  ConnectionState,
  RoomEvent,
  Track,
  type RemoteParticipant,
  type RemoteTrack,
  type RemoteTrackPublication,
  type Room,
} from "livekit-client";
import type { ChannelId } from "../../../shared/community.ts";
import { readMicMuted, readDevicePrefs } from "../lib/storage.ts";
import { fetchLiveKitToken } from "../services/api.ts";
import {
  attachRemoteAudio,
  createLiveKitRoom,
  detachTrack,
} from "../services/livekit.ts";
import { applySavedDevices } from "../voice/devices.ts";
import { MIC_CAPTURE, MIC_CAPTURE_FALLBACK } from "../voice/micCapture.ts";

function onTrackSubscribed(
  track: RemoteTrack,
  publication: RemoteTrackPublication,
  participant: RemoteParticipant,
) {
  attachRemoteAudio(track, participant, publication);
}

function onTrackUnsubscribed(track: RemoteTrack) {
  detachTrack(track);
}

function findScreenShareOwner(room: Room | null): string | null {
  if (!room) {
    return null;
  }
  if (room.localParticipant.isScreenShareEnabled) {
    return room.localParticipant.name || room.localParticipant.identity;
  }
  for (const participant of room.remoteParticipants.values()) {
    const hasShare = Array.from(participant.trackPublications.values()).some(
      (pub) => pub.source === Track.Source.ScreenShare && !pub.isMuted && pub.track,
    );
    if (hasShare) {
      return participant.name || participant.identity;
    }
  }
  return null;
}

async function connectVoice(
  instance: Room,
  channelId: ChannelId,
  cancelled: () => boolean,
  setError: (value: string | null) => void,
  setConnectionState: (value: ConnectionState) => void,
  profile?: { displayName: string; avatarUrl: string | null },
) {
  setError(null);
  const result = await fetchLiveKitToken(channelId);
  if (cancelled()) {
    return;
  }
  if (!result.ok) {
    setError(result.error.message);
    setConnectionState(ConnectionState.Disconnected);
    return;
  }
  await instance.connect(result.data.url, result.data.token);
  await instance.startAudio();
  if (profile) {
    try {
      await instance.localParticipant.setName(profile.displayName);
      if (profile.avatarUrl) {
        let current: Record<string, unknown> = {};
        try {
          current = JSON.parse(instance.localParticipant.metadata || "{}") as Record<
            string,
            unknown
          >;
        } catch {
          current = {};
        }
        await instance.localParticipant.setMetadata(
          JSON.stringify({ ...current, avatarUrl: profile.avatarUrl }),
        );
      }
    } catch {
      // Nome já vem no JWT; metadata (avatar) é best-effort e não deve derrubar a sala.
    }
  }
  try {
    const enableMic = !readMicMuted();
    const prefs = readDevicePrefs();
    if (enableMic) {
      try {
        await instance.localParticipant.setMicrophoneEnabled(true, {
          ...MIC_CAPTURE,
          ...(prefs.audioinput ? { deviceId: prefs.audioinput } : {}),
        } as Parameters<Room["localParticipant"]["setMicrophoneEnabled"]>[1]);
      } catch {
        await instance.localParticipant.setMicrophoneEnabled(true, {
          ...MIC_CAPTURE_FALLBACK,
          ...(prefs.audioinput ? { deviceId: prefs.audioinput } : {}),
        } as Parameters<Room["localParticipant"]["setMicrophoneEnabled"]>[1]);
      }
    } else {
      await instance.localParticipant.setMicrophoneEnabled(false);
    }
    await applySavedDevices(instance);
  } catch {
    setError("Microfone indisponível. Você ainda pode ouvir a sala.");
  }
}

export function useRoom(
  channelId: ChannelId | null,
  profile?: { displayName: string; avatarUrl: string | null },
) {
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
    if (!channelId) {
      if (roomRef.current) {
        void leave();
      }
      return;
    }
    let cancelled = false;
    const instance = createLiveKitRoom();
    const onState = (state: ConnectionState) => setConnectionState(state);
    roomRef.current = instance;
    setRoom(instance);
    instance.on(RoomEvent.ConnectionStateChanged, onState);
    instance.on(RoomEvent.TrackSubscribed, onTrackSubscribed);
    instance.on(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);
    void connectVoice(
      instance,
      channelId,
      () => cancelled,
      setError,
      setConnectionState,
      profile,
    ).catch((err: unknown) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : "Falha ao conectar.");
        setConnectionState(ConnectionState.Disconnected);
      }
    });
    return () => {
      cancelled = true;
      instance.off(RoomEvent.ConnectionStateChanged, onState);
      instance.off(RoomEvent.TrackSubscribed, onTrackSubscribed);
      instance.off(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);
      void instance.disconnect();
      if (roomRef.current === instance) {
        roomRef.current = null;
      }
    };
  }, [channelId, leave, profile?.avatarUrl, profile?.displayName]);

  return {
    room,
    connectionState,
    error,
    leave,
    findScreenOwner: useCallback(() => findScreenShareOwner(roomRef.current), []),
  };
}
