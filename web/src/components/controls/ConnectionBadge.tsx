import { ConnectionQuality, ConnectionState } from "livekit-client";
import { cn } from "../../lib/utils.ts";

type ConnectionBadgeProps = {
  state: ConnectionState;
  quality: ConnectionQuality;
  rttMs: number | null;
};

function qualityCopy(quality: ConnectionQuality): { label: string; className: string } {
  if (quality === ConnectionQuality.Excellent || quality === ConnectionQuality.Good) {
    return { label: "Excelente conexão", className: "text-signal" };
  }
  if (quality === ConnectionQuality.Poor) {
    return { label: "Conexão instável", className: "text-amber-300" };
  }
  return { label: "Conexão ruim", className: "text-coral" };
}

function Dot({ className }: { className: string }) {
  return <span className={cn("size-1.5 shrink-0 rounded-full", className)} aria-hidden />;
}

export function ConnectionBadge({ state, quality, rttMs }: ConnectionBadgeProps) {
  if (state === ConnectionState.Connecting) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-haze">
        <Dot className="bg-haze animate-pulse" />
        Conectando…
      </p>
    );
  }
  if (state === ConnectionState.Reconnecting) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-amber-300">
        <Dot className="bg-amber-300" />
        Reconectando…
      </p>
    );
  }
  if (state !== ConnectionState.Connected) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-coral">
        <Dot className="bg-coral" />
        Desconectado
      </p>
    );
  }

  const copy = qualityCopy(quality);
  return (
    <p className={cn("flex items-center gap-1.5 text-xs", copy.className)}>
      <Dot className="bg-signal" />
      <span>
        <span className="sm:hidden">Conectado</span>
        <span className="hidden sm:inline">
          Conectado · {copy.label}
          {rttMs !== null ? ` · ${rttMs} ms` : ""}
        </span>
      </span>
    </p>
  );
}
