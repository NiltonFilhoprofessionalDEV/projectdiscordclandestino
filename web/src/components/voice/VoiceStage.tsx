import { useEffect, useRef, useState } from "react";
import { ConnectionState } from "livekit-client";
import { Maximize2, Volume2, VolumeX } from "lucide-react";
import type { ParticipantView } from "../../hooks/useParticipants.ts";
import { setScreenShareAudioOutput } from "../../services/livekit.ts";
import { ParticipantTile } from "../participants/ParticipantTile.tsx";

type VoiceStageProps = {
  error: string | null;
  connectionState: ConnectionState;
  participants: ParticipantView[];
  screen: ParticipantView | null | undefined;
};

function ScreenShareStage({ screen }: { screen: ParticipantView }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const publication = screen.screenPublication!;

  useEffect(() => {
    const el = ref.current;
    const track = publication.track;
    if (!el || !track) {
      return;
    }
    track.attach(el);
    el.muted = Boolean(screen.isLocal);
    el.playsInline = true;
    el.autoplay = true;
    void el.play().catch(() => undefined);
    return () => {
      track.detach(el);
    };
  }, [publication, publication.track, screen.isLocal]);

  useEffect(() => {
    setScreenShareAudioOutput(volume, muted);
  }, [muted, volume]);

  return (
    <div className="mb-4">
      <p className="mb-2 text-sm text-electric">{screen.name} está compartilhando a tela</p>
      <figure className="surface-raised relative overflow-hidden rounded-[1.5rem]">
        <video
          ref={ref}
          className="h-full max-h-[55vh] w-full object-contain bg-black"
          autoPlay
          playsInline
          muted={screen.isLocal}
        />
        <button
          type="button"
          className="glass-bar absolute top-3 right-3 rounded-md p-2 text-cloud hover:bg-white/15"
          aria-label="Abrir em tela cheia"
          onClick={() => void ref.current?.requestFullscreen()}
        >
          <Maximize2 className="size-4" />
        </button>
        {!screen.isLocal ? (
          <div className="glass-bar absolute right-3 bottom-3 flex items-center gap-2 rounded-lg px-3 py-2">
            <button
              type="button"
              onClick={() => setMuted((current) => !current)}
              aria-label={muted ? "Ativar áudio da transmissão" : "Mutar transmissão"}
            >
              {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              onChange={(event) => setVolume(Number(event.target.value) / 100)}
              aria-label="Volume da transmissão"
              className="w-28 accent-electric"
            />
          </div>
        ) : null}
        <figcaption className="glass-bar absolute bottom-3 left-3 rounded-lg px-3 py-1.5 text-xs text-cloud">
          {screen.name}
        </figcaption>
      </figure>
    </div>
  );
}

export function VoiceStage({ error, connectionState, participants, screen }: VoiceStageProps) {
  return (
    <>
      {error ? <p className="mb-3 text-sm text-coral">{error}</p> : null}
      {connectionState === ConnectionState.Connected && participants.length === 0 ? (
        <p className="text-haze">Ninguém mais por aqui ainda.</p>
      ) : null}
      {screen?.screenPublication ? <ScreenShareStage screen={screen} /> : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {participants.map((participant) => (
          <ParticipantTile key={participant.identity} participant={participant} />
        ))}
      </div>
    </>
  );
}
