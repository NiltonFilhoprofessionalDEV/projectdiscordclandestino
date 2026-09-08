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
          className="glass-soft flex min-h-11 items-center gap-3 rounded-2xl px-3 text-fog"
        >
          <span
            className={cn(
              "size-2.5 rounded-full",
              participant.isSpeaking
                ? "bg-copper shadow-[0_0_12px_var(--color-copper)]"
                : "bg-led",
            )}
            aria-hidden
          />
          <span className="flex-1 truncate">
            {participant.name}
            {participant.isLocal ? " (você)" : ""}
          </span>
          {participant.micOn ? (
            <Mic className="size-4 text-mist" />
          ) : (
            <MicOff className="size-4 text-rose-300" />
          )}
        </li>
      ))}
    </ul>
  );
}
