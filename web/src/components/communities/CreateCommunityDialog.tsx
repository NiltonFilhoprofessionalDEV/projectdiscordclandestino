import { useEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import type { ApiResult, Community, CreateCommunityInput } from "../../../../shared/api.ts";
import { parseCommunityName } from "../../../../shared/community.ts";
import { Button } from "../ui/button.tsx";
import { Input } from "../ui/input.tsx";
import { AppDialog } from "../shell/AppDialog.tsx";

type CreateCommunityDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (input: CreateCommunityInput) => Promise<ApiResult<Community>>;
  onCreated: (community: Community) => void;
};

async function submitCommunity(
  name: string,
  visibility: CreateCommunityInput["visibility"],
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
  setPending(false);
  if (!result.ok) {
    setError(result.error.message);
    return;
  }
  onCreated(result.data);
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
        <input
          type="radio"
          name="community-visibility"
          checked={visibility === "public"}
          onChange={() => onVisibility("public")}
        />
        Pública
      </label>
      <label className="flex min-h-11 items-center gap-3 text-sm text-cloud">
        <input
          type="radio"
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
  name: string;
  visibility: CreateCommunityInput["visibility"];
  error: string | null;
  pending: boolean;
  nameRef: RefObject<HTMLInputElement | null>;
  onName: (value: string) => void;
  onVisibility: (value: CreateCommunityInput["visibility"]) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
};

function CommunityCreateForm({
  name,
  visibility,
  error,
  pending,
  nameRef,
  onName,
  onVisibility,
  onClose,
  onSubmit,
}: CommunityCreateFormProps) {
  return (
    <form className="mt-5" onSubmit={onSubmit}>
      <label className="text-sm font-medium text-haze" htmlFor="community-name">
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
        <Button type="button" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" variant="solid" disabled={pending}>
          Criar
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
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setName("");
    setVisibility("public");
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
    onSubmit: (event: FormEvent) => {
      event.preventDefault();
      void submitCommunity(name, visibility, onCreate, onCreated, onClose, setError, setPending);
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
      description="Escolha um nome e quem pode encontrar o espaço."
      onClose={onClose}
    >
      <CommunityCreateForm
        name={form.name}
        visibility={form.visibility}
        error={form.error}
        pending={form.pending}
        nameRef={form.nameRef}
        onName={form.setName}
        onVisibility={form.setVisibility}
        onClose={onClose}
        onSubmit={form.onSubmit}
      />
    </AppDialog>
  );
}
