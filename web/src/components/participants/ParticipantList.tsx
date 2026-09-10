import { Mic, MicOff, UserPlus } from "lucide-react";
import type { CallFriendRelation } from "../../friends/callFriend.ts";
import type { ParticipantView } from "../../hooks/useParticipants.ts";
import { cn, initials } from "../../lib/utils.ts";
import { voiceMicIconClass, voiceMicOpen, voiceNameClass } from "../../voice/voiceChrome.ts";
import { Button, IconButton } from "../ui/button.tsx";
import { Icon } from "../ui/icon.tsx";
import { Tooltip } from "../ui/tooltip.tsx";
import { useProfilePeek } from "../../profile/ProfilePeek.tsx";

type ParticipantListProps = {
  participants: ParticipantView[];
  relationFor?: (identity: string, isLocal: boolean) => CallFriendRelation;
  addingId?: string | null;
  onAddFriend?: (identity: string, name: string) => void;
  onAcceptFriend?: (friendshipId: string) => void;
};

function ParticipantName({ participant }: { participant: ParticipantView }) {
  const peek = useProfilePeek();
  const nameClass = voiceNameClass(participant.micOn, participant.voiceActivityOn);
  return (
    <button
      type="button"
      className={cn(
        "min-w-0 flex-1 truncate text-left text-sm transition duration-150 ease-out hover:text-white",
        nameClass,
      )}
      aria-label={`Ver perfil de ${participant.name}`}
      onClick={() => peek.openUser(participant.identity)}
    >
      {participant.name}
    </button>
  );
}

function ParticipantFriendAction({
  relation,
  adding,
  name,
  onAddFriend,
  onAcceptFriend,
  identity,
}: {
  relation: CallFriendRelation;
  adding: boolean;
  name: string;
  identity: string;
  onAddFriend?: (identity: string, name: string) => void;
  onAcceptFriend?: (friendshipId: string) => void;
}) {
  if (relation.kind === "outgoing") {
    return <span className="shrink-0 text-[11px] font-medium text-haze">Pedido enviado</span>;
  }
  if (relation.kind === "incoming" && onAcceptFriend) {
    return (
      <Button
        type="button"
        variant="primary"
        size="sm"
        className="h-8 min-h-8 px-2.5 text-xs"
        onClick={() => onAcceptFriend(relation.friendshipId)}
      >
        Aceitar
      </Button>
    );
  }
  if (relation.kind === "none" && onAddFriend) {
    return (
      <Tooltip label={`Adicionar ${name} como amigo`}>
        <IconButton
          type="button"
          size="iconSm"
          variant="secondary"
          className="size-8 min-h-8 min-w-8 shrink-0"
          disabled={adding}
          aria-label={`Adicionar ${name} como amigo`}
          onClick={() => onAddFriend(identity, name)}
        >
          <Icon icon={UserPlus} size="action" />
        </IconButton>
      </Tooltip>
    );
  }
  return null;
}

export function ParticipantList({
  participants,
  relationFor,
  addingId = null,
  onAddFriend,
  onAcceptFriend,
}: ParticipantListProps) {
  const peek = useProfilePeek();
  return (
    <ul className="space-y-0.5">
      {participants.map((participant) => {
        const relation = relationFor?.(participant.identity, participant.isLocal) ?? {
          kind: participant.isLocal ? "self" : "none",
        };
        const adding = addingId === participant.identity;
        return (
          <li
            key={participant.identity}
            className={cn(
              "flex min-h-10 items-center gap-3 rounded-xl px-2 py-1.5 text-cloud transition duration-150 ease-out hover:bg-white/[0.04]",
              participant.isSpeaking && "bg-signal/5",
            )}
          >
            <button
              type="button"
              className={cn(
                "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-deck text-[10px] font-semibold text-cloud transition",
                participant.isSpeaking &&
                  "ring-2 ring-signal shadow-[0_0_10px_rgba(34,197,94,0.45)]",
              )}
              aria-label={`Ver perfil de ${participant.name}`}
              onClick={() => peek.openUser(participant.identity)}
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
            </button>
            <ParticipantName participant={participant} />
            <ParticipantFriendAction
              relation={relation}
              adding={adding}
              name={participant.name}
              identity={participant.identity}
              onAddFriend={onAddFriend}
              onAcceptFriend={onAcceptFriend}
            />
            {voiceMicOpen(participant.micOn, participant.voiceActivityOn, participant.isSpeaking) ? (
              <Icon
                icon={Mic}
                size="sm"
                className={voiceMicIconClass(participant.micOn, participant.voiceActivityOn)}
              />
            ) : (
              <Icon
                icon={MicOff}
                size="sm"
                className={voiceMicIconClass(participant.micOn, participant.voiceActivityOn)}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
