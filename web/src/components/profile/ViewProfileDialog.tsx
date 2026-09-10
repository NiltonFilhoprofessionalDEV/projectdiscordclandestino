import { useEffect, useState } from "react";
import { Camera, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../auth/useAuth.ts";
import { callFriendRelation } from "../../friends/callFriend.ts";
import type { useFriends } from "../../hooks/useFriends.ts";
import { fetchPublicProfile, type PublicProfile } from "../../services/profileView.ts";
import { initials } from "../../lib/utils.ts";
import { Button } from "../ui/button.tsx";
import { Icon } from "../ui/icon.tsx";
import { Loading } from "../ui/loading.tsx";
import { AppDialog } from "../shell/AppDialog.tsx";

type FriendsApi = ReturnType<typeof useFriends>;

type ViewProfileDialogProps = {
  userId: string | null;
  onClose: () => void;
  onOpenImage: (src: string, alt: string) => void;
  onEditSelf?: () => void;
  friends?: FriendsApi;
};

function presenceCopy(profile: PublicProfile): string {
  if (profile.presence === "in_voice") {
    return profile.activity?.trim() || "Em chamada";
  }
  if (profile.presence === "online") {
    return "Online";
  }
  return "Offline";
}

export function ViewProfileDialog({
  userId,
  onClose,
  onOpenImage,
  onEditSelf,
  friends,
}: ViewProfileDialogProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    setError(null);
    void fetchPublicProfile(userId).then((next) => {
      if (cancelled) {
        return;
      }
      if (!next) {
        setError("Não foi possível carregar este perfil.");
        setProfile(null);
        return;
      }
      setProfile(next);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!userId) {
    return null;
  }

  const isSelf = user?.id === userId;
  const relation =
    friends && userId
      ? callFriendRelation(userId, Boolean(isSelf), friends.friends, friends.incoming, friends.outgoing)
      : { kind: isSelf ? ("self" as const) : ("none" as const) };

  async function addFriend() {
    if (!friends || !profile) {
      return;
    }
    setAdding(true);
    const fail = await friends.requestByUserId(userId);
    setAdding(false);
    if (fail) {
      toast.error(fail);
      return;
    }
    toast.success(`Pedido enviado para ${profile.displayName}.`);
  }

  return (
    <AppDialog
      open
      titleId="view-profile-title"
      title={profile?.displayName ?? "Perfil"}
      description={profile ? presenceCopy(profile) : "Dados públicos deste usuário."}
      onClose={onClose}
    >
      {!profile && !error ? <Loading className="mt-5" label="Carregando perfil…" /> : null}
      {error ? (
        <p className="mt-5 text-sm text-coral" role="alert">
          {error}
        </p>
      ) : null}
      {profile ? (
        <div className="mt-5 space-y-5">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-deck text-lg font-semibold text-cloud ring-1 ring-white/15"
              aria-label="Abrir foto de perfil"
              disabled={!profile.avatarUrl}
              onClick={() => {
                if (profile.avatarUrl) {
                  onOpenImage(profile.avatarUrl, profile.displayName);
                }
              }}
            >
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                initials(profile.displayName)
              )}
            </button>
            <div className="min-w-0">
              <p className="font-display text-lg font-bold text-cloud">{profile.displayName}</p>
              <p className="text-sm text-haze">{presenceCopy(profile)}</p>
            </div>
          </div>
          {isSelf && onEditSelf ? (
            <Button type="button" variant="secondary" className="w-full" onClick={onEditSelf}>
              <Icon icon={Camera} size="action" />
              Editar nome e avatar
            </Button>
          ) : null}
          {!isSelf && relation.kind === "none" && friends ? (
            <Button
              type="button"
              variant="primary"
              className="w-full"
              disabled={adding}
              onClick={() => void addFriend()}
            >
              <Icon icon={UserPlus} size="action" />
              Adicionar amigo
            </Button>
          ) : null}
          {!isSelf && relation.kind === "outgoing" ? (
            <p className="rounded-xl bg-abyss/55 px-3 py-2.5 text-center text-sm text-haze">
              Pedido de amizade enviado
            </p>
          ) : null}
          {!isSelf && relation.kind === "incoming" && friends ? (
            <Button
              type="button"
              variant="primary"
              className="w-full"
              onClick={() => void friends.accept(relation.friendshipId)}
            >
              Aceitar pedido de amizade
            </Button>
          ) : null}
          {!isSelf && relation.kind === "accepted" ? (
            <p className="rounded-xl bg-signal/10 px-3 py-2.5 text-center text-sm text-signal">
              Vocês já são amigos
            </p>
          ) : null}
        </div>
      ) : null}
    </AppDialog>
  );
}
