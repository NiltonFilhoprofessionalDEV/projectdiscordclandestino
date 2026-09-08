import { useEffect, useRef } from "react";
import type { TrackPublication } from "livekit-client";

type MediaTileProps = {
  publication: TrackPublication;
  label: string;
  large?: boolean;
  muteElement?: boolean;
};

export function MediaTile({ publication, label, large, muteElement }: MediaTileProps) {
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
        large
          ? "surface-raised relative overflow-hidden rounded-[1.5rem]"
          : "surface relative aspect-video overflow-hidden rounded-[1.25rem]"
      }
    >
      <video
        ref={ref}
        className="h-full w-full object-contain bg-black"
        autoPlay
        playsInline
        muted={muteElement}
      />
      <figcaption className="glass-bar absolute bottom-3 left-3 rounded-lg px-3 py-1.5 text-xs text-cloud">
        {label}
      </figcaption>
    </figure>
  );
}
