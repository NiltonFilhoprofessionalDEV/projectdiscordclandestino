import { useState, type FormEvent } from "react";
import { LogIn, UserPlus } from "lucide-react";
import type { CommunityId } from "../../../../shared/community.ts";
import { cn, initials } from "../../lib/utils.ts";
import type { FriendEntry } from "../../hooks/useFriends.ts";
import { Button } from "../ui/button.tsx";
import { Input } from "../ui/input.tsx";

type FriendsPanelProps = {
  friends: {
    friends: FriendEntry[];
    incoming: FriendEntry[];
    status: string;
    error: string | null;
    requestByEmail: (email: string) => Promise<string | null>;
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

function FriendRow({
  entry,
  action,
  inviteAction,
}: {
  entry: FriendEntry;
  action?: { label: string; onClick: () => void };
  inviteAction?: { label: string; disabled?: boolean; title?: string; onClick: () => void };
}) {
  return (
    <li className="flex min-h-11 items-center gap-2 rounded-xl bg-abyss/55 px-3 py-1.5">
      <span
        className={cn(
          "relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-deck text-[11px] font-semibold text-cloud",
          entry.presence !== "offline" && "ring-2 ring-emerald-400/70",
        )}
      >
        {entry.avatarUrl ? (
          <img src={entry.avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          initials(entry.displayName)
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-cloud">{entry.displayName}</span>
        <span className="text-xs text-haze">{presenceLabel(entry)}</span>
      </span>
      {inviteAction ? (
        <Button
          type="button"
          size="icon"
          variant="live"
          disabled={inviteAction.disabled}
          title={inviteAction.title ?? inviteAction.label}
          aria-label={inviteAction.label}
          onClick={inviteAction.onClick}
        >
          <LogIn className="size-4" />
        </Button>
      ) : null}
      {action ? (
        <Button type="button" variant="ghost" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </li>
  );
}

export function FriendsPanel({
  friends,
  communityId,
  communityName,
  canInviteToCommunity,
  memberUserIds,
  onInvited,
}: FriendsPanelProps) {
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);
  const [pendingInviteId, setPendingInviteId] = useState<string | null>(null);
  const online = friends.friends.filter((item) => item.presence !== "offline");
  const offline = friends.friends.filter((item) => item.presence === "offline");

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    const error = await friends.requestByEmail(email);
    if (error) {
      setFormError(error);
      return;
    }
    setFormError(null);
    setEmail("");
  }

  async function handleInvite(entry: FriendEntry) {
    if (!communityId || !canInviteToCommunity) {
      setInviteFeedback("Selecione uma comunidade que você administra.");
      return;
    }
    if (memberUserIds.has(entry.userId)) {
      setInviteFeedback(`${entry.displayName} já está na comunidade.`);
      return;
    }
    setPendingInviteId(entry.userId);
    setInviteFeedback(null);
    const error = await friends.inviteToCommunity(entry.userId, communityId);
    setPendingInviteId(null);
    if (error) {
      setInviteFeedback(error);
      return;
    }
    setInviteFeedback(
      `${entry.displayName} entrou em ${communityName ?? "a comunidade"}.`,
    );
    onInvited?.();
  }

  function inviteActionFor(entry: FriendEntry) {
    if (!canInviteToCommunity || !communityId) {
      return undefined;
    }
    const already = memberUserIds.has(entry.userId);
    return {
      label: already
        ? `${entry.displayName} já é membro`
        : `Convidar ${entry.displayName} para ${communityName ?? "a comunidade"}`,
      disabled: already || pendingInviteId === entry.userId,
      title: already
        ? "Já é membro"
        : `Convidar para ${communityName ?? "comunidade"}`,
      onClick: () => void handleInvite(entry),
    };
  }

  return (
    <div className="p-5">
      <h2 className="px-1 text-xs font-semibold tracking-[0.14em] text-haze uppercase">Amigos</h2>
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
        <Button type="submit" size="icon" aria-label="Adicionar amigo">
          <UserPlus className="size-4" />
        </Button>
      </form>
      {formError ? <p className="mt-2 text-xs text-coral">{formError}</p> : null}
      {inviteFeedback ? (
        <p className="mt-2 text-xs text-electric" role="status">
          {inviteFeedback}
        </p>
      ) : null}
      {friends.error ? (
        <div className="mt-3">
          <p className="text-sm text-coral">{friends.error}</p>
          <Button type="button" className="mt-2 w-full" onClick={() => void friends.retry()}>
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
        <p className="px-1 text-[11px] font-semibold tracking-wide text-haze uppercase">
          Online — {online.length}
        </p>
        <ul className="mt-2 space-y-2">
          {online.length === 0 ? (
            <li className="rounded-xl bg-abyss/55 px-3 py-3 text-sm text-haze">Nenhum amigo online.</li>
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
