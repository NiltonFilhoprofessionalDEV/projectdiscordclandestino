import { Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ParticipantView } from "../../hooks/useParticipants.ts";
import { useScreenVideo } from "../../hooks/useScreenVideo.ts";
import { isFullscreenActive, toggleFullscreen } from "../../lib/fullscreen.ts";
import {
  getScreenShareAudioOutput,
  setScreenShareAudioOutput,
} from "../../services/livekit.ts";
import { IconButton } from "../ui/button.tsx";
import { HoverVolumePopover } from "../ui/HoverVolumePopover.tsx";
import { Icon } from "../ui/icon.tsx";
import { Tooltip } from "../ui/tooltip.tsx";

function ScreenShareVolumeControl({ identity }: { identity: string }) {
  const initial = getScreenShareAudioOutput(identity);
  const [volume, setVolume] = useState(initial.volume);
  const [muted, setMuted] = useState(initial.muted);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setScreenShareAudioOutput(identity, volume, muted);
  }, [identity, muted, volume]);

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

export function ScreenShareStage({ screen }: { screen: ParticipantView }) {
  const frameRef = useRef<HTMLElement>(null);
  const videoRef = useScreenVideo(screen.screenPublication!);
  const [fullscreen, setFullscreen] = useState(false);

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
      {!screen.isLocal ? <ScreenShareVolumeControl identity={screen.identity} /> : null}
    </figure>
  );
}
