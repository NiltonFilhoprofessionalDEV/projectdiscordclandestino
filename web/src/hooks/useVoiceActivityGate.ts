import { useEffect, useRef, useState } from "react";
import { Track, type LocalAudioTrack, type Room } from "livekit-client";

/** Limiar alto: teclado/ventilador/ambiente não abrem o gate. */
const OPEN_THRESHOLD = 0.09;
const CLOSE_THRESHOLD = 0.04;
const HOLD_MS = 320;
const TICK_MS = 50;
const HIGHPASS_HZ = 140;

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
  const micOnRef = useRef(micOn);
  micOnRef.current = micOn;
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
      // Só libera o gate se o mic continua ligado e só o VAD foi desligado.
      if (room && micOn && !voiceActivityOn) {
        releaseGate(publication?.track as LocalAudioTrack | undefined);
      } else {
        gateMutedRef.current = false;
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
      if (localTrack.isMuted) {
        gateMutedRef.current = false;
        await localTrack.unmute();
      }
      const mediaTrack = localTrack.mediaStreamTrack;
      if (!mediaTrack) {
        return;
      }

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
      const highpass = audioContext.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.value = HIGHPASS_HZ;
      highpass.Q.value = 0.7;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.35;
      source.connect(highpass);
      highpass.connect(analyser);
      const buffer = new Uint8Array(analyser.fftSize);

      gateMutedRef.current = true;
      speaking = false;
      setSpeakingUi(false);
      silentSince = performance.now();
      await localTrack.mute();

      intervalId = window.setInterval(() => {
        if (cancelled || !localTrack || !micOnRef.current) {
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
      // Lê a intenção ATUAL — o cleanup fecha sobre micOn antigo=true e reabria o mic.
      if (micOnRef.current) {
        releaseGate(localTrack ?? undefined);
      } else {
        gateMutedRef.current = false;
      }
    };
  }, [micOn, room, voiceActivityOn]);

  return speakingUi;
}
