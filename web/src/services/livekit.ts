import {
  Room,
  ScreenSharePresets,
  Track,
  VideoPresets,
  type RemoteTrack,
} from "livekit-client";

export function createLiveKitRoom(): Room {
  return new Room({
    adaptiveStream: true,
    dynacast: true,
    disconnectOnPageLeave: true,
    audioCaptureDefaults: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
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

export function attachRemoteAudio(track: RemoteTrack): void {
  if (track.kind !== Track.Kind.Audio) {
    return;
  }
  const el = track.attach();
  el.style.display = "none";
  document.body.appendChild(el);
}

export function detachTrack(track: RemoteTrack): void {
  track.detach().forEach((el) => el.remove());
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
