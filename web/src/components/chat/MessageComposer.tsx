import { useState, type FormEvent, type KeyboardEvent } from "react";
import type { ApiResult } from "../../../../shared/api.ts";
import { parseMessageText } from "../../../../shared/community.ts";
import { Button } from "../ui/button.tsx";

type MessageComposerProps = {
  onSend: (text: string) => Promise<ApiResult<void>>;
  onRetry: (clientNonce: string) => Promise<ApiResult<void>>;
  failedNonce: string | null;
};

export function MessageComposer({ onSend, onRetry, failedNonce }: MessageComposerProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  }

  return (
    <div className="border-t border-haze/10 p-3">
      <form onSubmit={(event) => void handleSubmit(event)} className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escreva uma mensagem"
          aria-label="Mensagem"
          rows={2}
          className="focus-ring min-h-11 max-h-32 w-full resize-y rounded-xl border border-haze/15 bg-abyss/70 px-3 py-2.5 text-sm text-cloud placeholder:text-haze"
        />
        <Button type="submit" variant="solid" className="shrink-0">
          Enviar
        </Button>
      </form>
      <p className="mt-1.5 text-[11px] text-haze">Enter envia · Shift+Enter nova linha</p>
      {failedNonce ? (
        <Button type="button" className="mt-2" onClick={() => void onRetry(failedNonce)}>
          Tentar de novo
        </Button>
      ) : null}
      {error ? <p className="mt-2 text-xs text-coral">{error}</p> : null}
    </div>
  );
}
