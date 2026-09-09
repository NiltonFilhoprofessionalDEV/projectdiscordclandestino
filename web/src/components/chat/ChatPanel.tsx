import type { Ref } from "react";
import { lastFailedNonce } from "../../chat/messages.ts";
import type { useChat } from "../../hooks/useChat.ts";
import { MessageComposer } from "./MessageComposer.tsx";
import { MessageList } from "./MessageList.tsx";

type ChatPanelProps = {
  chat: ReturnType<typeof useChat>;
  headingId?: string;
  headingRef?: Ref<HTMLHeadingElement>;
  title?: string;
};

export function ChatPanel({
  chat,
  headingId,
  headingRef,
  title = "Conversa",
}: ChatPanelProps) {
  const failedNonce = lastFailedNonce(chat.messages);

  return (
    <section className="surface flex h-full min-h-0 flex-col border-y-0 border-r-0">
      <header className="border-b border-haze/10 px-5 py-5">
        <h2
          id={headingId}
          ref={headingRef}
          tabIndex={headingRef ? -1 : undefined}
          className="font-display text-lg text-cloud outline-none"
        >
          {title}
        </h2>
        <p className="mt-1 text-xs text-haze">Mensagens desta sala</p>
      </header>
      <MessageList
        messages={chat.messages}
        status={chat.status}
        hasMore={chat.hasMore}
        onLoadOlder={chat.loadOlder}
        onRetry={(clientNonce) => void chat.retry(clientNonce)}
      />
      <MessageComposer onSend={chat.send} onRetry={chat.retry} failedNonce={failedNonce} />
    </section>
  );
}
