import { MonitorUp } from "lucide-react";
import type { ParticipantView } from "../../hooks/useParticipants.ts";
import { useScreenVideo } from "../../hooks/useScreenVideo.ts";
import { Icon } from "../ui/icon.tsx";

type ScreenShareThumbProps = {
  screen: ParticipantView;
  onSelect: () => void;
};

export function ScreenShareThumb({ screen, onSelect }: ScreenShareThumbProps) {
  const videoRef = useScreenVideo(screen.screenPublication!);
  const label = screen.isLocal ? "Sua tela" : screen.name;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Assistir transmissão de ${label}`}
      title={`Assistir transmissão de ${label}`}
      className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-2xl border border-white/[0.07] bg-black transition hover:border-white/25 focus-visible:ring-2 focus-visible:ring-signal/70 focus-visible:outline-none"
    >
      <video
        ref={videoRef}
        className="pointer-events-none h-full w-full object-contain"
        autoPlay
        playsInline
        muted
      />
      <span className="pointer-events-none absolute inset-x-1.5 bottom-1.5 flex min-w-0 items-center gap-1 rounded-md bg-abyss/80 px-1.5 py-0.5 text-[11px] font-medium text-cloud backdrop-blur-sm">
        <Icon icon={MonitorUp} size="sm" className="shrink-0" />
        <span className="min-w-0 truncate">{label}</span>
      </span>
    </button>
  );
}
