import { useCallback, useEffect, useState } from "react";
import { ScreenSharePresets, VideoPresets, type Room } from "livekit-client";
import { toast } from "sonner";
import { writeMicMuted } from "../lib/storage.ts";

const CAMERA_OPTIONS = [
  { facingMode: "user" as const, resolution: VideoPresets.h360.resolution },
  { facingMode: "user" as const, resolution: VideoPresets.h180.resolution },
  { facingMode: "user" as const },
  {},
];

function cameraErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError" || message.toLowerCase().includes("denied")) {
    return "Permissão da câmera negada. Autorize a câmera no navegador e tente de novo.";
  }
  if (name === "NotFoundError") {
    return "Nenhuma câmera foi encontrada neste aparelho.";
  }
  if (name === "NotReadableError" || message.toLowerCase().includes("busy")) {
    return "A câmera está em uso por outro aplicativo.";
  }
  if (name === "OverconstrainedError") {
    return "Esta câmera não aceitou a resolução pedida. Tente de novo.";
  }
  return message || "Não foi possível usar a câmera.";
}

async function enableCamera(room: Room) {
  let lastError: unknown;
  for (const options of CAMERA_OPTIONS) {
    try {
      await room.localParticipant.setCameraEnabled(true, options);
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

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
      toast.error("Entre em uma sala para ligar a câmera.");
      return;
    }
    if (room.state !== "connected") {
      toast.error("Aguarde a conexão terminar e tente de novo.");
      return;
    }
    const turningOn = !room.localParticipant.isCameraEnabled;
    try {
      if (turningOn) {
        await enableCamera(room);
        setCameraOn(true);
      } else {
        await room.localParticipant.setCameraEnabled(false);
        setCameraOn(false);
      }
    } catch (error) {
      toast.error(cameraErrorMessage(error));
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
