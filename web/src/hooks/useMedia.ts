import { useCallback, useEffect, useState } from "react";
import { ScreenSharePresets, type Room } from "livekit-client";
import { toast } from "sonner";
import { writeMicMuted } from "../lib/storage.ts";

export function useMedia(room: Room | null, findScreenOwner: () => string | null) {
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [screenOn, setScreenOn] = useState(false);

  useEffect(() => {
    if (!room) {
      setMicOn(false);
      setCameraOn(false);
      setScreenOn(false);
      return;
    }

    const sync = () => {
      setMicOn(room.localParticipant.isMicrophoneEnabled);
      setCameraOn(room.localParticipant.isCameraEnabled);
      setScreenOn(room.localParticipant.isScreenShareEnabled);
    };

    sync();
    const id = window.setInterval(sync, 400);
    return () => window.clearInterval(id);
  }, [room]);

  const toggleMic = useCallback(async () => {
    if (!room) {
      return;
    }
    const next = !room.localParticipant.isMicrophoneEnabled;
    try {
      await room.localParticipant.setMicrophoneEnabled(next);
      writeMicMuted(!next);
      setMicOn(next);
    } catch {
      toast.error("Não foi possível usar o microfone.");
    }
  }, [room]);

  const toggleCamera = useCallback(async () => {
    if (!room) {
      return;
    }
    try {
      const next = !room.localParticipant.isCameraEnabled;
      await room.localParticipant.setCameraEnabled(next);
      setCameraOn(next);
    } catch {
      toast.error("Não foi possível usar a câmera.");
    }
  }, [room]);

  const toggleScreen = useCallback(async () => {
    if (!room) {
      return;
    }
    if (room.localParticipant.isScreenShareEnabled) {
      await room.localParticipant.setScreenShareEnabled(false);
      setScreenOn(false);
      return;
    }
    const owner = findScreenOwner();
    if (owner) {
      toast.message(`${owner} já está compartilhando a tela.`);
      return;
    }
    try {
      await room.localParticipant.setScreenShareEnabled(true, {
        audio: true,
        resolution: ScreenSharePresets.h1080fps15.resolution,
        contentHint: "detail",
      });
      setScreenOn(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.toLowerCase().includes("cancel") || message.toLowerCase().includes("denied")) {
        return;
      }
      toast.error("Não foi possível compartilhar a tela.");
    }
  }, [findScreenOwner, room]);

  return { micOn, cameraOn, screenOn, toggleMic, toggleCamera, toggleScreen };
}
