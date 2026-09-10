import { useLayoutEffect, useRef, type UIEvent } from "react";
import type { ChatMessage } from "../../hooks/useChat.ts";
import { splitMessageLinks } from "../../chat/messageLinks.ts";
import { initials } from "../../lib/utils.ts";
import { Button } from "../ui/button.tsx";
import { Loading } from "../ui/loading.tsx";
import { useProfilePeek } from "../../profile/ProfilePeek.tsx";
import { WelcomeBanner } from "./WelcomeBanner.tsx";

type MessageListProps = {
  messages: ChatMessage[];
  status: "idle" | "loading" | "ready" | "error";
  hasMore: boolean;
  olderError: string | null;
  channelName?: string;
  showWelcome?: boolean;
  onLoadOlder: () => Promise<void>;
  onRetry: (clientNonce: string) => void;
};

const NEAR_BOTTOM_PX = 96;

function formatMessageWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfMessage = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((startOfToday.getTime() - startOfMessage.getTime()) / 86_400_000);
  if (dayDiff === 0) {
    return `Hoje às ${time}`;
  }
  if (dayDiff === 1) {
    return `Ontem às ${time}`;
  }
  const day = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `${day} às ${time}`;
}

function MessageContent({ content }: { content: string }) {
  return (
    <>
      {splitMessageLinks(content).map((part, index) =>
        part.type === "link" ? (
          <a
            key={`${part.href}-${index}`}
            href={part.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-electric underline-offset-2 hover:underline"
          >
            {part.value}
          </a>
        ) : (
          <span key={`t-${index}`}>{part.value}</span>
        ),
      )}
    </>
  );
}

function MessageStatus({
  message,
  onRetry,
}: {
  message: ChatMessage;
  onRetry: (clientNonce: string) => void;
}) {
  if (message.delivery === "sending") {
    return <p className="mt-1 text-[11px] text-haze">Enviando…</p>;
  }
  if (message.delivery === "failed") {
    return (
      <button
        type="button"
        className="mt-1 text-[11px] font-semibold text-coral underline-offset-2 transition duration-150 ease-out hover:underline"
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
  const peek = useProfilePeek();
  return (
    <article className="group -mx-2 flex gap-3 rounded-lg px-2 py-1.5 transition duration-150 hover:bg-white/[0.03]">
      <button
        type="button"
        className="mt-0.5 flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-deck text-[11px] font-semibold text-cloud ring-1 ring-white/[0.06]"
        aria-label={`Ver perfil de ${message.displayName}`}
        onClick={() => peek.openUser(message.authorId)}
      >
        {message.avatarUrl ? (
          <img
            src={message.avatarUrl}
            alt=""
            className="size-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          initials(message.displayName)
        )}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p className="text-sm font-semibold text-electric">{message.displayName}</p>
          <time className="text-[11px] text-muted" dateTime={message.createdAt}>
            {formatMessageWhen(message.createdAt)}
          </time>
        </div>
        <p className="mt-0.5 wrap-break-word whitespace-pre-wrap text-[15px] leading-relaxed text-cloud">
          <MessageContent content={message.content} />
        </p>
        <MessageStatus message={message} onRetry={onRetry} />
      </div>
    </article>
  );
}

function MessageBody({
  messages,
  status,
  onRetry,
}: Pick<MessageListProps, "messages" | "status" | "onRetry">) {
  if (status === "loading" || status === "idle") {
    return <Loading label="Carregando conversa…" />;
  }
  if (status === "error") {
    return <p className="text-sm text-coral">Não foi possível carregar as mensagens.</p>;
  }
  if (messages.length === 0) {
    return <p className="px-1 text-sm text-haze">Ninguém escreveu ainda. Comece a conversa.</p>;
  }
  return (
    <div className="flex flex-col gap-0.5">
      {messages.map((message) => (
        <MessageArticle key={message.id} message={message} onRetry={onRetry} />
      ))}
    </div>
  );
}

function isNearBottom(el: HTMLElement): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR_BOTTOM_PX;
}

function scrollToBottom(el: HTMLElement) {
  el.scrollTop = el.scrollHeight;
}

export function MessageList({
  messages,
  status,
  hasMore,
  olderError,
  channelName = "geral",
  showWelcome = false,
  onLoadOlder,
  onRetry,
}: MessageListProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const snapshotRef = useRef({
    status,
    firstId: null as string | null,
    lastId: null as string | null,
    length: 0,
    scrollHeight: 0,
  });

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }

    const firstId = messages[0]?.id ?? null;
    const lastId = messages.at(-1)?.id ?? null;
    const prev = snapshotRef.current;
    const becameReady = status === "ready" && prev.status !== "ready";
    const prepended =
      status === "ready" &&
      prev.length > 0 &&
      messages.length > prev.length &&
      firstId !== prev.firstId &&
      lastId === prev.lastId;
    const appended = status === "ready" && lastId !== null && lastId !== prev.lastId;
    const ownSending = messages.at(-1)?.delivery === "sending";

    if (prepended) {
      el.scrollTop += el.scrollHeight - prev.scrollHeight;
    } else if (becameReady || (appended && (stickToBottomRef.current || ownSending))) {
      scrollToBottom(el);
      stickToBottomRef.current = true;
    }

    snapshotRef.current = {
      status,
      firstId,
      lastId,
      length: messages.length,
      scrollHeight: el.scrollHeight,
    };
  }, [messages, status]);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const content = contentRef.current;
    if (!scroller || !content || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(() => {
      if (stickToBottomRef.current) {
        scrollToBottom(scroller);
      }
      snapshotRef.current = {
        ...snapshotRef.current,
        scrollHeight: scroller.scrollHeight,
      };
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    stickToBottomRef.current = isNearBottom(event.currentTarget);
  }

  return (
    <div
      ref={scrollerRef}
      className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 lg:px-5"
      onScroll={handleScroll}
    >
      <div ref={contentRef} className="flex min-h-full flex-col justify-end gap-4">
        {showWelcome && (status === "ready" || messages.length > 0) ? (
          <WelcomeBanner channelName={channelName} />
        ) : null}
        {hasMore && status === "ready" ? (
          <Button
            type="button"
            variant="secondary"
            className="self-center"
            onClick={() => void onLoadOlder()}
          >
            Ver mensagens anteriores
          </Button>
        ) : null}
        {olderError ? <p className="text-xs text-coral">{olderError}</p> : null}
        <MessageBody messages={messages} status={status} onRetry={onRetry} />
      </div>
    </div>
  );
}
