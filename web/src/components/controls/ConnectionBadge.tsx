import { ConnectionQuality, ConnectionState } from "livekit-client";

type ConnectionBadgeProps = {
  state: ConnectionState;
  quality: ConnectionQuality;
  rttMs: number | null;
};

function qualityCopy(quality: ConnectionQuality): { label: string; className: string } {
  if (quality === ConnectionQuality.Excellent || quality === ConnectionQuality.Good) {
    return { label: "Excelente conexão", className: "text-[#aab9ff]" };
  }
  if (quality === ConnectionQuality.Poor) {
    return { label: "Conexão instável", className: "text-amber-300" };
  }
  return { label: "Conexão ruim", className: "text-coral" };
}

export function ConnectionBadge({ state, quality, rttMs }: ConnectionBadgeProps) {
  if (state === ConnectionState.Connecting) {
    return <p className="text-xs text-haze">Conectando…</p>;
  }
  if (state === ConnectionState.Reconnecting) {
    return <p className="text-xs text-amber-300">Reconectando…</p>;
  }
  if (state !== ConnectionState.Connected) {
    return <p className="text-xs text-coral">Desconectado</p>;
  }

  const copy = qualityCopy(quality);
  return (
    <p className={`text-xs ${copy.className}`}>
      Conectado · {copy.label}
      {rttMs !== null ? ` · ${rttMs} ms` : ""}
    </p>
  );
}
