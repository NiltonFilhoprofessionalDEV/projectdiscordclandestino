import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ApiResult, Channel, UpdateChannelInput } from "../../../../shared/api.ts";
import { parseChannelName } from "../../../../shared/community.ts";
import { Button } from "../ui/button.tsx";
import { Input } from "../ui/input.tsx";
import { AppDialog } from "../shell/AppDialog.tsx";

type EditChannelDialogProps = {
  channel: Channel | null;
  onClose: () => void;
  onUpdate: (channelId: Channel["id"], input: UpdateChannelInput) => Promise<ApiResult<Channel>>;
  onUpdated: () => void;
};

export function EditChannelDialog({
  channel,
  onClose,
  onUpdate,
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

  return (
    <AppDialog
      open={channel !== null}
      titleId="edit-channel-title"
      title="Editar canal"
      description="Renomeie o canal selecionado."
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
        <div className="mt-5 flex gap-2">
          <Button type="button" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="solid" className="flex-1" disabled={pending}>
            Salvar
          </Button>
        </div>
      </form>
    </AppDialog>
  );
}
