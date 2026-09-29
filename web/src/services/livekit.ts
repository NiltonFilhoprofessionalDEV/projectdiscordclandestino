import {
  Room,
  ScreenSharePresets,
  Track,
  VideoPresets,
  type RemoteParticipant,
  type RemoteTrack,
  type RemoteTrackPublication,
} from "livekit-client";
import { MIC_CAPTURE } from "../voice/micCapture.ts";

let remoteOutputVolume = 1;
let remoteOutputMuted = false;
const participantVolumes = new Map<string, number>();
const participantMuted = new Map<string, boolean>();
const screenShareVolumes = new Map<string, number>();
const screenShareMuted = new Map<string, boolean>();

export function createLiveKitRoom(): Room {
  return new Room({
    adaptiveStream: true,
    dynacast: true,
    disconnectOnPageLeave: true,
    audioCaptureDefaults: {
      ...MIC_CAPTURE,
    } as never,
    videoCaptureDefaults: {
      facingMode: "user",
      resolution: VideoPresets.h360.resolution,
    },
    publishDefaults: {
      simulcast: true,
      screenShareEncoding: ScreenSharePresets.h1080fps15.encoding,
    },
  });
}

function applyElementGain(el: HTMLAudioElement) {
  const identity = el.dataset.participantIdentity ?? "";
  // Áudio da transmissão é independente do volume de voz da mesma pessoa.
  if (el.dataset.audioKind === "screen") {
    const shareVol = screenShareVolumes.get(identity) ?? 1;
    el.volume = Math.max(0, Math.min(1, remoteOutputVolume * shareVol));
    el.muted = remoteOutputMuted || (screenShareMuted.get(identity) ?? false);
    return;
  }
  const participantVol = participantVolumes.get(identity) ?? 1;
  el.volume = Math.max(0, Math.min(1, remoteOutputVolume * participantVol));
  el.muted = remoteOutputMuted || (participantMuted.get(identity) ?? false);
}

function refreshAllRemoteAudio() {
  document
    .querySelectorAll<HTMLAudioElement>('audio[data-remote-audio="true"]')
    .forEach((audioEl) => applyElementGain(audioEl));
}

export function attachRemoteAudio(
  track: RemoteTrack,
  participant?: RemoteParticipant,
  publication?: RemoteTrackPublication,
): void {
  if (track.kind !== Track.Kind.Audio) {
    return;
  }
  const el = track.attach() as HTMLAudioElement;
  el.style.display = "none";
  el.dataset.remoteAudio = "true";
  el.dataset.remoteTrackSid = track.sid;
  if (participant) {
    el.dataset.participantIdentity = participant.identity;
  }
  const source = publication?.source ?? track.source;
  el.dataset.audioKind =
    source === Track.Source.ScreenShare || source === Track.Source.ScreenShareAudio
      ? "screen"
      : "mic";
  applyElementGain(el);
  document.body.appendChild(el);
}

export function detachTrack(track: RemoteTrack): void {
  track.detach().forEach((el) => el.remove());
}

export function setRemoteAudioOutput(volume: number, muted: boolean): void {
  remoteOutputVolume = Math.max(0, Math.min(1, volume));
  remoteOutputMuted = muted;
  refreshAllRemoteAudio();
}

export function setParticipantAudioOutput(
  identity: string,
  volume: number,
  muted: boolean,
): void {
  participantVolumes.set(identity, Math.max(0, Math.min(1, volume)));
  participantMuted.set(identity, muted);
  refreshAllRemoteAudio();
}

export function getParticipantAudioOutput(identity: string): { volume: number; muted: boolean } {
  return {
    volume: participantVolumes.get(identity) ?? 1,
    muted: participantMuted.get(identity) ?? false,
  };
}

export function setScreenShareAudioOutput(
  identity: string,
  volume: number,
  muted: boolean,
): void {
  screenShareVolumes.set(identity, Math.max(0, Math.min(1, volume)));
  screenShareMuted.set(identity, muted);
  refreshAllRemoteAudio();
}

export function getScreenShareAudioOutput(identity: string): { volume: number; muted: boolean } {
  return {
    volume: screenShareVolumes.get(identity) ?? 1,
    muted: screenShareMuted.get(identity) ?? false,
  };
}

export async function readRoundTripMs(room: Room): Promise<number | null> {
  const engine = room as unknown as {
    engine?: { pcManager?: { subscriber?: { pc?: RTCPeerConnection } } };
  };
  const pc = engine.engine?.pcManager?.subscriber?.pc;
  if (!pc) {
    return null;
  }

  const stats = await pc.getStats();
  let rtt: number | null = null;
  stats.forEach((report) => {
    if (
      report.type === "candidate-pair" &&
      report.state === "succeeded" &&
      typeof report.currentRoundTripTime === "number"
    ) {
      rtt = Math.round(report.currentRoundTripTime * 1000);
    }
  });
  return rtt;
}
