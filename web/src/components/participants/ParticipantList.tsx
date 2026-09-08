import { Mic, MicOff } from "lucide-react";
import type { ParticipantView } from "../../hooks/useParticipants.ts";
import { cn } from "../../lib/utils.ts";

type ParticipantListProps = {
  participants: ParticipantView[];
};

export function ParticipantList({ participants }: ParticipantListProps) {
  return (
    <ul className="space-y-1">
      {participants.map((participant) => (
        <li
          key={participant.identity}
          className={cn(
            "flex min-h-11 items-center gap-3 rounded-xl bg-abyss/55 px-3 text-cloud ring-1 ring-haze/8",
            participant.isSpeaking && "ring-coral/55",
          )}
        >
          <span
            className={cn(
              "size-2.5 rounded-full",
              participant.isSpeaking
                ? "bg-coral shadow-[0_0_12px_rgba(255,93,115,0.7)]"
                : "bg-electric",
            )}
            aria-hidden
          />
          <span className="flex-1 truncate">
            {participant.name}
            {participant.isLocal ? " (você)" : ""}
          </span>
          {participant.micOn ? (
            <Mic className="size-4 text-haze" />
          ) : (
            <MicOff className="size-4 text-coral" />
          )}
        </li>
      ))}
    </ul>
  );
}
