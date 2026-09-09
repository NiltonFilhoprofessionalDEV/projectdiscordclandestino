import type { Ref } from "react";
import { lastFailedNonce } from "../../chat/messages.ts";
import type { useChat } from "../../hooks/useChat.ts";
import { cn } from "../../lib/utils.ts";
import { MessageComposer } from "./MessageComposer.tsx";
import { MessageList } from "./MessageList.tsx";

type ChatPanelProps = {
  chat: ReturnType<typeof useChat>;
  headingId?: string;
  headingRef?: Ref<HTMLHeadingElement>;
  title?: string;
  embedded?: boolean;
  showWelcome?: boolean;
};

export function ChatPanel({
  chat,
  headingId,
  headingRef,
  title = "Conversa",
  embedded = false,
  showWelcome = true,
}: ChatPanelProps) {
  const failedNonce = lastFailedNonce(chat.messages);
  const channelLabel = title.replace(/^#\s*/, "").trim() || "geral";

  return (
    <section
      className={cn(
        "flex h-full min-h-0 flex-col bg-night",
        embedded ? "bg-transparent" : "border-r-0",
      )}
    >
      {embedded ? null : (
        <header className="border-b border-white/[0.07] px-5 py-4">
          <h2
            id={headingId}
            ref={headingRef}
            tabIndex={headingRef ? -1 : undefined}
            className="font-display text-lg font-bold text-cloud outline-none"
          >
            #{channelLabel}
          </h2>
          <p className="mt-1 text-xs text-haze">
            Conversas aleatórias, zoeira, novidades e muito mais!
          </p>
        </header>
      )}
      <MessageList
        messages={chat.messages}
        status={chat.status}
        hasMore={chat.hasMore}
        olderError={chat.olderError}
        channelName={channelLabel}
        showWelcome={showWelcome}
        onLoadOlder={chat.loadOlder}
        onRetry={(clientNonce) => void chat.retry(clientNonce)}
      />
      <MessageComposer onSend={chat.send} onRetry={chat.retry} failedNonce={failedNonce} />
    </section>
  );
}
