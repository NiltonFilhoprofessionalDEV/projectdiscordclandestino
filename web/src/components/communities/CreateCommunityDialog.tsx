import { useEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import type { ApiResult, Community, CreateCommunityInput } from "../../../../shared/api.ts";
import { parseCommunityName } from "../../../../shared/community.ts";
import { uploadCommunityAvatar } from "../../services/avatar.ts";
import { updateCommunity } from "../../services/api.ts";
import { Button } from "../ui/button.tsx";
import { Input } from "../ui/input.tsx";
import { Radio } from "../ui/radio.tsx";
import { AppDialog } from "../shell/AppDialog.tsx";
import { CommunityAvatarField } from "./CommunityAvatarField.tsx";

type CreateCommunityDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (input: CreateCommunityInput) => Promise<ApiResult<Community>>;
  onCreated: (community: Community) => void;
};

async function submitCommunity(
  name: string,
  visibility: CreateCommunityInput["visibility"],
  pendingFile: File | null,
  onCreate: CreateCommunityDialogProps["onCreate"],
  onCreated: CreateCommunityDialogProps["onCreated"],
  onClose: () => void,
  setError: (value: string | null) => void,
  setPending: (value: boolean) => void,
) {
  const parsed = parseCommunityName(name);
  if (!parsed.ok) {
    setError(parsed.error);
    return;
  }
  setPending(true);
  setError(null);
  const result = await onCreate({ name: parsed.value, visibility });
  if (!result.ok) {
    setPending(false);
    setError(result.error.message);
    return;
  }
  let community = result.data;
  if (pendingFile) {
    try {
      const avatarUrl = await uploadCommunityAvatar(community.id, pendingFile);
      const updated = await updateCommunity(community.id, { avatarUrl });
      if (updated.ok) {
        community = updated.data;
      }
    } catch (err) {
      setPending(false);
      setError(
        err instanceof Error
          ? err.message
          : "Comunidade criada, mas a imagem não pôde ser enviada.",
      );
      onCreated(community);
      onClose();
      return;
    }
  }
  setPending(false);
  onCreated(community);
  onClose();
}

function CommunityVisibilityFields({
  visibility,
  onVisibility,
}: {
  visibility: CreateCommunityInput["visibility"];
  onVisibility: (value: CreateCommunityInput["visibility"]) => void;
}) {
  return (
    <fieldset className="mt-5">
      <legend className="text-sm font-medium text-haze">Visibilidade</legend>
      <label className="mt-3 flex min-h-11 items-center gap-3 text-sm text-cloud">
        <Radio
          name="community-visibility"
          checked={visibility === "public"}
          onChange={() => onVisibility("public")}
        />
        Pública
      </label>
      <label className="flex min-h-11 items-center gap-3 text-sm text-cloud">
        <Radio
          name="community-visibility"
          checked={visibility === "private"}
          onChange={() => onVisibility("private")}
        />
        Privada
      </label>
    </fieldset>
  );
}

type CommunityCreateFormProps = {
  open: boolean;
  name: string;
  visibility: CreateCommunityInput["visibility"];
  error: string | null;
  pending: boolean;
  nameRef: RefObject<HTMLInputElement | null>;
  onName: (value: string) => void;
  onVisibility: (value: CreateCommunityInput["visibility"]) => void;
  onFile: (file: File | null) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
};

function CommunityCreateForm({
  open,
  name,
  visibility,
  error,
  pending,
  nameRef,
  onName,
  onVisibility,
  onFile,
  onClose,
  onSubmit,
}: CommunityCreateFormProps) {
  return (
    <form className="mt-5" onSubmit={onSubmit}>
      <CommunityAvatarField
        key={open ? "avatar-open" : "avatar-closed"}
        name={name}
        avatarUrl={null}
        onFile={onFile}
      />
      <label className="mt-5 block text-sm font-medium text-haze" htmlFor="community-name">
        Nome
      </label>
      <Input
        ref={nameRef}
        id="community-name"
        value={name}
        onChange={(event) => onName(event.target.value)}
        className="mt-2"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "community-create-error" : undefined}
      />
      <CommunityVisibilityFields visibility={visibility} onVisibility={onVisibility} />
      {error ? (
        <p id="community-create-error" className="mt-3 text-sm text-coral" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Criando…" : "Criar"}
        </Button>
      </div>
    </form>
  );
}

function useCommunityCreateForm(
  open: boolean,
  onCreate: CreateCommunityDialogProps["onCreate"],
  onCreated: CreateCommunityDialogProps["onCreated"],
  onClose: () => void,
) {
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<CreateCommunityInput["visibility"]>("public");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setName("");
    setVisibility("public");
    setPendingFile(null);
    setError(null);
    setPending(false);
    requestAnimationFrame(() => nameRef.current?.focus());
  }, [open]);

  return {
    name,
    visibility,
    error,
    pending,
    nameRef,
    setName,
    setVisibility,
    setPendingFile,
    onSubmit: (event: FormEvent) => {
      event.preventDefault();
      void submitCommunity(
        name,
        visibility,
        pendingFile,
        onCreate,
        onCreated,
        onClose,
        setError,
        setPending,
      );
    },
  };
}

export function CreateCommunityDialog({
  open,
  onClose,
  onCreate,
  onCreated,
}: CreateCommunityDialogProps) {
  const form = useCommunityCreateForm(open, onCreate, onCreated, onClose);
  return (
    <AppDialog
      open={open}
      titleId="create-community-title"
      title="Nova comunidade"
      description="Escolha um nome, um ícone e quem pode encontrar o espaço."
      onClose={onClose}
    >
      <CommunityCreateForm
        open={open}
        name={form.name}
        visibility={form.visibility}
        error={form.error}
        pending={form.pending}
        nameRef={form.nameRef}
        onName={form.setName}
        onVisibility={form.setVisibility}
        onFile={form.setPendingFile}
        onClose={onClose}
        onSubmit={form.onSubmit}
      />
    </AppDialog>
  );
}
