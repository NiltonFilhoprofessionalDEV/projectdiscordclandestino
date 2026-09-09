import { useEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import type { ApiResult, Channel, CreateChannelInput } from "../../../../shared/api.ts";
import { parseChannelName } from "../../../../shared/community.ts";
import { Button } from "../ui/button.tsx";
import { Input } from "../ui/input.tsx";
import { AppDialog } from "../shell/AppDialog.tsx";

type CreateChannelDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (input: CreateChannelInput) => Promise<ApiResult<Channel>>;
  onCreated: (channel: Channel) => void;
};

async function submitChannel(
  name: string,
  type: CreateChannelInput["type"],
  onCreate: CreateChannelDialogProps["onCreate"],
  onCreated: CreateChannelDialogProps["onCreated"],
  onClose: () => void,
  setError: (value: string | null) => void,
  setPending: (value: boolean) => void,
) {
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

function ChannelTypeFields({
  type,
  onType,
}: {
  type: CreateChannelInput["type"];
  onType: (value: CreateChannelInput["type"]) => void;
}) {
  return (
    <fieldset className="mt-5">
      <legend className="text-sm font-medium text-haze">Tipo</legend>
      <label className="mt-3 flex min-h-11 items-center gap-3 text-sm text-cloud">
        <input type="radio" name="channel-type" checked={type === "text"} onChange={() => onType("text")} />
        Texto
      </label>
      <label className="flex min-h-11 items-center gap-3 text-sm text-cloud">
        <input type="radio" name="channel-type" checked={type === "voice"} onChange={() => onType("voice")} />
        Voz
      </label>
    </fieldset>
  );
}

type ChannelCreateFormProps = {
  name: string;
  type: CreateChannelInput["type"];
  error: string | null;
  pending: boolean;
  nameRef: RefObject<HTMLInputElement | null>;
  onName: (value: string) => void;
  onType: (value: CreateChannelInput["type"]) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
};

function ChannelCreateForm({
  name,
  type,
  error,
  pending,
  nameRef,
  onName,
  onType,
  onClose,
  onSubmit,
}: ChannelCreateFormProps) {
  return (
    <form className="mt-5" onSubmit={onSubmit}>
      <label className="text-sm font-medium text-haze" htmlFor="channel-name">
        Nome
      </label>
      <Input
        ref={nameRef}
        id="channel-name"
        value={name}
        onChange={(event) => onName(event.target.value)}
        className="mt-2"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "channel-create-error" : undefined}
      />
      <ChannelTypeFields type={type} onType={onType} />
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
  );
}

function useChannelCreateForm(
  open: boolean,
  onCreate: CreateChannelDialogProps["onCreate"],
  onCreated: CreateChannelDialogProps["onCreated"],
  onClose: () => void,
) {
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<CreateChannelInput["type"]>("text");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setName("");
    setType("text");
    setError(null);
    setPending(false);
    requestAnimationFrame(() => nameRef.current?.focus());
  }, [open]);

  return {
    name,
    type,
    error,
    pending,
    nameRef,
    setName,
    setType,
    onSubmit: (event: FormEvent) => {
      event.preventDefault();
      void submitChannel(name, type, onCreate, onCreated, onClose, setError, setPending);
    },
  };
}

export function CreateChannelDialog({
  open,
  onClose,
  onCreate,
  onCreated,
}: CreateChannelDialogProps) {
  const form = useChannelCreateForm(open, onCreate, onCreated, onClose);
  return (
    <AppDialog
      open={open}
      titleId="create-channel-title"
      title="Novo canal"
      description="Defina o nome e se a conversa é por texto ou voz."
      onClose={onClose}
    >
      <ChannelCreateForm
        name={form.name}
        type={form.type}
        error={form.error}
        pending={form.pending}
        nameRef={form.nameRef}
        onName={form.setName}
        onType={form.setType}
        onClose={onClose}
        onSubmit={form.onSubmit}
      />
    </AppDialog>
  );
}
