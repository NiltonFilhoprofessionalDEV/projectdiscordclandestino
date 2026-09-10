import { useState, type FormEvent } from "react";
import { Check, UserPlus } from "lucide-react";
import type { CommunityId } from "../../../../shared/community.ts";
import { cn, initials } from "../../lib/utils.ts";
import type { FriendEntry } from "../../hooks/useFriends.ts";
import { Button, IconButton } from "../ui/button.tsx";
import { Icon } from "../ui/icon.tsx";
import { Input } from "../ui/input.tsx";
import { Tooltip } from "../ui/tooltip.tsx";

type FriendsPanelProps = {
  friends: {
    friends: FriendEntry[];
    incoming: FriendEntry[];
    status: string;
    error: string | null;
    requestByEmail: (email: string) => Promise<string | null>;
    requestByUserId?: (userId: string) => Promise<string | null>;
    accept: (id: string) => Promise<void>;
    inviteToCommunity: (friendUserId: string, communityId: string) => Promise<string | null>;
    retry: () => Promise<void>;
  };
  communityId: CommunityId | null;
  communityName: string | null;
  canInviteToCommunity: boolean;
  memberUserIds: Set<string>;
  onInvited?: () => void;
};

function presenceLabel(entry: FriendEntry): string {
  if (entry.presence === "in_voice") {
    return entry.activity?.trim() || "Em chamada";
  }
  if (entry.presence === "online") {
    return "Online";
  }
  return "Offline";
}

type InviteAction = {
  label: string;
  disabled?: boolean;
  alreadyMember?: boolean;
  pending?: boolean;
  title?: string;
  onClick: () => void;
};

function FriendInviteControl({ invite }: { invite: InviteAction }) {
  if (invite.alreadyMember) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-lg bg-signal/10 px-2 py-1 text-[10px] font-semibold tracking-wide text-signal uppercase"
        title={invite.title}
      >
        <Icon icon={Check} size="sm" />
        Membro
      </span>
    );
  }

  return (
    <Tooltip label={invite.title ?? invite.label}>
      <IconButton
        type="button"
        size="iconSm"
        variant="primary"
        className="size-9 min-h-9 min-w-9 shrink-0 shadow-[0_0_18px_rgba(124,58,237,0.32)]"
        disabled={invite.disabled}
        aria-label={invite.label}
        onClick={invite.onClick}
      >
        <Icon icon={UserPlus} size="action" />
      </IconButton>
    </Tooltip>
  );
}

