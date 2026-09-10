import { Mic, MicOff, UserPlus } from "lucide-react";
import type { CallFriendRelation } from "../../friends/callFriend.ts";
import type { ParticipantView } from "../../hooks/useParticipants.ts";
import { cn, initials } from "../../lib/utils.ts";
import { Button, IconButton } from "../ui/button.tsx";
import { Icon } from "../ui/icon.tsx";
import { Tooltip } from "../ui/tooltip.tsx";

type ParticipantListProps = {
  participants: ParticipantView[];
  relationFor?: (identity: string, isLocal: boolean) => CallFriendRelation;
  addingId?: string | null;
  onAddFriend?: (identity: string, name: string) => void;
  onAcceptFriend?: (friendshipId: string) => void;
};

function ParticipantName({
  participant,
  relation,
  adding,
  onAddFriend,
}: {
  participant: ParticipantView;
  relation: CallFriendRelation;
  adding: boolean;
  onAddFriend?: (identity: string, name: string) => void;
}) {
  const suffix = participant.isLocal ? " (você)" : "";
  const label = `${participant.name}${suffix}`;
  if (relation.kind === "none" && onAddFriend) {
    return (
      <button
        type="button"
        className="min-w-0 flex-1 truncate text-left text-sm text-cloud transition duration-150 ease-out hover:text-white"
        disabled={adding}
        aria-label={`Adicionar ${participant.name} como amigo`}
        onClick={() => onAddFriend(participant.identity, participant.name)}
      >
        {label}
      </button>
    );
  }
  return <span className="min-w-0 flex-1 truncate text-sm">{label}</span>;
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
          variant="ghost"
          className="size-8 min-h-8 min-w-8 shrink-0"
          disabled={adding}
          tabIndex={-1}
          aria-hidden
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
            <ParticipantName
              participant={participant}
              relation={relation}
              adding={adding}
              onAddFriend={onAddFriend}
            />
            <ParticipantFriendAction
              relation={relation}
              adding={adding}
              name={participant.name}
              identity={participant.identity}
              onAddFriend={onAddFriend}
              onAcceptFriend={onAcceptFriend}
            />
            {participant.micOn ? (
              <Icon icon={Mic} size="sm" className="text-haze" />
            ) : (
              <Icon icon={MicOff} size="sm" className="text-coral" />
            )}
          </li>
        );
      })}
    </ul>
  );
}
