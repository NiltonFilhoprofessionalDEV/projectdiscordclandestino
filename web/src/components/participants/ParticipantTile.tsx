import { useEffect, useState } from "react";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import type { ParticipantView } from "../../hooks/useParticipants.ts";
import { cn, initials } from "../../lib/utils.ts";
import {
  getParticipantAudioOutput,
  setParticipantAudioOutput,
} from "../../services/livekit.ts";
import { IconButton } from "../ui/button.tsx";
import { Icon } from "../ui/icon.tsx";
import { Tooltip } from "../ui/tooltip.tsx";
import { MediaTile } from "./MediaTile.tsx";

type ParticipantTileProps = {
  participant: ParticipantView;
  compact?: boolean;
};

function AvatarFace({
  name,
  avatarUrl,
  speaking,
  compact = false,
}: {
  name: string;
  avatarUrl: string | null;
  speaking: boolean;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-full bg-[#151622] font-semibold text-cloud transition duration-200",
        compact ? "size-11 text-xs ring-2" : "size-20 text-xl ring-4 sm:size-28 sm:text-2xl",
        speaking
          ? "speak-ring ring-signal shadow-[0_0_24px_rgba(34,197,94,0.45)]"
          : "ring-white/[0.08]",
      )}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="size-full object-cover"
          onError={(event) => {
            event.currentTarget.remove();
          }}
        />
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
    <div className="mt-3 flex w-full max-w-[10rem] items-center gap-1.5">
      <Tooltip label={muted ? "Ativar áudio" : "Mutar usuário"}>
        <IconButton
          type="button"
          size="iconSm"
          variant="ghost"
          className="size-8 min-h-8 min-w-8"
          aria-label={muted ? "Ativar áudio do usuário" : "Mutar usuário"}
          onClick={() => setMuted((current) => !current)}
        >
          <Icon icon={muted ? VolumeX : Volume2} size="sm" />
        </IconButton>
      </Tooltip>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(volume * 100)}
        onChange={(event) => setVolume(Number(event.target.value) / 100)}
        aria-label="Volume do usuário"
        className="voice-slider w-full"
      />
    </div>
  );
}

export function ParticipantTile({ participant, compact = false }: ParticipantTileProps) {
  if (compact) {
    return (
      <div className="flex w-[7.5rem] shrink-0 flex-col items-center rounded-2xl border border-white/[0.06] bg-[#12131D] px-2 py-2 text-center">
        {participant.cameraPublication ? (
          <div
            className={cn(
              "w-full overflow-hidden rounded-xl ring-2 transition",
              participant.isSpeaking ? "ring-signal" : "ring-transparent",
            )}
          >
            <MediaTile
              publication={participant.cameraPublication}
              label={`${participant.name}${participant.isLocal ? " (você)" : ""}`}
              muteElement={participant.isLocal}
              compact
            />
          </div>
        ) : (
          <AvatarFace
            name={participant.name}
            avatarUrl={participant.avatarUrl}
            speaking={participant.isSpeaking}
            compact
          />
        )}
        <p
          className={cn(
            "mt-1.5 flex w-full items-center justify-center gap-1 truncate text-[11px] font-medium",
            participant.micOn ? "text-cloud" : "text-[#f9a8d4]",
          )}
        >
          <span className="truncate">
            {participant.name}
            {participant.isLocal ? " (você)" : ""}
          </span>
          {participant.micOn ? (
            <Icon icon={Mic} size="sm" className="size-3 shrink-0 text-haze" />
          ) : (
            <Icon icon={MicOff} size="sm" className="size-3 shrink-0 text-coral" />
          )}
        </p>
      </div>
    );
  }

  if (participant.cameraPublication) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-[18px] border border-white/[0.06] bg-[#12131D] p-3 shadow-[0_8px_24px_rgba(0,0,0,0.28)]">
        <div
          className={cn(
            "w-full overflow-hidden rounded-[14px] ring-2 transition",
            participant.isSpeaking ? "ring-signal" : "ring-transparent",
          )}
        >
          <MediaTile
            publication={participant.cameraPublication}
            label={`${participant.name}${participant.isLocal ? " (você)" : ""}`}
            muteElement={participant.isLocal}
          />
        </div>
        <p
          className={cn(
            "flex items-center gap-2 text-sm font-medium",
            participant.micOn ? "text-cloud" : "text-[#f9a8d4]",
          )}
        >
          {participant.name}
          {participant.isLocal ? " (você)" : ""}
          {participant.micOn ? (
            <Icon icon={Mic} size="sm" className="text-haze" />
          ) : (
            <Icon icon={MicOff} size="sm" className="text-coral" />
          )}
        </p>
        <ParticipantVolumeControls identity={participant.identity} isLocal={participant.isLocal} />
      </div>
    );
  }

  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-[18px] border border-white/[0.06] bg-[#12131D] px-4 py-5 text-center shadow-[0_8px_24px_rgba(0,0,0,0.28)] sm:min-h-56 sm:py-6">
      <AvatarFace
        name={participant.name}
        avatarUrl={participant.avatarUrl}
        speaking={participant.isSpeaking}
      />
      <p
        className={cn(
          "mt-4 flex items-center gap-2 text-sm font-medium",
          participant.micOn ? "text-cloud" : "text-[#f9a8d4]",
        )}
      >
        {participant.name}
        {participant.isLocal ? " (você)" : ""}
        {participant.micOn ? (
          <Icon icon={Mic} size="sm" className="text-haze" />
        ) : (
          <Icon icon={MicOff} size="sm" className="text-coral" />
        )}
      </p>
      <ParticipantVolumeControls identity={participant.identity} isLocal={participant.isLocal} />
    </div>
  );
}