function FriendRow({
  entry,
  action,
  inviteAction,
}: {
  entry: FriendEntry;
  action?: { label: string; onClick: () => void };
  inviteAction?: InviteAction;
}) {
  return (
    <li className="flex min-h-11 items-center gap-2 rounded-xl px-2 py-1.5 transition duration-150 hover:bg-white/[0.04]">
      <span className="relative size-8 shrink-0">
        <span className="flex size-full items-center justify-center overflow-hidden rounded-full bg-deck text-[11px] font-semibold text-cloud ring-1 ring-white/[0.06]">
          {entry.avatarUrl ? (
            <img src={entry.avatarUrl} alt="" className="size-full object-cover" />
          ) : (
            initials(entry.displayName)
          )}
        </span>
        {entry.presence !== "offline" ? (
          <span
            className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-signal ring-2 ring-panel"
            aria-hidden
          />
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-cloud">{entry.displayName}</span>
        <span className="text-xs text-haze">{presenceLabel(entry)}</span>
      </span>
      {inviteAction ? <FriendInviteControl invite={inviteAction} /> : null}
      {action ? (
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="h-9 min-h-9 px-3"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      ) : null}
    </li>
  );
}

type PanelFeedback = { kind: "success" | "error"; text: string };

export function FriendsPanel({
  friends,
  communityId,
  communityName,
  canInviteToCommunity,
  memberUserIds,
  onInvited,
}: FriendsPanelProps) {
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState<PanelFeedback | null>(null);
  const [pendingInviteId, setPendingInviteId] = useState<string | null>(null);
  const online = friends.friends.filter((item) => item.presence !== "offline");
  const offline = friends.friends.filter((item) => item.presence === "offline");

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    const error = await friends.requestByEmail(email);
    if (error) {
      setFeedback({ kind: "error", text: error });
      return;
    }
    setFeedback({ kind: "success", text: `Pedido de amizade enviado para ${email.trim()}.` });
    setEmail("");
  }

  async function handleInvite(entry: FriendEntry) {
    if (!communityId || !canInviteToCommunity) {
      setFeedback({
        kind: "error",
        text: "Selecione uma comunidade que você administra.",
      });
      return;
    }
    if (memberUserIds.has(entry.userId)) {
      setFeedback({
        kind: "error",
        text: `${entry.displayName} já está na comunidade.`,
      });
      return;
    }
    setPendingInviteId(entry.userId);
    setFeedback(null);
    const error = await friends.inviteToCommunity(entry.userId, communityId);
    setPendingInviteId(null);
    if (error) {
      setFeedback({ kind: "error", text: error });
      return;
    }
    setFeedback({
      kind: "success",
      text: `${entry.displayName} entrou em ${communityName ?? "a comunidade"}.`,
    });
    onInvited?.();
  }

  function inviteActionFor(entry: FriendEntry): InviteAction | undefined {
    if (!canInviteToCommunity || !communityId) {
      return undefined;
    }
    const already = memberUserIds.has(entry.userId);
    const pending = pendingInviteId === entry.userId;
    return {
      label: already
        ? `${entry.displayName} já é membro`
        : `Convidar ${entry.displayName} para ${communityName ?? "a comunidade"}`,
      disabled: already || pending,
      alreadyMember: already,
      pending,
      title: already
        ? "Já é membro"
        : pending
          ? "Convidando…"
          : `Convidar para ${communityName ?? "comunidade"}`,
      onClick: () => void handleInvite(entry),
    };
  }

  return (
    <div className="p-5">
      <h2 className="px-1 text-[11px] font-semibold tracking-[0.04em] text-muted uppercase">
        Amigos
      </h2>
      {canInviteToCommunity && communityName ? (
        <p className="mt-2 px-1 text-xs text-haze">
          Use o botão ao lado do amigo para convidar a{" "}
          <span className="text-cloud">{communityName}</span>.
        </p>
      ) : (
        <p className="mt-2 px-1 text-xs text-haze">
          Abra uma comunidade (owner/admin) para convidar amigos aos canais.
        </p>
      )}
      <form onSubmit={(event) => void handleAdd(event)} className="mt-3 flex gap-2">
        <Input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="email@amigo.com"
          aria-label="E-mail do amigo"
          className="h-10"
        />
        <IconButton
          type="submit"
          variant="primary"
          className="shrink-0 shadow-[0_0_18px_rgba(124,58,237,0.32)]"
          aria-label="Adicionar amigo"
        >
          <Icon icon={UserPlus} size="action" />
        </IconButton>
      </form>
      {feedback ? (
        <p
          className={cn(
            "mt-2 rounded-lg px-2 py-1.5 text-xs",
            feedback.kind === "success"
              ? "bg-signal/10 text-signal"
              : "bg-coral/10 text-coral",
          )}
          role={feedback.kind === "error" ? "alert" : "status"}
        >
          {feedback.text}
        </p>
      ) : null}
      {friends.error ? (
        <div className="mt-3">
          <p className="text-sm text-coral">{friends.error}</p>
          <Button
            type="button"
            variant="secondary"
            className="mt-2 w-full"
            onClick={() => void friends.retry()}
          >
            Tentar de novo
          </Button>
        </div>
      ) : null}

      {friends.incoming.length > 0 ? (
        <div className="mt-4">
          <p className="px-1 text-[11px] font-semibold tracking-wide text-haze uppercase">
            Pedidos
          </p>
          <ul className="mt-2 space-y-2">
            {friends.incoming.map((entry) => (
              <FriendRow
                key={entry.friendshipId}
                entry={entry}
                action={{ label: "Aceitar", onClick: () => void friends.accept(entry.friendshipId) }}
              />
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4">
        <p className="px-1 text-[11px] font-semibold tracking-[0.04em] text-muted uppercase">
          Online — {online.length}
        </p>
        <ul className="mt-2 space-y-2">
          {online.length === 0 ? (
            <li className="rounded-xl bg-abyss/55 px-3 py-3 text-sm text-haze">
              Nenhum amigo online.
            </li>
          ) : (
            online.map((entry) => (
              <FriendRow
                key={entry.friendshipId}
                entry={entry}
                inviteAction={inviteActionFor(entry)}
              />
            ))
          )}
        </ul>
      </div>

      {offline.length > 0 ? (
        <div className="mt-4">
          <p className="px-1 text-[11px] font-semibold tracking-wide text-haze uppercase">
            Offline — {offline.length}
          </p>
          <ul className="mt-2 space-y-2">
            {offline.map((entry) => (
              <FriendRow
                key={entry.friendshipId}
                entry={entry}
                inviteAction={inviteActionFor(entry)}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
