import { Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ConnectionState } from "livekit-client";
import type { ParticipantView } from "../../hooks/useParticipants.ts";
import { isFullscreenActive, toggleFullscreen } from "../../lib/fullscreen.ts";
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
  const frameRef = useRef<HTMLFigureElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const publication = screen.screenPublication!;

  useEffect(() => {
    const el = videoRef.current;
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

  useEffect(() => {
    function syncFullscreen() {
      setFullscreen(isFullscreenActive(frameRef.current));
    }
    syncFullscreen();
    document.addEventListener("fullscreenchange", syncFullscreen);
    document.addEventListener("webkitfullscreenchange", syncFullscreen);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      document.removeEventListener("webkitfullscreenchange", syncFullscreen);
    };
  }, []);

  function handleToggleFullscreen() {
    if (frameRef.current) {
      void toggleFullscreen(frameRef.current, videoRef.current);
    }
  }

  return (
    <figure
      ref={frameRef}
      className="relative h-full min-h-0 cursor-pointer overflow-hidden rounded-[18px] border border-white/[0.06] bg-[#12131D]"
      title="Clique duas vezes para tela cheia"
      onDoubleClick={(event) => {
        event.preventDefault();
        handleToggleFullscreen();
      }}
    >
      <video
        ref={videoRef}
        className="h-full w-full bg-black object-contain"
        autoPlay
        playsInline
        muted={screen.isLocal}
      />
      <p className="pointer-events-none absolute top-3 left-3 z-10 max-w-[min(70%,20rem)] truncate rounded-lg border border-white/[0.08] bg-abyss/80 px-3 py-1.5 text-xs font-medium text-cloud backdrop-blur-sm">
        {screen.name} está compartilhando a tela
      </p>
      <div
        className="absolute top-3 right-3 z-20"
        onDoubleClick={(event) => event.stopPropagation()}
      >
        <Tooltip label={fullscreen ? "Sair da tela cheia" : "Tela cheia"}>
          <IconButton
            type="button"
            size="iconSm"
            variant="secondary"
            className="size-9 min-h-9 min-w-9 border border-white/[0.1] bg-abyss/80 backdrop-blur-sm"
            aria-label={fullscreen ? "Sair da tela cheia" : "Abrir em tela cheia"}
            onClick={handleToggleFullscreen}
          >
            <Icon icon={fullscreen ? Minimize2 : Maximize2} size="action" />
          </IconButton>
        </Tooltip>
      </div>
      {!screen.isLocal ? (
        <div
          className="absolute right-3 bottom-3 z-20 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-abyss/80 px-3 py-2 backdrop-blur-sm"
          onDoubleClick={(event) => event.stopPropagation()}
        >
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
          {participants.map((participant) => (
            <ParticipantTile key={participant.identity} participant={participant} />
          ))}
        </div>
      )}
    </div>
  );
}
