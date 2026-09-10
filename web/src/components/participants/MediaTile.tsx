import { useEffect, useRef } from "react";
import type { TrackPublication } from "livekit-client";
import { Maximize2 } from "lucide-react";
import { IconButton } from "../ui/button.tsx";
import { Icon } from "../ui/icon.tsx";
import { Tooltip } from "../ui/tooltip.tsx";
import { enterFullscreen } from "../../lib/fullscreen.ts";

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

  async function openFullscreen() {
    if (!frameRef.current) {
      return;
    }
    await enterFullscreen(frameRef.current, videoRef.current);
  }

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
      <Tooltip label="Tela cheia">
        <IconButton
          type="button"
          size="iconSm"
          variant="secondary"
          className={
            compact
              ? "glass-bar absolute top-1 right-1 z-10 size-8 min-h-8 min-w-8"
              : "glass-bar absolute top-3 right-3 z-10"
          }
          aria-label="Abrir câmera em tela cheia"
          onClick={() => void openFullscreen()}
        >
          <Icon icon={Maximize2} size="action" />
        </IconButton>
      </Tooltip>
      {compact ? null : (
        <figcaption className="glass-bar absolute bottom-3 left-3 rounded-lg px-3 py-1.5 text-xs text-cloud">
          {label}
        </figcaption>
      )}
    </figure>
  );
}
