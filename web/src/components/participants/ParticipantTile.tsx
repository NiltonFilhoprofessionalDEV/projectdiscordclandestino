import { useEffect, useState } from "react";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import type { ParticipantView } from "../../hooks/useParticipants.ts";
import { cn, initials } from "../../lib/utils.ts";
import {
  getParticipantAudioOutput,
  setParticipantAudioOutput,
} from "../../services/livekit.ts";
import { MediaTile } from "./MediaTile.tsx";

type ParticipantTileProps = {
  participant: ParticipantView;
};

function AvatarFace({
  name,
  avatarUrl,
  speaking,
}: {
  name: string;
  avatarUrl: string | null;
  speaking: boolean;
}) {
  return (
    <span
      className={cn(
        "flex size-28 items-center justify-center overflow-hidden rounded-full bg-deck text-2xl font-semibold text-cloud ring-4 transition",
        speaking ? "ring-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.45)]" : "ring-haze/20",
      )}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="size-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}

function ParticipantVolumeControls({ identity, isLocal }: { identity: string; isLocal: boolean }) {
  const initial = getParticipantAudioOutput(identity);
  const [volume, setVolume] = useState(initial.volume);
  const [muted, setMuted] = useState(initial.muted);

  useEffect(() => {
    if (isLocal) {
      return;
    }
    setParticipantAudioOutput(identity, volume, muted);
  }, [identity, isLocal, muted, volume]);

  if (isLocal) {
    return null;
  }

  return (
    <div className="mt-3 flex w-full max-w-[11rem] items-center gap-2">
      <button
        type="button"
        className="rounded-md p-1 text-haze hover:text-cloud"
        aria-label={muted ? "Ativar áudio do usuário" : "Mutar usuário"}
        onClick={() => setMuted((current) => !current)}
      >
        {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
      </button>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(volume * 100)}
        onChange={(event) => setVolume(Number(event.target.value) / 100)}
        aria-label="Volume do usuário"
        className="w-full accent-electric"
      />
    </div>
  );
}

export function ParticipantTile({ participant }: ParticipantTileProps) {
  if (participant.cameraPublication) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div
          className={cn(
            "w-full overflow-hidden rounded-[1.25rem] ring-2",
            participant.isSpeaking ? "ring-emerald-400" : "ring-transparent",
          )}
        >
          <MediaTile
            publication={participant.cameraPublication}
            label={`${participant.name}${participant.isLocal ? " (você)" : ""}`}
            muteElement={participant.isLocal}
          />
        </div>
        <ParticipantVolumeControls identity={participant.identity} isLocal={participant.isLocal} />
      </div>
    );
  }

  return (
    <div className="surface-raised flex min-h-56 flex-col items-center justify-center rounded-[1.35rem] px-4 py-6 text-center">
      <AvatarFace
        name={participant.name}
        avatarUrl={participant.avatarUrl}
        speaking={participant.isSpeaking}
      />
      <p className="mt-4 flex items-center gap-2 text-sm font-medium text-cloud">
        {participant.name}
        {participant.isLocal ? " (você)" : ""}
        {participant.micOn ? (
          <Mic className="size-3.5 text-haze" />
        ) : (
          <MicOff className="size-3.5 text-coral" />
        )}
      </p>
      <ParticipantVolumeControls identity={participant.identity} isLocal={participant.isLocal} />
    </div>
  );
}
