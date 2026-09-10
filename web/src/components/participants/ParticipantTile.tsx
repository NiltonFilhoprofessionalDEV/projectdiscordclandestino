import { useEffect, useState, type ReactNode } from "react";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import type { ParticipantView } from "../../hooks/useParticipants.ts";
import { useProfilePeek } from "../../profile/ProfilePeek.tsx";
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

function SpeakEcho({ round }: { round?: boolean }) {
  const shape = round ? "rounded-full" : "rounded-[inherit]";
  return (
    <>
      <span className={cn("speak-ripple pointer-events-none absolute inset-0", shape)} aria-hidden />
      <span
        className={cn("speak-ripple speak-ripple-delay pointer-events-none absolute inset-0", shape)}
        aria-hidden
      />
    </>
  );
}

function TileFrame({
  speaking,
  className,
  contentClassName,
  children,
}: {
  speaking: boolean;
  className: string;
  contentClassName?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative flex border border-white/[0.06] bg-[#12131D] shadow-[0_8px_24px_rgba(0,0,0,0.28)]",
        speaking && "speak-glow",
        className,
      )}
    >
      {speaking ? <SpeakEcho /> : null}
      <div className={cn("relative z-10 flex h-full min-h-0 flex-1 flex-col items-center", contentClassName)}>
        {children}
      </div>
    </div>
  );
}

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
        "relative inline-flex items-center justify-center",
        compact ? "size-11" : "size-20 sm:size-28",
      )}
    >
      {speaking ? <SpeakEcho round /> : null}
      <span
        className={cn(
          "relative z-10 flex size-full items-center justify-center overflow-hidden rounded-full bg-[#151622] font-semibold text-cloud",
          compact ? "text-xs" : "text-xl sm:text-2xl",
          speaking ? "ring-0" : "ring-2 ring-white/[0.08]",
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
  const peek = useProfilePeek();
  function openProfile() {
    peek.openUser(participant.identity);
  }
  if (compact) {
    return (
      <TileFrame
        speaking={participant.isSpeaking}
        className="w-[7.5rem] shrink-0 rounded-2xl px-2 py-2 text-center"
      >
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
          <button type="button" aria-label={`Ver perfil de ${participant.name}`} onClick={openProfile}>
            <AvatarFace
              name={participant.name}
              avatarUrl={participant.avatarUrl}
              speaking={participant.isSpeaking}
              compact
            />
          </button>
        )}
        <p
          className={cn(
            "mt-1.5 flex w-full cursor-pointer items-center justify-center gap-1 truncate text-[11px] font-medium",
            participant.micOn ? "text-cloud" : "text-[#f9a8d4]",
          )}
          onClick={openProfile}
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
      </TileFrame>
    );
  }

  if (participant.cameraPublication) {
    return (
      <TileFrame
        speaking={participant.isSpeaking}
        className="rounded-[18px] p-3"
        contentClassName="gap-2"
      >
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
            "flex cursor-pointer items-center gap-2 text-sm font-medium",
            participant.micOn ? "text-cloud" : "text-[#f9a8d4]",
          )}
          onClick={openProfile}
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
      </TileFrame>
    );
  }

  return (
    <TileFrame
      speaking={participant.isSpeaking}
      className="min-h-44 rounded-[18px] px-4 py-5 text-center sm:min-h-56 sm:py-6"
      contentClassName="justify-center"
    >
      <button type="button" aria-label={`Ver perfil de ${participant.name}`} onClick={openProfile}>
        <AvatarFace
          name={participant.name}
          avatarUrl={participant.avatarUrl}
          speaking={participant.isSpeaking}
        />
      </button>
      <p
        className={cn(
          "mt-4 flex cursor-pointer items-center gap-2 text-sm font-medium",
          participant.micOn ? "text-cloud" : "text-[#f9a8d4]",
        )}
        onClick={openProfile}
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
    </TileFrame>
  );
}
