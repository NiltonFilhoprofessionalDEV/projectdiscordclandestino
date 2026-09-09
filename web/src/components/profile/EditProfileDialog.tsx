import { useEffect, useRef, useState, type FormEvent } from "react";
import { Camera } from "lucide-react";
import type { Profile } from "../../auth/types.ts";
import { uploadUserAvatar } from "../../services/avatar.ts";
import { Button } from "../ui/button.tsx";
import { Icon } from "../ui/icon.tsx";
import { Input } from "../ui/input.tsx";
import { AppDialog } from "../shell/AppDialog.tsx";
import { initials } from "../../lib/utils.ts";

type EditProfileDialogProps = {
  open: boolean;
  userId: string;
  profile: Profile;
  onClose: () => void;
  onSave: (input: { displayName: string; avatarUrl: string | null }) => Promise<string | null>;
};

export function EditProfileDialog({
  open,
  userId,
  profile,
  onClose,
  onSave,
}: EditProfileDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setDisplayName(profile.display_name);
    setAvatarUrl(profile.avatar_url);
    setPendingFile(null);
    setPreviewUrl(null);
    setError(null);
    setPending(false);
  }, [open, profile.avatar_url, profile.display_name]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function onPickFile(file: File | undefined) {
    if (!file) {
      return;
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const name = displayName.trim();
    if (name.length < 2 || name.length > 32) {
      setError("O nome deve ter entre 2 e 32 caracteres.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      let nextAvatar = avatarUrl;
      if (pendingFile) {
        nextAvatar = await uploadUserAvatar(userId, pendingFile);
      }
      const saveError = await onSave({ displayName: name, avatarUrl: nextAvatar });
      if (saveError) {
        setError(saveError);
        setPending(false);
        return;
      }
      setPending(false);
      onClose();
    } catch (err) {
      setPending(false);
      setError(err instanceof Error ? err.message : "Não foi possível salvar o perfil.");
    }
  }

  const shownAvatar = previewUrl ?? avatarUrl;

  return (
    <AppDialog
      open={open}
      titleId="edit-profile-title"
      title="Seu perfil"
      description="Escolha um nome e um avatar para a sala e a lista de amigos."
      onClose={onClose}
    >
      <form className="mt-5 space-y-5" onSubmit={(event) => void handleSubmit(event)}>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-deck text-lg font-semibold text-cloud ring-1 ring-haze/20 transition duration-150 ease-out hover:ring-electric/40"
            onClick={() => fileRef.current?.click()}
            aria-label="Trocar avatar"
          >
            {shownAvatar ? (
              <img src={shownAvatar} alt="" className="size-full object-cover" />
            ) : (
              initials(displayName)
            )}
            <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-abyss/75 py-1 text-[10px] text-cloud">
              <Icon icon={Camera} size="sm" />
              Foto
            </span>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-haze">JPG, PNG, WEBP ou GIF · até 2 MB</p>
            <Button
              type="button"
              variant="secondary"
              className="mt-2"
              onClick={() => fileRef.current?.click()}
            >
              Escolher imagem
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(event) => onPickFile(event.target.files?.[0])}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-haze" htmlFor="profile-display-name">
            Nome de exibição
          </label>
          <Input
            id="profile-display-name"
            className="mt-2"
            value={displayName}
            maxLength={32}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </div>

        {error ? (
          <p className="text-sm text-coral" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </form>
    </AppDialog>
  );
}
