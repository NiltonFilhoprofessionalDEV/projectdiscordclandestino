import { useCallback, useEffect, useState } from "react";
import {
  createLocalScreenTracks,
  Track,
  VideoPresets,
  type LocalTrack,
  type Room,
} from "livekit-client";
import { toast } from "sonner";
import {
  readDevicePrefs,
  readVoiceActivityOn,
  writeMicMuted,
  writeVoiceActivityOn,
} from "../lib/storage.ts";
import {
  defaultScreenShareConfig,
  isScreenShareCancelError,
  screenShareCaptureOptions,
  type ScreenShareConfig,
} from "../voice/screenShare.ts";
import { useVoiceActivityGate } from "./useVoiceActivityGate.ts";

const CAMERA_OPTIONS = [
  { facingMode: "user" as const, resolution: VideoPresets.h360.resolution },
  { facingMode: "user" as const, resolution: VideoPresets.h180.resolution },
  { facingMode: "user" as const },
  {},
];

const MIC_CAPTURE = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  voiceIsolation: true,
  channelCount: 1,
} as const;

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
  const prefs = readDevicePrefs();
  let lastError: unknown;
  const optionSets = prefs.videoinput
    ? [
        { deviceId: prefs.videoinput, facingMode: "user" as const, resolution: VideoPresets.h360.resolution },
        { deviceId: prefs.videoinput, facingMode: "user" as const, resolution: VideoPresets.h180.resolution },
        { deviceId: prefs.videoinput, facingMode: "user" as const },
        { deviceId: prefs.videoinput },
        ...CAMERA_OPTIONS,
      ]
    : CAMERA_OPTIONS;
  for (const options of optionSets) {
    try {
      await room.localParticipant.setCameraEnabled(true, options);
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function enableMicrophone(room: Room) {
  const prefs = readDevicePrefs();
  const device = prefs.audioinput ? { deviceId: prefs.audioinput } : {};
  try {
    await room.localParticipant.setMicrophoneEnabled(true, {
      ...MIC_CAPTURE,
      ...device,
    });
  } catch {
    await room.localParticipant.setMicrophoneEnabled(true, {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      ...device,
    });
  }
}

async function unpublishScreenTracks(room: Room) {
  const sources = [Track.Source.ScreenShare, Track.Source.ScreenShareAudio] as const;
  for (const source of sources) {
    const publication = room.localParticipant.getTrackPublication(source);
    if (publication?.track) {
      await room.localParticipant.unpublishTrack(publication.track, true);
    }
  }
}

async function publishScreenTracks(room: Room, tracks: LocalTrack[]) {
  for (const track of tracks) {
    await room.localParticipant.publishTrack(track);
  }
}

export function useMedia(room: Room | null, findScreenOwner: () => string | null) {
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [screenOn, setScreenOn] = useState(false);
  const [screenConfig, setScreenConfig] = useState(defaultScreenShareConfig);
  const [voiceActivityOn, setVoiceActivityOn] = useState(readVoiceActivityOn);

  useEffect(() => {
    if (!room) {
      setMicOn(false);
      setCameraOn(false);
      setScreenOn(false);
      return;
    }

    const sync = () => {
      setCameraOn(room.localParticipant.isCameraEnabled);
      setScreenOn(room.localParticipant.isScreenShareEnabled);
      // Enquanto o VAD usa track.mute(), LiveKit reporta isMicrophoneEnabled=false.
      // O botão de mic deve seguir a intenção do usuário, não o getter do LiveKit.
      if (!voiceActivityOn) {
        setMicOn(room.localParticipant.isMicrophoneEnabled);
      }
    };

    sync();
    const id = window.setInterval(sync, 400);
    return () => window.clearInterval(id);
  }, [room, voiceActivityOn]);

  const localSpeaking = useVoiceActivityGate(room, micOn, voiceActivityOn);

  const toggleMic = useCallback(async () => {
    if (!room) {
      return;
    }
    const next = !micOn;
    try {
      if (next) {
        await enableMicrophone(room);
        writeMicMuted(false);
        setMicOn(true);
      } else {
        // Solta o VAD (track.mute) antes de desligar o mic de verdade.
        setMicOn(false);
        writeMicMuted(true);
        await room.localParticipant.setMicrophoneEnabled(false);
      }
    } catch {
      toast.error("Não foi possível usar o microfone.");
    }
  }, [micOn, room]);

  const toggleVoiceActivity = useCallback(() => {
    setVoiceActivityOn((current) => {
      const next = !current;
      writeVoiceActivityOn(next);
      return next;
    });
  }, []);

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

  const startScreen = useCallback(
    async (config: ScreenShareConfig = screenConfig) => {
      if (!room) {
        return;
      }
      if (room.localParticipant.isScreenShareEnabled) {
        return;
      }
      const owner = findScreenOwner();
      if (owner) {
        toast.message(`${owner} já está compartilhando a tela.`);
        return;
      }
      try {
        await room.localParticipant.setScreenShareEnabled(true, screenShareCaptureOptions(config));
        setScreenConfig(config);
        setScreenOn(true);
      } catch (err) {
        if (isScreenShareCancelError(err)) {
          return;
        }
        toast.error("Não foi possível compartilhar a tela.");
      }
    },
    [findScreenOwner, room, screenConfig],
  );

  const stopScreen = useCallback(async () => {
    if (!room) {
      return;
    }
    await unpublishScreenTracks(room);
    await room.localParticipant.setScreenShareEnabled(false);
    setScreenOn(false);
  }, [room]);

  const replaceScreen = useCallback(
    async (config: ScreenShareConfig) => {
      if (!room) {
        return;
      }
      let nextTracks: LocalTrack[] | undefined;
      try {
        nextTracks = await createLocalScreenTracks(screenShareCaptureOptions(config));
      } catch (err) {
        if (isScreenShareCancelError(err)) {
          return;
        }
        toast.error("Não foi possível trocar a janela.");
        return;
      }
      try {
        await unpublishScreenTracks(room);
        await publishScreenTracks(room, nextTracks);
        setScreenConfig(config);
        setScreenOn(true);
      } catch (err) {
        nextTracks.forEach((track) => track.stop());
        if (isScreenShareCancelError(err)) {
          setScreenOn(false);
          return;
        }
        toast.error("Não foi possível trocar a janela.");
        setScreenOn(false);
      }
    },
    [room],
  );

  return {
    micOn,
    cameraOn,
    screenOn,
    screenConfig,
    voiceActivityOn,
    localSpeaking,
    toggleMic,
    toggleVoiceActivity,
    toggleCamera,
    startScreen,
    stopScreen,
    replaceScreen,
  };
}
