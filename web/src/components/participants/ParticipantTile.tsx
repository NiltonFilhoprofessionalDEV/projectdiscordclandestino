import { useEffect, useState, type ReactNode } from "react";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import type { ParticipantView } from "../../hooks/useParticipants.ts";
import { useProfilePeek } from "../../profile/ProfilePeek.tsx";
import { cn, initials } from "../../lib/utils.ts";
import {
  getParticipantAudioOutput,
  setParticipantAudioOutput,
} from "../../services/livekit.ts";
import { voiceMicIconClass, voiceMicOpen, voiceNameClass } from "../../voice/voiceChrome.ts";
import { IconButton } from "../ui/button.tsx";
import { HoverVolumePopover } from "../ui/HoverVolumePopover.tsx";
import { Icon } from "../ui/icon.tsx";
import { MediaTile } from "./MediaTile.tsx";

type ParticipantTileProps = {
  participant: ParticipantView;
  compact?: boolean;
};

function tileChrome(speaking: boolean) {
  return speaking
    ? "border border-signal/80 bg-[#0f1f14] shadow-[0_0_28px_rgba(34,197,94,0.28)]"
    : "border border-white/[0.07] bg-[#12131D] shadow-[0_10px_28px_rgba(0,0,0,0.32)]";
}

function TileFrame({
  speaking,
  className,
  contentClassName,
  children,
  corner,
}: {
  speaking: boolean;
  className: string;
  contentClassName?: string;
  children: ReactNode;
  corner?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "group/tile relative flex transition-[border-color,box-shadow,background-color] duration-200",
        tileChrome(speaking),
        className,
      )}
    >
      <div
        className={cn(
          "relative z-10 flex h-full min-h-0 min-w-0 flex-1 flex-col items-center",
          contentClassName,
        )}
      >
        {children}
      </div>
      {corner}
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
        compact ? "size-11" : "size-[5.5rem] sm:size-28",
      )}
    >
      {speaking ? (
        <span
          className="speak-halo pointer-events-none absolute inset-[-8px] rounded-full"
          aria-hidden
        />
      ) : null}
      <span
        className={cn(
          "relative z-10 flex size-full items-center justify-center overflow-hidden rounded-full bg-[#151622] font-semibold text-cloud ring-2",
          compact ? "text-xs" : "text-xl sm:text-2xl",
          speaking ? "ring-signal" : "ring-white/[0.08]",
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

function MicStatusIcon({
  micOn,
  voiceActivityOn,
  speaking,
  className,
}: {
  micOn: boolean;
  voiceActivityOn: boolean;
  speaking: boolean;
  className?: string;
}) {
  const open = voiceMicOpen(micOn, voiceActivityOn, speaking);
  return (
    <Icon
      icon={open ? Mic : MicOff}
      size="sm"
      className={cn(className, voiceMicIconClass(micOn, voiceActivityOn))}
    />
  );
}

/** Canto inferior esquerdo — não mexe no alinhamento central de avatar/nick. */
function ParticipantVolumeControls({ identity, isLocal }: { identity: string; isLocal: boolean }) {
  const initial = getParticipantAudioOutput(identity);
  const [volume, setVolume] = useState(initial.volume);
  const [muted, setMuted] = useState(initial.muted);
  const [open, setOpen] = useState(false);

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
    <HoverVolumePopover
      open={open}
      onOpenChange={setOpen}
      align="start"
      className="absolute bottom-2.5 left-2.5 z-20"
      panel={
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(volume * 100)}
          onChange={(event) => setVolume(Number(event.target.value) / 100)}
          aria-label="Volume do usuário"
          className="voice-slider-vertical"
        />
      }
    >
      <IconButton
        type="button"
        size="iconSm"
        variant="ghost"
        className="size-8 min-h-8 min-w-8 rounded-lg bg-abyss/50 text-haze hover:text-cloud"
        aria-label={muted ? "Ativar áudio do usuário" : "Mutar usuário"}
        title={muted ? "Ativar áudio" : "Volume do usuário"}
        onClick={() => setMuted((current) => !current)}
      >
        <Icon icon={muted ? VolumeX : Volume2} size="sm" />
      </IconButton>
    </HoverVolumePopover>
  );
}

function NameRow({
  participant,
  onOpen,
  className,
}: {
  participant: ParticipantView;
  onOpen: () => void;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex min-w-0 max-w-full cursor-pointer items-center justify-center gap-2 px-1 text-sm font-medium",
        voiceNameClass(participant.micOn, participant.voiceActivityOn),
        className,
      )}
      onClick={onOpen}
    >
      <span className="min-w-0 truncate text-center">{participant.name}</span>
      <MicStatusIcon
        micOn={participant.micOn}
        voiceActivityOn={participant.voiceActivityOn}
        speaking={participant.isSpeaking}
        className="shrink-0"
      />
    </p>
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
        className="w-[7.75rem] min-w-0 shrink-0 overflow-visible rounded-2xl px-2 py-2.5 text-center"
        contentClassName="min-w-0 w-full"
      >
        {participant.cameraPublication ? (
          <div
            className={cn(
              "w-full min-w-0 overflow-hidden rounded-xl ring-2 transition",
              participant.isSpeaking ? "ring-signal" : "ring-transparent",
            )}
          >
            <MediaTile
              publication={participant.cameraPublication}
              label={participant.name}
              muteElement={participant.isLocal}
              compact
            />
          </div>
        ) : (
          <button
            type="button"
            className="p-1"
            aria-label={`Ver perfil de ${participant.name}`}
            onClick={openProfile}
          >
            <AvatarFace
              name={participant.name}
              avatarUrl={participant.avatarUrl}
              speaking={participant.isSpeaking}
              compact
            />
          </button>
        )}
        <NameRow
          participant={participant}
          onOpen={openProfile}
          className="mt-1.5 gap-1 text-[11px]"
        />
      </TileFrame>
    );
  }

  if (participant.cameraPublication) {
    return (
      <TileFrame
        speaking={participant.isSpeaking}
        className="overflow-visible rounded-2xl p-3 pb-11"
        contentClassName="min-w-0 w-full gap-2.5"
        corner={
          <ParticipantVolumeControls identity={participant.identity} isLocal={participant.isLocal} />
        }
      >
        <div
          className={cn(
            "w-full overflow-hidden rounded-[14px] ring-2 transition",
            participant.isSpeaking ? "ring-signal" : "ring-transparent",
          )}
        >
          <MediaTile
            publication={participant.cameraPublication}
            label={participant.name}
            muteElement={participant.isLocal}
          />
        </div>
        <NameRow participant={participant} onOpen={openProfile} className="justify-start px-0.5" />
      </TileFrame>
    );
  }

  return (
    <TileFrame
      speaking={participant.isSpeaking}
      className="min-h-48 overflow-visible rounded-2xl px-5 pb-11 pt-7 text-center sm:min-h-56 sm:px-6 sm:pt-8"
      contentClassName="min-w-0 w-full justify-center gap-4"
      corner={
        <ParticipantVolumeControls identity={participant.identity} isLocal={participant.isLocal} />
      }
    >
      <button
        type="button"
        className="relative mx-auto inline-flex p-2"
        aria-label={`Ver perfil de ${participant.name}`}
        onClick={openProfile}
      >
        <AvatarFace
          name={participant.name}
          avatarUrl={participant.avatarUrl}
          speaking={participant.isSpeaking}
        />
      </button>
      <NameRow participant={participant} onOpen={openProfile} />
    </TileFrame>
  );
}
