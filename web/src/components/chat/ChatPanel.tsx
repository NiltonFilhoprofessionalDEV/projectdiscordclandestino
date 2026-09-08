import { useState, type FormEvent } from "react";
import type { ChatMessage } from "../../hooks/useChat.ts";
import { Button } from "../ui/button.tsx";
import { Input } from "../ui/input.tsx";

type ChatPanelProps = {
  messages: ChatMessage[];
  onSend: (text: string) => Promise<string | null | void>;
};

export function ChatPanel({ messages, onSend }: ChatPanelProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = await onSend(text);
    if (result) {
      setError(result);
      return;
    }
    setError(null);
    setText("");
  }

  return (
    <section className="surface flex h-full min-h-64 flex-col border-y-0 border-r-0">
      <header className="border-b border-haze/10 px-5 py-5">
        <h2 className="font-display text-lg text-cloud">Conversa</h2>
        <p className="mt-1 text-xs text-haze">Mensagens desta sala</p>
      </header>
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="rounded-xl bg-abyss/55 px-4 py-5">
            <p className="text-sm font-medium text-cloud">Ninguém escreveu ainda.</p>
            <p className="mt-1 text-xs text-haze">Comece a conversa.</p>
          </div>
        ) : (
          messages.map((message) => (
            <article key={message.id} className="rounded-xl bg-abyss/50 px-3 py-2.5">
              <p className="text-xs font-semibold text-[#aab9ff]">{message.displayName}</p>
              <p className="mt-0.5 wrap-break-word text-sm text-cloud">{message.text}</p>
            </article>
          ))
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-haze/10 p-3">
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
      {error ? <p className="px-4 pb-3 text-xs text-coral">{error}</p> : null}
    </section>
  );
}
