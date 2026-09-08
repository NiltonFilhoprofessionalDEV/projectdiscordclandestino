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
    return () => {
      track.detach(el);
    };
  }, [publication, publication.track]);

  return (
    <figure
      className={
        large
          ? "relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-void shadow-glow"
          : "relative aspect-video overflow-hidden rounded-[1.25rem] border border-white/10 bg-void"
      }
    >
      <video
        ref={ref}
        className="h-full w-full object-contain bg-black"
        autoPlay
        playsInline
        muted={muteElement}
      />
      <figcaption className="absolute bottom-2 left-2 rounded-full bg-black/55 px-3 py-1 text-xs text-fog">
        {label}
      </figcaption>
    </figure>
  );
}
