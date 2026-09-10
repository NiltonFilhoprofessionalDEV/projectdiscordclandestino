import { Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ConnectionState } from "livekit-client";
import type { ParticipantView } from "../../hooks/useParticipants.ts";
import { isFullscreenActive, toggleFullscreen } from "../../lib/fullscreen.ts";
import { cn } from "../../lib/utils.ts";
import {
  getScreenShareAudioOutput,
  setScreenShareAudioOutput,
} from "../../services/livekit.ts";
import { IconButton } from "../ui/button.tsx";
import { HoverVolumePopover } from "../ui/HoverVolumePopover.tsx";
import { Icon } from "../ui/icon.tsx";
import { Tooltip } from "../ui/tooltip.tsx";
import { ParticipantTile } from "../participants/ParticipantTile.tsx";

type VoiceStageProps = {
  error: string | null;
  connectionState: ConnectionState;
  participants: ParticipantView[];
  screen: ParticipantView | null | undefined;
};

function ScreenShareVolumeControl() {
  const initial = getScreenShareAudioOutput();
  const [volume, setVolume] = useState(initial.volume);
  const [muted, setMuted] = useState(initial.muted);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setScreenShareAudioOutput(volume, muted);
  }, [muted, volume]);

  return (
    <div
      className="absolute bottom-3 left-3 z-20"
      onDoubleClick={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <HoverVolumePopover
        open={open}
        onOpenChange={setOpen}
        align="start"
        panel={
          <input
            id="screen-share-volume-slider"
            type="range"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            onChange={(event) => setVolume(Number(event.target.value) / 100)}
            aria-label="Volume da transmissão"
            className="voice-slider-vertical"
          />
        }
      >
        <IconButton
          type="button"
          size="iconSm"
          variant={muted ? "mute" : "secondary"}
          className="size-9 min-h-9 min-w-9 border border-white/[0.1] bg-abyss/80 text-cloud backdrop-blur-sm"
          aria-label={muted ? "Ativar áudio da transmissão" : "Volume da transmissão"}
          aria-expanded={open}
          aria-controls={open ? "screen-share-volume-slider" : undefined}
          title="Volume da transmissão"
          onClick={() => setMuted((current) => !current)}
        >
          <Icon icon={muted ? VolumeX : Volume2} size="action" />
        </IconButton>
      </HoverVolumePopover>
    </div>
  );
}

function ScreenShareStage({ screen }: { screen: ParticipantView }) {
  const frameRef = useRef<HTMLFigureElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const publication = screen.screenPublication!;

  useEffect(() => {
    const el = videoRef.current;
    const track = publication.track;
    if (!el || !track) {
      return;
    }
    track.attach(el);
    // Vídeo da tela nunca deve tocar áudio — o áudio da transmissão
    // passa pelos elementos controlados em livekit.ts (audioKind=screen).
    el.muted = true;
    el.playsInline = true;
    el.autoplay = true;
    void el.play().catch(() => undefined);
    return () => {
      track.detach(el);
    };
  }, [publication, publication.track]);

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
        muted
      />
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
      {!screen.isLocal ? <ScreenShareVolumeControl /> : null}
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
