import { useEffect, useState } from "react";
import {
  ConnectionQuality,
  RoomEvent,
  type Room,
} from "livekit-client";
import { readRoundTripMs } from "../services/livekit.ts";

export function useConnectionQuality(room: Room | null) {
  const [quality, setQuality] = useState<ConnectionQuality>(ConnectionQuality.Excellent);
  const [rttMs, setRttMs] = useState<number | null>(null);

  useEffect(() => {
    if (!room) {
      setRttMs(null);
      return;
    }

    const onQuality = (next: ConnectionQuality, participant: { isLocal: boolean }) => {
      if (participant.isLocal) {
        setQuality(next);
      }
    };

    setQuality(room.localParticipant.connectionQuality);
    room.on(RoomEvent.ConnectionQualityChanged, onQuality);

    const id = window.setInterval(() => {
      void readRoundTripMs(room).then((value) => {
        if (value !== null) {
          setRttMs(value);
        }
      });
    }, 3000);

    return () => {
      room.off(RoomEvent.ConnectionQualityChanged, onQuality);
      window.clearInterval(id);
    };
  }, [room]);

  return { quality, rttMs };
}
