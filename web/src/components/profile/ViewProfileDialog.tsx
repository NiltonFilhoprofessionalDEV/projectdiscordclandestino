import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus } from "lucide-react";
import { useAuth } from "../../auth/useAuth.ts";
import {
  addProfilePhoto,
  fetchPublicProfile,
  MAX_PHOTOS,
  type PublicProfile,
} from "../../services/profileView.ts";
import { initials } from "../../lib/utils.ts";
import { Button } from "../ui/button.tsx";
import { Icon } from "../ui/icon.tsx";
import { Loading } from "../ui/loading.tsx";
import { AppDialog } from "../shell/AppDialog.tsx";

type ViewProfileDialogProps = {
  userId: string | null;
  onClose: () => void;
  onOpenImage: (src: string, alt: string) => void;
  onEditSelf?: () => void;
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
}: ViewProfileDialogProps) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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
  const gallery = profile?.photoUrls ?? [];

  async function onPick(file: File | undefined) {
    if (!file || !userId) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      const next = await addProfilePhoto(userId, file);
      setProfile(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar a foto.");
    } finally {
      setPending(false);
    }
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
          <div>
            <p className="text-sm font-medium text-haze">Fotos</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {gallery.map((url) => (
                <button
                  key={url}
                  type="button"
                  className="aspect-square overflow-hidden rounded-xl bg-deck ring-1 ring-white/10"
                  aria-label="Abrir foto"
                  onClick={() => onOpenImage(url, profile.displayName)}
                >
                  <img src={url} alt="" className="size-full object-cover" />
                </button>
              ))}
              {isSelf && gallery.length < MAX_PHOTOS ? (
                <button
                  type="button"
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/15 text-haze transition hover:border-electric/40 hover:text-cloud"
                  onClick={() => fileRef.current?.click()}
                  disabled={pending}
                >
                  <Icon icon={ImagePlus} size="action" />
                  <span className="text-[11px]">{pending ? "Enviando…" : "Enviar"}</span>
                </button>
              ) : null}
            </div>
            {gallery.length === 0 && !isSelf ? (
              <p className="mt-2 text-sm text-muted">Este usuário ainda não enviou fotos.</p>
            ) : null}
            {isSelf ? (
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(event) => void onPick(event.target.files?.[0])}
              />
            ) : null}
          </div>
          {isSelf && onEditSelf ? (
            <Button type="button" variant="secondary" className="w-full" onClick={onEditSelf}>
              <Icon icon={Camera} size="action" />
              Editar nome e avatar
            </Button>
          ) : null}
        </div>
      ) : null}
    </AppDialog>
  );
}
