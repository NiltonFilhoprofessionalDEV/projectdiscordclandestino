import { useEffect, useRef, useState } from "react";
import type { TrackPublication } from "livekit-client";
import { Maximize2, Minimize2 } from "lucide-react";
import { IconButton } from "../ui/button.tsx";
import { Icon } from "../ui/icon.tsx";
import { Tooltip } from "../ui/tooltip.tsx";
import { isFullscreenActive, toggleFullscreen } from "../../lib/fullscreen.ts";

type MediaTileProps = {
  publication: TrackPublication;
  label: string;
  large?: boolean;
  muteElement?: boolean;
  compact?: boolean;
};

export function MediaTile({ publication, label, large, muteElement, compact }: MediaTileProps) {
  const frameRef = useRef<HTMLFigureElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    const track = publication.track;
    if (!el || !track) {
      return;
    }
    track.attach(el);
    el.muted = Boolean(muteElement);
    el.playsInline = true;
    el.autoplay = true;
    void el.play().catch(() => {
      /* autoplay can wait for a gesture; the click that opened the camera already happened */
    });
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

  return (
    <figure
      ref={frameRef}
      className={
        compact
          ? "relative aspect-video overflow-hidden rounded-xl bg-black"
          : large
            ? "surface-raised relative overflow-hidden rounded-[1.5rem]"
            : "surface relative aspect-video overflow-hidden rounded-[1.25rem]"
      }
    >
      <video
        ref={videoRef}
        className="h-full w-full bg-black object-contain"
        autoPlay
        playsInline
        muted={muteElement}
      />
      <div className={compact ? "absolute top-1 right-1 z-10" : "absolute top-3 right-3 z-10"}>
        <Tooltip label={fullscreen ? "Sair da tela cheia" : "Tela cheia"}>
          <IconButton
            type="button"
            size="iconSm"
            variant="secondary"
            className={compact ? "glass-bar size-8 min-h-8 min-w-8" : "glass-bar"}
            aria-label={fullscreen ? "Sair da tela cheia" : "Abrir câmera em tela cheia"}
            onClick={() => {
              if (frameRef.current) {
                void toggleFullscreen(frameRef.current, videoRef.current);
              }
            }}
          >
            <Icon icon={fullscreen ? Minimize2 : Maximize2} size="action" />
          </IconButton>
        </Tooltip>
      </div>
      {compact ? null : (
        <figcaption className="glass-bar absolute bottom-3 left-3 rounded-lg px-3 py-1.5 text-xs text-cloud">
          {label}
        </figcaption>
      )}
    </figure>
  );
}
