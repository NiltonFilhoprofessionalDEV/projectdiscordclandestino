import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { SendHorizontal, Smile } from "lucide-react";
import type { ApiResult } from "../../../../shared/api.ts";
import { parseMessageText } from "../../../../shared/community.ts";
import { shouldSubmitOnEnter } from "../../chat/composerKeys.ts";
import { CHAT_EMOJIS, insertEmojiAt } from "../../chat/emojis.ts";
import { Button, IconButton } from "../ui/button.tsx";
import { Icon } from "../ui/icon.tsx";
import { Tooltip } from "../ui/tooltip.tsx";

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
  const composerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) {
      return;
    }
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (composerRef.current?.contains(target)) {
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
    if (!shouldSubmitOnEnter(event)) {
      return;
    }
    event.preventDefault();
    void submit();
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
    <div ref={composerRef} className="relative shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1 lg:px-4">
      {pickerOpen ? (
        <div
          className="absolute inset-x-3 bottom-full z-20 mb-2 overflow-hidden rounded-2xl border border-white/[0.08] bg-panel p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.5)]"
          role="listbox"
          aria-label="Emojis"
        >
          <div className="grid grid-cols-8">
            {CHAT_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                role="option"
                className="focus-ring flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl text-base leading-none transition duration-150 ease-out hover:bg-white/[0.08]"
                aria-label={`Inserir emoji ${emoji}`}
                onClick={() => insertEmoji(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="flex items-end gap-1 rounded-2xl border border-white/[0.08] bg-ink px-2 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition duration-150 focus-within:border-electric/45 focus-within:ring-2 focus-within:ring-electric/15"
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escreva uma mensagem..."
          aria-label="Mensagem"
          rows={2}
          maxLength={2000}
          className="max-h-40 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-2 py-2.5 text-base text-cloud outline-none placeholder:text-muted"
        />
        <Tooltip label={pickerOpen ? "Fechar emojis" : "Emojis"}>
          <IconButton
            type="button"
            size="iconSm"
            variant="ghost"
            className="mb-0.5 size-9 min-h-9 min-w-9 shrink-0"
            aria-label={pickerOpen ? "Fechar emojis" : "Abrir emojis"}
            aria-expanded={pickerOpen}
            onClick={() => setPickerOpen((current) => !current)}
          >
            <Icon icon={Smile} size="action" />
          </IconButton>
        </Tooltip>
        <Tooltip label="Enviar">
          <IconButton
            type="submit"
            variant="send"
            className="size-11 shrink-0 rounded-[14px]"
            aria-label="Enviar mensagem"
          >
            <Icon icon={SendHorizontal} />
          </IconButton>
        </Tooltip>
      </form>
      <p className="mt-1.5 hidden px-1 text-[11px] text-muted sm:block">
        Enter envia · Shift+Enter nova linha · até 2000 caracteres
      </p>
      {failedNonce ? (
        <Button type="button" variant="secondary" className="mt-2" onClick={() => void onRetry(failedNonce)}>
          Tentar de novo
        </Button>
      ) : null}
      {error ? <p className="mt-2 text-xs text-coral">{error}</p> : null}
    </div>
  );
}
