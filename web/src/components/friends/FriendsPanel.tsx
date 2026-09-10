import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, MoreVertical, UserPlus } from "lucide-react";
import type { CommunityId } from "../../../../shared/community.ts";
import { cn, initials } from "../../lib/utils.ts";
import type { FriendEntry } from "../../hooks/useFriends.ts";
import { Button, IconButton } from "../ui/button.tsx";
import { Icon } from "../ui/icon.tsx";
import { Input } from "../ui/input.tsx";
import { Tooltip } from "../ui/tooltip.tsx";
import { useProfilePeek } from "../../profile/ProfilePeek.tsx";

type FriendsPanelProps = {
  friends: {
    friends: FriendEntry[];
    incoming: FriendEntry[];
    outgoing: FriendEntry[];
    status: string;
    error: string | null;
    requestByEmail: (email: string) => Promise<string | null>;
    requestByUserId?: (userId: string) => Promise<string | null>;
    accept: (id: string) => Promise<void>;
    remove: (id: string) => Promise<string | null>;
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

type MenuItem = {
  label: string;
  onClick: () => void;
  danger?: boolean;
};

function FriendInviteControl({ invite }: { invite: InviteAction }) {
  if (invite.alreadyMember) {
    return (
      <span
        className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-signal/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-signal uppercase"
        title={invite.title}
      >
        <Icon icon={Check} size="sm" className="size-2.5" />
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
        className="size-7 min-h-7 min-w-7 shrink-0 rounded-lg shadow-[0_0_14px_rgba(124,58,237,0.28)]"
        disabled={invite.disabled}
        aria-label={invite.label}
        onClick={invite.onClick}
      >
        <Icon icon={UserPlus} size="sm" />
      </IconButton>
    </Tooltip>
  );
}

function FriendRowMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <IconButton
        type="button"
        size="iconSm"
        variant="ghost"
        className="size-7 min-h-7 min-w-7 rounded-lg text-haze"
        aria-label="Mais opções"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
      >
        <Icon icon={MoreVertical} size="sm" />
      </IconButton>
      {open ? (
        <div
          role="menu"
          className="absolute top-full right-0 z-30 mt-1 min-w-[9.5rem] overflow-hidden rounded-xl border border-white/[0.08] bg-[#12131D] py-1 shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className={cn(
                "flex w-full px-3 py-2 text-left text-sm transition hover:bg-white/[0.06]",
                item.danger ? "text-coral" : "text-cloud",
              )}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FriendRow({
  entry,
  action,
  menuItems,
  inviteAction,
}: {
  entry: FriendEntry;
  action?: { label: string; onClick: () => void; variant?: "primary" | "secondary" | "danger" };
  menuItems?: MenuItem[];
  inviteAction?: InviteAction;
}) {
  const peek = useProfilePeek();
  return (
    <li className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition duration-150 hover:bg-white/[0.04]">
      <button
        type="button"
        className="relative size-7 shrink-0"
        aria-label={`Ver perfil de ${entry.displayName}`}
        onClick={() => peek.openUser(entry.userId)}
      >
        <span className="flex size-full items-center justify-center overflow-hidden rounded-full bg-deck text-[10px] font-semibold text-cloud ring-1 ring-white/[0.06]">
          {entry.avatarUrl ? (
            <img src={entry.avatarUrl} alt="" className="size-full object-cover" />
          ) : (
            initials(entry.displayName)
          )}
        </span>
        {entry.presence !== "offline" ? (
          <span
            className="absolute -right-0.5 -bottom-0.5 size-2 rounded-full bg-signal ring-2 ring-panel"
            aria-hidden
          />
        ) : null}
      </button>
      <button
        type="button"
        className="min-w-0 flex-1 text-left leading-tight"
        onClick={() => peek.openUser(entry.userId)}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-[13px] text-cloud">{entry.displayName}</span>
          {inviteAction?.alreadyMember ? <FriendInviteControl invite={inviteAction} /> : null}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-haze">{presenceLabel(entry)}</span>
      </button>
      {inviteAction && !inviteAction.alreadyMember ? (
        <FriendInviteControl invite={inviteAction} />
      ) : null}
      {action ? (
        <Button
          type="button"
          variant={action.variant ?? "primary"}
          size="sm"
          className="h-7 min-h-7 shrink-0 rounded-lg px-2.5 text-xs"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      ) : null}
      {menuItems && menuItems.length > 0 ? <FriendRowMenu items={menuItems} /> : null}
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

  async function handleRemove(entry: FriendEntry, successText: string) {
    const error = await friends.remove(entry.friendshipId);
    if (error) {
      setFeedback({ kind: "error", text: error });
      return;
    }
    setFeedback({ kind: "success", text: successText });
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

  function removeMenu(entry: FriendEntry): MenuItem[] {
    return [
      {
        label: "Remover amizade",
        danger: true,
        onClick: () => void handleRemove(entry, `${entry.displayName} removido dos amigos.`),
      },
    ];
  }

  return (
    <div className="p-4">
      <h2 className="px-1 text-[11px] font-semibold tracking-[0.04em] text-muted uppercase">
        Amigos
      </h2>
      {canInviteToCommunity && communityName ? (
        <p className="mt-1.5 px-1 text-xs text-haze">
          Use o botão ao lado do amigo para convidar a{" "}
          <span className="text-cloud">{communityName}</span>.
        </p>
      ) : (
        <p className="mt-1.5 px-1 text-xs text-haze">
          Abra uma comunidade (owner/admin) para convidar amigos aos canais.
        </p>
      )}
      <form onSubmit={(event) => void handleAdd(event)} className="mt-3 flex gap-2">
        <Input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="email@amigo.com"
          aria-label="E-mail do amigo"
          className="h-9"
        />
        <IconButton
          type="submit"
          variant="primary"
          className="size-9 min-h-9 min-w-9 shrink-0 shadow-[0_0_18px_rgba(124,58,237,0.32)]"
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
        <div className="mt-3">
          <p className="px-1 text-[11px] font-semibold tracking-wide text-haze uppercase">
            Pedidos
          </p>
          <ul className="mt-1 space-y-0.5">
            {friends.incoming.map((entry) => (
              <FriendRow
                key={entry.friendshipId}
                entry={entry}
                menuItems={[
                  {
                    label: "Recusar",
                    danger: true,
                    onClick: () =>
                      void handleRemove(entry, `Pedido de ${entry.displayName} recusado.`),
                  },
                ]}
                action={{ label: "Aceitar", onClick: () => void friends.accept(entry.friendshipId) }}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {friends.outgoing.length > 0 ? (
        <div className="mt-3">
          <p className="px-1 text-[11px] font-semibold tracking-wide text-haze uppercase">
            Enviados — {friends.outgoing.length}
          </p>
          <ul className="mt-1 space-y-0.5">
            {friends.outgoing.map((entry) => (
              <FriendRow
                key={entry.friendshipId}
                entry={entry}
                menuItems={[
                  {
                    label: "Cancelar pedido",
                    onClick: () =>
                      void handleRemove(entry, `Pedido para ${entry.displayName} cancelado.`),
                  },
                ]}
              />
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-3">
        <p className="px-1 text-[11px] font-semibold tracking-[0.04em] text-muted uppercase">
          Online — {online.length}
        </p>
        <ul className="mt-1 space-y-0.5">
          {online.length === 0 ? (
            <li className="rounded-lg px-2 py-2 text-sm text-haze">Nenhum amigo online.</li>
          ) : (
            online.map((entry) => (
              <FriendRow
                key={entry.friendshipId}
                entry={entry}
                inviteAction={inviteActionFor(entry)}
                menuItems={removeMenu(entry)}
              />
            ))
          )}
        </ul>
      </div>

      {offline.length > 0 ? (
        <div className="mt-3">
          <p className="px-1 text-[11px] font-semibold tracking-wide text-haze uppercase">
            Offline — {offline.length}
          </p>
          <ul className="mt-1 space-y-0.5">
            {offline.map((entry) => (
              <FriendRow
                key={entry.friendshipId}
                entry={entry}
                inviteAction={inviteActionFor(entry)}
                menuItems={removeMenu(entry)}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
