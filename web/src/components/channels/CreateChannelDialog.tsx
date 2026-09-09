import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Channel, CreateChannelInput } from "../../../../shared/api.ts";
import { parseChannelName } from "../../../../shared/community.ts";
import type { ApiResult } from "../../../../shared/api.ts";
import { Button } from "../ui/button.tsx";
import { Input } from "../ui/input.tsx";
import { AppDialog } from "../shell/AppDialog.tsx";

type CreateChannelDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (input: CreateChannelInput) => Promise<ApiResult<Channel>>;
  onCreated: (channel: Channel) => void;
};

export function CreateChannelDialog({
  open,
  onClose,
  onCreate,
  onCreated,
}: CreateChannelDialogProps) {
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<CreateChannelInput["type"]>("text");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setType("text");
      setError(null);
      setPending(false);
      requestAnimationFrame(() => nameRef.current?.focus());
    }
  }, [open]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseChannelName(name);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setPending(true);
    setError(null);
    const result = await onCreate({ name: parsed.value, type });
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
      titleId="create-channel-title"
      title="Novo canal"
      description="Defina o nome e se a conversa é por texto ou voz."
      onClose={onClose}
    >
      <form className="mt-5" onSubmit={(event) => void handleSubmit(event)}>
        <label className="text-sm font-medium text-haze" htmlFor="channel-name">
          Nome
        </label>
        <Input
          ref={nameRef}
          id="channel-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-2"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "channel-create-error" : undefined}
        />
        <fieldset className="mt-5">
          <legend className="text-sm font-medium text-haze">Tipo</legend>
          <label className="mt-3 flex min-h-11 items-center gap-3 text-sm text-cloud">
            <input
              type="radio"
              name="channel-type"
              checked={type === "text"}
              onChange={() => setType("text")}
            />
            Texto
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm text-cloud">
            <input
              type="radio"
              name="channel-type"
              checked={type === "voice"}
              onChange={() => setType("voice")}
            />
            Voz
          </label>
        </fieldset>
        {error ? (
          <p id="channel-create-error" className="mt-3 text-sm text-coral" role="alert">
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
