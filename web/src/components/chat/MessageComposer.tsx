import { useState, type FormEvent } from "react";
import type { ApiResult } from "../../../../shared/api.ts";
import { parseMessageText } from "../../../../shared/community.ts";
import { Button } from "../ui/button.tsx";
import { Input } from "../ui/input.tsx";

type MessageComposerProps = {
  onSend: (text: string) => Promise<ApiResult<void>>;
  onRetry: (clientNonce: string) => Promise<ApiResult<void>>;
  failedNonce: string | null;
};

export function MessageComposer({ onSend, onRetry, failedNonce }: MessageComposerProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseMessageText(text);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    const result = await onSend(parsed.value);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setError(null);
    setText("");
  }

  return (
    <div className="border-t border-haze/10 p-3">
      <form onSubmit={(event) => void handleSubmit(event)} className="flex gap-2">
        <Input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Escreva uma mensagem"
          aria-label="Mensagem"
          className="h-11"
        />
        <Button type="submit" variant="solid">
          Enviar
        </Button>
      </form>
      {failedNonce ? (
        <Button type="button" className="mt-2" onClick={() => void onRetry(failedNonce)}>
          Tentar de novo
        </Button>
      ) : null}
      {error ? <p className="mt-2 text-xs text-coral">{error}</p> : null}
    </div>
  );
}
