import { useEffect, useRef } from "react";
import type { TrackPublication } from "livekit-client";
import { Maximize2 } from "lucide-react";
import { IconButton } from "../ui/button.tsx";
import { Icon } from "../ui/icon.tsx";
import { Tooltip } from "../ui/tooltip.tsx";

type MediaTileProps = {
  publication: TrackPublication;
  label: string;
  large?: boolean;
  muteElement?: boolean;
  compact?: boolean;
};

export function MediaTile({ publication, label, large, muteElement, compact }: MediaTileProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
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

  return (
    <figure
      className={
        compact
          ? "relative aspect-video overflow-hidden rounded-xl bg-black"
          : large
            ? "surface-raised relative overflow-hidden rounded-[1.5rem]"
            : "surface relative aspect-video overflow-hidden rounded-[1.25rem]"
      }
    >
      <video
        ref={ref}
        className="h-full w-full bg-black object-contain"
        autoPlay
        playsInline
        muted={muteElement}
      />
      {compact ? null : (
        <>
          <Tooltip label="Tela cheia">
            <IconButton
              type="button"
              size="iconSm"
              variant="secondary"
              className="glass-bar absolute top-3 right-3"
              aria-label="Abrir em tela cheia"
              onClick={() => void ref.current?.requestFullscreen()}
            >
              <Icon icon={Maximize2} size="action" />
            </IconButton>
          </Tooltip>
          <figcaption className="glass-bar absolute bottom-3 left-3 rounded-lg px-3 py-1.5 text-xs text-cloud">
            {label}
          </figcaption>
        </>
      )}
    </figure>
  );
}
