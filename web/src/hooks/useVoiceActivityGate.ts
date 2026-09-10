import { useEffect, useRef, useState } from "react";
import { Track, type LocalAudioTrack, type Room } from "livekit-client";

const OPEN_THRESHOLD = 0.045;
const CLOSE_THRESHOLD = 0.022;
const HOLD_MS = 450;
const TICK_MS = 50;

function rmsFromAnalyser(analyser: AnalyserNode, buffer: Uint8Array): number {
  analyser.getByteTimeDomainData(buffer);
  let sum = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    const sample = (buffer[i]! - 128) / 128;
    sum += sample * sample;
  }
  return Math.sqrt(sum / buffer.length);
}

/**
 * Gate de atividade de voz — independente do mute do usuário.
 * Só roda quando mic está ligado E a opção de reconhecimento está ativa.
 * Usa mute da track publicada (LiveKit trata isso como isMicrophoneEnabled=false),
 * então o estado de intenção do mic fica no React (useMedia), não no getter do LiveKit.
 * Expõe `speaking` para o anel verde local.
 */
export function useVoiceActivityGate(
  room: Room | null,
  micOn: boolean,
  voiceActivityOn: boolean,
): boolean {
  const gateMutedRef = useRef(false);
  const [speakingUi, setSpeakingUi] = useState(false);

  useEffect(() => {
    function releaseGate(track: LocalAudioTrack | undefined) {
      if (!track || !gateMutedRef.current) {
        return;
      }
      gateMutedRef.current = false;
      void track.unmute();
    }

    if (!room || !micOn || !voiceActivityOn) {
      setSpeakingUi(false);
      const publication = room?.localParticipant.getTrackPublication(Track.Source.Microphone);
      releaseGate(publication?.track as LocalAudioTrack | undefined);
      return;
    }

    let cancelled = false;
    let audioContext: AudioContext | null = null;
    let intervalId = 0;
    let speaking = false;
    let silentSince = performance.now();
    let localTrack: LocalAudioTrack | null = null;
    let monitorTrack: MediaStreamTrack | null = null;

    async function start() {
      const publication = room!.localParticipant.getTrackPublication(Track.Source.Microphone);
      const track = publication?.track;
      if (!track || track.kind !== Track.Kind.Audio) {
        return;
      }
      localTrack = track as LocalAudioTrack;
      // Garante áudio no clone mesmo se um gate anterior deixou a track mutada.
      if (localTrack.isMuted) {
        gateMutedRef.current = false;
        await localTrack.unmute();
      }
      const mediaTrack = localTrack.mediaStreamTrack;
      if (!mediaTrack) {
        return;
      }

      // Analisa um clone para o gate não interferir no stream publicado.
      monitorTrack = mediaTrack.clone();
      monitorTrack.enabled = true;
      const Ctx =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) {
        monitorTrack.stop();
        monitorTrack = null;
        return;
      }

      audioContext = new Ctx();
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }
      if (cancelled) {
        return;
      }

      const source = audioContext.createMediaStreamSource(new MediaStream([monitorTrack]));
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.55;
      source.connect(analyser);
      const buffer = new Uint8Array(analyser.fftSize);

      gateMutedRef.current = true;
      speaking = false;
      setSpeakingUi(false);
      silentSince = performance.now();
      await localTrack.mute();

      intervalId = window.setInterval(() => {
        if (cancelled || !localTrack) {
          return;
        }
        // Intenção do usuário (micOn) é a fonte da verdade — isMicrophoneEnabled
        // fica false enquanto o gate muta a track.
        if (!micOn) {
          if (speaking) {
            speaking = false;
            setSpeakingUi(false);
          }
          return;
        }
        const level = rmsFromAnalyser(analyser, buffer);
        const now = performance.now();
        if (level >= OPEN_THRESHOLD) {
          silentSince = now;
          if (!speaking) {
            speaking = true;
            setSpeakingUi(true);
            gateMutedRef.current = false;
            void localTrack.unmute();
          }
          return;
        }
        if (speaking && level <= CLOSE_THRESHOLD && now - silentSince >= HOLD_MS) {
          speaking = false;
          setSpeakingUi(false);
          gateMutedRef.current = true;
          void localTrack.mute();
        }
      }, TICK_MS);
    }

    void start();

    return () => {
      cancelled = true;
      setSpeakingUi(false);
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      monitorTrack?.stop();
      void audioContext?.close();
      // Sempre libera o gate ao desmontar — mute() do LiveKit zera isMicrophoneEnabled.
      releaseGate(localTrack ?? undefined);
    };
  }, [micOn, room, voiceActivityOn]);

  return speakingUi;
}
