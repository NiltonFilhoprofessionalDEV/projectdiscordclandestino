import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Smile } from "lucide-react";
import type { ApiResult } from "../../../../shared/api.ts";
import { parseMessageText } from "../../../../shared/community.ts";
import { CHAT_EMOJIS, insertEmojiAt } from "../../chat/emojis.ts";
import { Button } from "../ui/button.tsx";

type MessageComposerProps = {
  onSend: (text: string) => Promise<ApiResult<void>>;
  onRetry: (clientNonce: string) => Promise<ApiResult<void>>;
  failedNonce: string | null;
};

export function MessageComposer({ onSend, onRetry, failedNonce }: MessageComposerProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) {
      return;
    }
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (pickerRef.current?.contains(target)) {
        return;
      }
      setPickerOpen(false);
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [pickerOpen]);

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
    setPickerOpen(false);
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

  function insertEmoji(emoji: string) {
    const area = textareaRef.current;
    const start = area?.selectionStart ?? text.length;
    const end = area?.selectionEnd ?? start;
    const next = insertEmojiAt(text, emoji, start, end);
    setText(next.value);
    requestAnimationFrame(() => {
      const node = textareaRef.current;
      if (!node) {
        return;
      }
      node.focus();
      node.setSelectionRange(next.caret, next.caret);
    });
  }

  return (
    <div className="relative border-t border-haze/10 p-3">
      {pickerOpen ? (
        <div
          ref={pickerRef}
          className="absolute right-3 bottom-[calc(100%-0.25rem)] z-20 w-[min(100%-1.5rem,18rem)] rounded-2xl border border-haze/15 bg-deck p-2 shadow-xl"
          role="listbox"
          aria-label="Emojis"
        >
          <div className="grid max-h-44 grid-cols-8 gap-1 overflow-y-auto">
            {CHAT_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                role="option"
                className="focus-ring flex size-8 items-center justify-center rounded-lg text-lg hover:bg-white/10"
                aria-label={`Inserir emoji ${emoji}`}
                onClick={() => insertEmoji(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <form onSubmit={(event) => void handleSubmit(event)} className="flex items-end gap-2">
        <div className="relative min-w-0 flex-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escreva uma mensagem"
            aria-label="Mensagem"
            rows={2}
            className="focus-ring min-h-11 max-h-32 w-full resize-y rounded-xl border border-haze/15 bg-abyss/70 px-3 py-2.5 pr-11 text-sm text-cloud placeholder:text-haze"
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="absolute top-1.5 right-1.5 size-8"
            aria-label={pickerOpen ? "Fechar emojis" : "Abrir emojis"}
            aria-expanded={pickerOpen}
            onClick={() => setPickerOpen((current) => !current)}
          >
            <Smile className="size-4" />
          </Button>
        </div>
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
