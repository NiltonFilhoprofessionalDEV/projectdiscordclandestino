import { Maximize2, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ConnectionState } from "livekit-client";
import type { ParticipantView } from "../../hooks/useParticipants.ts";
import { cn } from "../../lib/utils.ts";
import { setScreenShareAudioOutput } from "../../services/livekit.ts";
import { IconButton } from "../ui/button.tsx";
import { Icon } from "../ui/icon.tsx";
import { Tooltip } from "../ui/tooltip.tsx";
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
    <figure className="relative h-full min-h-0 overflow-hidden rounded-[18px] border border-white/[0.06] bg-[#12131D]">
      <video
        ref={ref}
        className="h-full w-full bg-black object-contain"
        autoPlay
        playsInline
        muted={screen.isLocal}
      />
      <p className="absolute top-3 left-3 rounded-lg border border-white/[0.08] bg-abyss/80 px-3 py-1.5 text-xs font-medium text-cloud backdrop-blur-sm">
        {screen.name} está compartilhando a tela
      </p>
      <Tooltip label="Tela cheia">
        <IconButton
          type="button"
          size="iconSm"
          variant="secondary"
          className="absolute top-3 right-3"
          aria-label="Abrir em tela cheia"
          onClick={() => void ref.current?.requestFullscreen()}
        >
          <Icon icon={Maximize2} size="action" />
        </IconButton>
      </Tooltip>
      {!screen.isLocal ? (
        <div className="absolute right-3 bottom-3 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-abyss/80 px-3 py-2 backdrop-blur-sm">
          <Tooltip label={muted ? "Ativar áudio" : "Mutar transmissão"}>
            <IconButton
              type="button"
              size="iconSm"
              variant={muted ? "mute" : "ghost"}
              className="size-8 min-h-8 min-w-8"
              onClick={() => setMuted((current) => !current)}
              aria-label={muted ? "Ativar áudio da transmissão" : "Mutar transmissão"}
            >
              <Icon icon={muted ? VolumeX : Volume2} size="action" />
            </IconButton>
          </Tooltip>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            onChange={(event) => setVolume(Number(event.target.value) / 100)}
            aria-label="Volume da transmissão"
            className="voice-slider w-28"
          />
        </div>
      ) : null}
    </figure>
  );
}

export function VoiceStage({ error, connectionState, participants, screen }: VoiceStageProps) {
  const sharing = Boolean(screen?.screenPublication);

  return (
    <div className={cn("flex min-h-0 flex-col", sharing && "h-full min-h-0 flex-1")}>
      {error ? <p className="mb-3 shrink-0 text-sm text-coral">{error}</p> : null}
      {connectionState === ConnectionState.Connected && participants.length === 0 ? (
        <p className="text-haze">Ninguém mais por aqui ainda.</p>
      ) : null}
      {sharing && screen ? (
        <>
          <div className="min-h-0 flex-1">
            <ScreenShareStage screen={screen} />
          </div>
          {participants.length > 0 ? (
            <div className="mt-3 flex shrink-0 gap-2 overflow-x-auto pb-1">
              {participants.map((participant) => (
                <ParticipantTile key={participant.identity} participant={participant} compact />
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {participants.map((participant) => (
            <ParticipantTile key={participant.identity} participant={participant} />
          ))}
        </div>
      )}
    </div>
  );
}
