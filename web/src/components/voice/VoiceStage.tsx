import { ConnectionState } from "livekit-client";
import { Headphones } from "lucide-react";
import type { ParticipantView } from "../../hooks/useParticipants.ts";
import { MediaTile } from "../participants/MediaTile.tsx";
import { ParticipantList } from "../participants/ParticipantList.tsx";
import { VideoGrid } from "../participants/VideoGrid.tsx";

type VoiceStageProps = {
  error: string | null;
  connectionState: ConnectionState;
  participants: ParticipantView[];
  screen: ParticipantView | null | undefined;
};

export function VoiceStage({ error, connectionState, participants, screen }: VoiceStageProps) {
  const hasCamera = participants.some((participant) => participant.cameraPublication);

  return (
    <>
      {error ? <p className="mb-3 text-sm text-coral">{error}</p> : null}
      {connectionState === ConnectionState.Connected && participants.length === 0 ? (
        <p className="text-haze">Ninguém mais por aqui ainda.</p>
      ) : null}
      {screen?.screenPublication ? (
        <div className="mb-4">
          <p className="mb-2 text-sm text-electric">{screen.name} está compartilhando a tela</p>
          <MediaTile
            publication={screen.screenPublication}
            label={screen.name}
            large
            muteElement={screen.isLocal}
          />
        </div>
      ) : null}
      {connectionState === ConnectionState.Connected && !hasCamera ? (
        <div className="surface-raised flex min-h-72 flex-col items-center justify-center rounded-[1.5rem] px-6 text-center">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-electric/14 text-electric ring-1 ring-electric/25">
            <Headphones className="size-7" />
          </span>
          <h2 className="mt-5 font-display text-2xl text-cloud">A conversa está acontecendo</h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-haze">
            Ligue a câmera quando quiser. Sua voz já está conectada ao canal.
          </p>
        </div>
      ) : null}
      <VideoGrid participants={participants} />
      <div className="mt-6 xl:hidden">
        <h2 className="mb-2 text-xs font-semibold tracking-wide text-haze uppercase">Participantes</h2>
        <ParticipantList participants={participants} />
      </div>
    </>
  );
}
