import { Mic, MicOff } from "lucide-react";
import type { ParticipantView } from "../../hooks/useParticipants.ts";
import { cn, initials } from "../../lib/utils.ts";
import { Icon } from "../ui/icon.tsx";

type ParticipantListProps = {
  participants: ParticipantView[];
};

export function ParticipantList({ participants }: ParticipantListProps) {
  return (
    <ul className="space-y-0.5">
      {participants.map((participant) => (
        <li
          key={participant.identity}
          className={cn(
            "flex min-h-10 items-center gap-3 rounded-xl px-2 py-1.5 text-cloud transition duration-150 ease-out hover:bg-white/[0.04]",
            participant.isSpeaking && "bg-signal/5",
          )}
        >
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-deck text-[10px] font-semibold text-cloud transition",
              participant.isSpeaking &&
                "ring-2 ring-signal shadow-[0_0_10px_rgba(34,197,94,0.45)]",
            )}
          >
            {participant.avatarUrl ? (
              <img
                src={participant.avatarUrl}
                alt=""
                className="size-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              initials(participant.name)
            )}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm">
            {participant.name}
            {participant.isLocal ? " (você)" : ""}
          </span>
          {participant.micOn ? (
            <Icon icon={Mic} size="sm" className="text-haze" />
          ) : (
            <Icon icon={MicOff} size="sm" className="text-coral" />
          )}
        </li>
      ))}
    </ul>
  );
}
