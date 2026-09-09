import { useEffect, useRef, useState, type RefObject } from "react";
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

function VoiceChatFrame({
  open,
  unseen,
  chat,
  headingRef,
  triggerRef,
  onToggle,
}: {
  open: boolean;
  unseen: number;
  chat: ReturnType<typeof useChat>;
  headingRef: RefObject<HTMLHeadingElement | null>;
  triggerRef: RefObject<HTMLButtonElement | null>;
  onToggle: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex max-w-full items-stretch justify-end">
      <div
        className={cn(
          "pointer-events-auto flex max-h-full flex-col border-l border-haze/10 bg-night/95 backdrop-blur-md",
          open ? "h-full w-full md:w-80" : "h-auto self-end p-3",
        )}
      >
        <div className="flex items-center gap-2 p-3">
          <Button
            ref={triggerRef}
            type="button"
            variant="live"
            className="relative w-full"
            aria-expanded={open}
            aria-controls={PANEL_ID}
            aria-label={unseen > 0 ? `Chat, ${unseen} mensagens novas` : "Chat"}
            onClick={onToggle}
          >
            Chat
            {unseen > 0 ? (
              <span
                className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-coral text-[10px] font-bold text-white ring-2 ring-night"
                aria-hidden
              >
                {unseen > 9 ? "9+" : unseen}
              </span>
            ) : null}
          </Button>
        </div>
        <div id={PANEL_ID} hidden={!open} className={open ? "flex min-h-0 flex-1 flex-col" : undefined}>
          {open ? (
            <ChatPanel chat={chat} headingId={HEADING_ID} headingRef={headingRef} title="Chat" />
          ) : null}
        </div>
      </div>
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

  return (
    <VoiceChatFrame
      open={open}
      unseen={unseen}
      chat={chat}
      headingRef={headingRef}
      triggerRef={triggerRef}
      onToggle={() => {
        const next = !open;
        writeVoiceChatOpen(next);
        pendingFocus.current = next ? "open" : "close";
        setOpen(next);
      }}
    />
  );
}
