import { useEffect, useRef, useState, type RefObject } from "react";
import { MessageCircle, X } from "lucide-react";
import type { ChannelId } from "../../../../shared/community.ts";
import { focusVoiceChatDrawer } from "../../chat/drawerFocus.ts";
import { countUnseen, seenIdsFrom } from "../../chat/unseen.ts";
import { useAuth } from "../../auth/useAuth.ts";
import { useChat } from "../../hooks/useChat.ts";
import { playMessageSound } from "../../lib/sounds.ts";
import { readVoiceChatOpen, writeVoiceChatOpen } from "../../lib/storage.ts";
import { cn } from "../../lib/utils.ts";
import { Button } from "../ui/button.tsx";
import { ChatPanel } from "./ChatPanel.tsx";

const PANEL_ID = "voice-chat-panel";
const HEADING_ID = "voice-chat-heading";

function useVoiceChatUnseen(
  channelId: ChannelId | null,
  open: boolean,
  messages: ReturnType<typeof useChat>["messages"],
  status: ReturnType<typeof useChat>["status"],
  viewerId: string | null,
) {
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const bootstrapped = useRef(false);
  const previousUnseen = useRef(0);

  useEffect(() => {
    bootstrapped.current = false;
    previousUnseen.current = 0;
    setSeen(new Set());
  }, [channelId]);

  useEffect(() => {
    if (status !== "ready") {
      return;
    }
    if (!bootstrapped.current) {
      setSeen(seenIdsFrom(messages));
      bootstrapped.current = true;
      return;
    }
    if (open) {
      setSeen(seenIdsFrom(messages));
    }
  }, [messages, open, status]);

  const unseen = countUnseen(messages, seen, !open, viewerId);

  useEffect(() => {
    if (!bootstrapped.current || open) {
      previousUnseen.current = unseen;
      return;
    }
    if (unseen > previousUnseen.current) {
      playMessageSound();
    }
    previousUnseen.current = unseen;
  }, [open, unseen]);

  return unseen;
}

function useVoiceChatFocus(open: boolean) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<"open" | "close" | null>(null);

  useEffect(() => {
    if (pendingFocus.current === "open" && open) {
      pendingFocus.current = null;
      focusVoiceChatDrawer(true, headingRef, triggerRef);
    }
    if (pendingFocus.current === "close" && !open) {
      pendingFocus.current = null;
      focusVoiceChatDrawer(false, headingRef, triggerRef);
    }
  }, [open]);

  return { headingRef, triggerRef, pendingFocus };
}

function UnseenBadge({ unseen }: { unseen: number }) {
  if (unseen <= 0) {
    return null;
  }
  return (
    <span
      className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-coral text-[10px] font-bold text-white ring-2 ring-night"
      aria-hidden
    >
      {unseen > 9 ? "9+" : unseen}
    </span>
  );
}

function VoiceChatFrame({
  open,
  unseen,
  chat,
  headingRef,
  triggerRef,
  onClose,
  onOpen,
}: {
  open: boolean;
  unseen: number;
  chat: ReturnType<typeof useChat>;
  headingRef: RefObject<HTMLHeadingElement | null>;
  triggerRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onOpen: () => void;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {open ? (
        <div
          id={PANEL_ID}
          className="pointer-events-auto absolute inset-y-3 right-3 flex w-[min(100%-1.5rem,22rem)] flex-col overflow-hidden rounded-2xl border border-haze/15 bg-night/95 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-md"
        >
          <header className="flex items-center gap-2 border-b border-haze/10 px-3 py-2.5">
            <h2
              id={HEADING_ID}
              ref={headingRef}
              tabIndex={-1}
              className="min-w-0 flex-1 truncate font-display text-base text-cloud outline-none"
            >
              Chat
            </h2>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8 shrink-0"
              aria-label="Fechar chat"
              onClick={onClose}
            >
              <X className="size-4" />
            </Button>
          </header>
          <div className="flex min-h-0 flex-1 flex-col">
            <ChatPanel chat={chat} embedded />
          </div>
        </div>
      ) : (
        <div className="pointer-events-auto absolute right-4 bottom-4">
          <Button
            ref={triggerRef}
            type="button"
            variant="live"
            size="icon"
            className={cn("relative size-12 rounded-full shadow-lg")}
            aria-expanded={false}
            aria-controls={PANEL_ID}
            aria-label={unseen > 0 ? `Abrir chat, ${unseen} mensagens novas` : "Abrir chat"}
            onClick={onOpen}
          >
            <MessageCircle className="size-5" />
            <UnseenBadge unseen={unseen} />
          </Button>
        </div>
      )}
    </div>
  );
}

export function VoiceChatDrawer({ channelId }: { channelId: ChannelId | null }) {
  const { user } = useAuth();
  const chat = useChat(channelId);
  const [open, setOpen] = useState(readVoiceChatOpen);
  const { headingRef, triggerRef, pendingFocus } = useVoiceChatFocus(open);
  const unseen = useVoiceChatUnseen(
    channelId,
    open,
    chat.messages,
    chat.status,
    user?.id ?? null,
  );

  function setChatOpen(next: boolean) {
    writeVoiceChatOpen(next);
    pendingFocus.current = next ? "open" : "close";
    setOpen(next);
  }

  return (
    <VoiceChatFrame
      open={open}
      unseen={unseen}
      chat={chat}
      headingRef={headingRef}
      triggerRef={triggerRef}
      onOpen={() => setChatOpen(true)}
      onClose={() => setChatOpen(false)}
    />
  );
}
