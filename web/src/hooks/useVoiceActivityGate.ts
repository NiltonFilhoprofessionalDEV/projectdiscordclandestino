import { useEffect, useRef } from "react";
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
 * Usa mute da track publicada, sem chamar setMicrophoneEnabled.
 */
export function useVoiceActivityGate(
  room: Room | null,
  micOn: boolean,
  voiceActivityOn: boolean,
) {
  const gateMutedRef = useRef(false);

  useEffect(() => {
    if (!room || !micOn || !voiceActivityOn) {
      const publication = room?.localParticipant.getTrackPublication(Track.Source.Microphone);
      const track = publication?.track as LocalAudioTrack | undefined;
      // Se o reconhecimento desliga (ou mic desliga), libera o gate — o mute do usuário
      // continua controlado só por setMicrophoneEnabled.
      if (track && micOn && gateMutedRef.current) {
        gateMutedRef.current = false;
        void track.unmute();
      }
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
      const mediaTrack = localTrack.mediaStreamTrack;
      if (!mediaTrack) {
        return;
      }

      // Analisa um clone para o gate não interferir no stream publicado.
      monitorTrack = mediaTrack.clone();
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
      silentSince = performance.now();
      await localTrack.mute();

      intervalId = window.setInterval(() => {
        if (cancelled || !localTrack) {
          return;
        }
        // Se o usuário mutou o mic no meio do caminho, para o gate.
        if (!room!.localParticipant.isMicrophoneEnabled) {
          return;
        }
        const level = rmsFromAnalyser(analyser, buffer);
        const now = performance.now();
        if (level >= OPEN_THRESHOLD) {
          silentSince = now;
          if (!speaking) {
            speaking = true;
            gateMutedRef.current = false;
            void localTrack.unmute();
          }
          return;
        }
        if (speaking && level <= CLOSE_THRESHOLD && now - silentSince >= HOLD_MS) {
          speaking = false;
          gateMutedRef.current = true;
          void localTrack.mute();
        }
      }, TICK_MS);
    }

    void start();

    return () => {
      cancelled = true;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      monitorTrack?.stop();
      void audioContext?.close();
      // Não desmuta aqui se o usuário desligou o mic — só libera o gate se o mic ainda está on.
      if (localTrack && room.localParticipant.isMicrophoneEnabled && gateMutedRef.current) {
        gateMutedRef.current = false;
        void localTrack.unmute();
      }
    };
  }, [micOn, room, voiceActivityOn]);
}
