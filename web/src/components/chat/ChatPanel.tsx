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
    <section className="flex h-full min-h-64 flex-col border-t border-white/8 lg:border-l lg:border-t-0">
      <header className="px-4 py-3 text-xs tracking-wide text-mist uppercase">Chat</header>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-3">
        {messages.length === 0 ? (
          <p className="text-sm text-mist">Nenhuma mensagem nesta sala.</p>
        ) : (
          messages.map((message) => (
            <p key={message.id} className="text-sm text-fog">
              <span className="text-copper">{message.displayName}:</span> {message.text}
            </p>
          ))
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 p-3">
        <Input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Escrever…"
          className="h-11"
        />
        <Button type="submit" variant="solid">
          Enviar
        </Button>
      </form>
      {error ? <p className="px-4 pb-3 text-xs text-rose-300">{error}</p> : null}
    </section>
  );
}
