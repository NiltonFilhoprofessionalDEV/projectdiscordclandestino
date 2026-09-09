import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Community, CreateCommunityInput } from "../../../../shared/api.ts";
import { parseCommunityName } from "../../../../shared/community.ts";
import type { ApiResult } from "../../../../shared/api.ts";
import { Button } from "../ui/button.tsx";
import { Input } from "../ui/input.tsx";
import { AppDialog } from "../shell/AppDialog.tsx";

type CreateCommunityDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (input: CreateCommunityInput) => Promise<ApiResult<Community>>;
  onCreated: (community: Community) => void;
};

export function CreateCommunityDialog({
  open,
  onClose,
  onCreate,
  onCreated,
}: CreateCommunityDialogProps) {
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<CreateCommunityInput["visibility"]>("public");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setVisibility("public");
      setError(null);
      setPending(false);
      requestAnimationFrame(() => nameRef.current?.focus());
    }
  }, [open]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
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

  return (
    <AppDialog
      open={open}
      titleId="create-community-title"
      title="Nova comunidade"
      description="Escolha um nome e quem pode encontrar o espaço."
      onClose={onClose}
    >
      <form className="mt-5" onSubmit={(event) => void handleSubmit(event)}>
        <label className="text-sm font-medium text-haze" htmlFor="community-name">
          Nome
        </label>
        <Input
          ref={nameRef}
          id="community-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-2"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "community-create-error" : undefined}
        />
        <fieldset className="mt-5">
          <legend className="text-sm font-medium text-haze">Visibilidade</legend>
          <label className="mt-3 flex min-h-11 items-center gap-3 text-sm text-cloud">
            <input
              type="radio"
              name="community-visibility"
              checked={visibility === "public"}
              onChange={() => setVisibility("public")}
            />
            Pública
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm text-cloud">
            <input
              type="radio"
              name="community-visibility"
              checked={visibility === "private"}
              onChange={() => setVisibility("private")}
            />
            Privada
          </label>
        </fieldset>
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
    </AppDialog>
  );
}
