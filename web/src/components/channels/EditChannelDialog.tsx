import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ApiResult, Channel, UpdateChannelInput } from "../../../../shared/api.ts";
import type { ChannelId } from "../../../../shared/community.ts";
import { parseChannelName } from "../../../../shared/community.ts";
import { Button } from "../ui/button.tsx";
import { Input } from "../ui/input.tsx";
import { AppDialog } from "../shell/AppDialog.tsx";

type EditChannelDialogProps = {
  channel: Channel | null;
  onClose: () => void;
  onUpdate: (channelId: Channel["id"], input: UpdateChannelInput) => Promise<ApiResult<Channel>>;
  onDelete: (channelId: ChannelId) => Promise<ApiResult<{ id: ChannelId }>>;
  onUpdated: () => void;
};

export function EditChannelDialog({
  channel,
  onClose,
  onUpdate,
  onDelete,
  onUpdated,
}: EditChannelDialogProps) {
  const [name, setName] = useState(channel?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(channel?.name ?? "");
    setError(null);
    setPending(false);
    if (channel) {
      requestAnimationFrame(() => nameRef.current?.focus());
    }
  }, [channel]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!channel) {
      return;
    }
    const parsed = parseChannelName(name);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setPending(true);
    setError(null);
    const result = await onUpdate(channel.id, { name: parsed.value });
    setPending(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    onUpdated();
    onClose();
  }

  async function handleDelete() {
    if (!channel) {
      return;
    }
    const confirmed = window.confirm(`Excluir o canal "${channel.name}"?`);
    if (!confirmed) {
      return;
    }
    setPending(true);
    setError(null);
    const result = await onDelete(channel.id);
    setPending(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    onUpdated();
    onClose();
  }

  return (
    <AppDialog
      open={channel !== null}
      titleId="edit-channel-title"
      title="Editar canal"
      description="Renomeie ou exclua o canal selecionado."
      onClose={onClose}
    >
      <form onSubmit={(event) => void handleSubmit(event)} className="mt-4">
        <label className="text-sm font-medium text-haze" htmlFor="edit-channel-name">
          Nome
        </label>
        <Input
          ref={nameRef}
          id="edit-channel-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-2"
        />
        {error ? <p className="mt-2 text-sm text-coral">{error}</p> : null}
        <div className="mt-5 flex flex-wrap justify-between gap-2">
          <Button
            type="button"
            variant="danger"
            disabled={pending}
            onClick={() => void handleDelete()}
          >
            Excluir
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={pending}>
              Salvar
            </Button>
          </div>
        </div>
      </form>
    </AppDialog>
  );
}
