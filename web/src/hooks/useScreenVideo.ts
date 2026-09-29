import { useEffect, useRef } from "react";
import type { TrackPublication } from "livekit-client";

/**
 * Anexa o vídeo da transmissão a um <video> sempre mudo — o áudio da transmissão
 * toca pelos elementos controlados em livekit.ts (audioKind=screen).
 */
export function useScreenVideo(publication: TrackPublication) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    const track = publication.track;
    if (!el || !track) {
      return;
    }
    track.attach(el);
    el.muted = true;
    el.playsInline = true;
    el.autoplay = true;
    void el.play().catch(() => undefined);
    return () => {
      track.detach(el);
    };
  }, [publication, publication.track]);

  return videoRef;
}
