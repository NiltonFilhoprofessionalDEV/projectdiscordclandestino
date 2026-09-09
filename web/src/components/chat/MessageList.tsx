import type { ChatMessage } from "../../hooks/useChat.ts";
import { Button } from "../ui/button.tsx";

type MessageListProps = {
  messages: ChatMessage[];
  status: "idle" | "loading" | "ready" | "error";
  hasMore: boolean;
  olderError: string | null;
  onLoadOlder: () => Promise<void>;
  onRetry: (clientNonce: string) => void;
};

function MessageStatus({ message, onRetry }: { message: ChatMessage; onRetry: (clientNonce: string) => void }) {
  if (message.delivery === "sending") {
    return <p className="mt-1 text-[11px] text-haze">Enviando…</p>;
  }
  if (message.delivery === "failed") {
    return (
      <button
        type="button"
        className="mt-1 text-[11px] font-semibold text-coral underline-offset-2 hover:underline"
        onClick={() => onRetry(message.clientNonce)}
      >
        Falhou. Tentar de novo
      </button>
    );
  }
  return null;
}

function MessageArticle({
  message,
  onRetry,
}: {
  message: ChatMessage;
  onRetry: (clientNonce: string) => void;
}) {
  return (
    <article className="rounded-xl bg-abyss/50 px-3 py-2.5">
      <p className="text-xs font-semibold text-[#aab9ff]">{message.displayName}</p>
      <p className="mt-0.5 wrap-break-word text-sm text-cloud">{message.content}</p>
      <MessageStatus message={message} onRetry={onRetry} />
    </article>
  );
}

function MessageBody({
  messages,
  status,
  onRetry,
}: Pick<MessageListProps, "messages" | "status" | "onRetry">) {
  if (status === "loading" || status === "idle") {
    return <p className="text-sm text-haze">Carregando conversa…</p>;
  }
  if (status === "error") {
    return <p className="text-sm text-coral">Não foi possível carregar as mensagens.</p>;
  }
  if (messages.length === 0) {
    return (
      <div className="rounded-xl bg-abyss/55 px-4 py-5">
        <p className="text-sm font-medium text-cloud">Ninguém escreveu ainda.</p>
        <p className="mt-1 text-xs text-haze">Comece a conversa.</p>
      </div>
    );
  }
  return (
    <>
      {messages.map((message) => (
        <MessageArticle key={message.id} message={message} onRetry={onRetry} />
      ))}
    </>
  );
}

export function MessageList({ messages, status, hasMore, olderError, onLoadOlder, onRetry }: MessageListProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-4">
      {hasMore && status === "ready" ? (
        <Button type="button" className="self-center" onClick={() => void onLoadOlder()}>
          Ver mensagens anteriores
        </Button>
      ) : null}
      {olderError ? <p className="text-xs text-coral">{olderError}</p> : null}
      <MessageBody messages={messages} status={status} onRetry={onRetry} />
    </div>
  );
}
