import { useEffect, useState, type FormEvent } from "react";
import type {
  ApiResult,
  Community,
  CommunitySummary,
  CommunityVisibility,
  UpdateCommunityInput,
} from "../../../../shared/api.ts";
import type { CommunityId } from "../../../../shared/community.ts";
import { parseCommunityName } from "../../../../shared/community.ts";
import { uploadCommunityAvatar } from "../../services/avatar.ts";
import { Button } from "../ui/button.tsx";
import { Input } from "../ui/input.tsx";
import { Radio } from "../ui/radio.tsx";
import { AppDialog } from "../shell/AppDialog.tsx";
import { CommunityAvatarField } from "./CommunityAvatarField.tsx";

type EditCommunityDialogProps = {
  community: CommunitySummary | null;
  onClose: () => void;
  onUpdate: (
    communityId: CommunityId,
    input: UpdateCommunityInput,
  ) => Promise<ApiResult<Community>>;
  onDelete: (communityId: CommunityId) => Promise<ApiResult<{ id: CommunityId }>>;
};

export function EditCommunityDialog({
  community,
  onClose,
  onUpdate,
  onDelete,
}: EditCommunityDialogProps) {
  const open = community !== null;
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<CommunityVisibility>("public");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!community) {
      return;
    }
    setName(community.name);
    setVisibility(community.visibility);
    setAvatarUrl(community.avatarUrl);
    setPendingFile(null);
    setError(null);
    setPending(false);
  }, [community]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!community) {
      return;
    }
    const parsed = parseCommunityName(name);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setPending(true);
    setError(null);
    try {
      let nextAvatar = avatarUrl;
      if (pendingFile) {
        nextAvatar = await uploadCommunityAvatar(community.id, pendingFile);
      }
      const input: UpdateCommunityInput = {
        name: parsed.value,
        visibility,
        avatarUrl: nextAvatar,
      };
      const result = await onUpdate(community.id, input);
      if (!result.ok) {
        setError(result.error.message);
        setPending(false);
        return;
      }
      setPending(false);
      onClose();
    } catch (err) {
      setPending(false);
      setError(err instanceof Error ? err.message : "Não foi possível salvar a comunidade.");
    }
  }

  async function handleDelete() {
    if (!community) {
      return;
    }
    const confirmed = window.confirm(
      `Excluir a comunidade "${community.name}"? Canais e mensagens serão removidos.`,
    );
    if (!confirmed) {
      return;
    }
    setPending(true);
    setError(null);
    const result = await onDelete(community.id);
    setPending(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    onClose();
  }

  return (
    <AppDialog
      open={open}
      titleId="edit-community-title"
      title="Editar comunidade"
      description="Atualize o nome, a visibilidade e o ícone do espaço."
      onClose={onClose}
    >
      <form className="mt-5" onSubmit={(event) => void handleSubmit(event)}>
        <CommunityAvatarField
          key={community?.id ?? "edit-closed"}
          name={name}
          avatarUrl={avatarUrl}
          onFile={setPendingFile}
          label="Ícone da comunidade"
        />
        <label className="mt-5 block text-sm font-medium text-haze" htmlFor="edit-community-name">
          Nome
        </label>
        <Input
          id="edit-community-name"
          className="mt-2"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <fieldset className="mt-5">
          <legend className="text-sm font-medium text-haze">Visibilidade</legend>
          <label className="mt-3 flex min-h-11 items-center gap-3 text-sm text-cloud">
            <Radio
              name="edit-community-visibility"
              checked={visibility === "public"}
              onChange={() => setVisibility("public")}
            />
            Pública
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm text-cloud">
            <Radio
              name="edit-community-visibility"
              checked={visibility === "private"}
              onChange={() => setVisibility("private")}
            />
            Privada
          </label>
        </fieldset>
        {error ? (
          <p className="mt-3 text-sm text-coral" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-between gap-2">
          <Button
            type="button"
            variant="danger"
            onClick={() => void handleDelete()}
            disabled={pending}
          >
            Excluir
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </div>
      </form>
    </AppDialog>
  );
}
