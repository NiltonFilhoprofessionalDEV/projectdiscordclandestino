import { useEffect, useRef, useState, type RefObject } from "react";
import type { ChannelId } from "../../../../shared/community.ts";
import { focusVoiceChatDrawer } from "../../chat/drawerFocus.ts";
import { countUnseen, seenIdsFrom } from "../../chat/unseen.ts";
import { useChat } from "../../hooks/useChat.ts";
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
) {
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const bootstrapped = useRef(false);

  useEffect(() => {
    bootstrapped.current = false;
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

  return countUnseen(messages, seen, !open);
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
    <div className="pointer-events-none absolute inset-0 z-10 flex items-end justify-end">
      <div
        className={cn(
          "pointer-events-auto flex max-h-full flex-col",
          open ? "h-full w-full md:w-80" : "p-3",
        )}
      >
        <div className="flex items-center gap-2 p-3">
          <Button
            ref={triggerRef}
            type="button"
            variant="live"
            className="w-full"
            aria-expanded={open}
            aria-controls={PANEL_ID}
            onClick={onToggle}
          >
            Chat
            {unseen > 0 ? (
              <span className="rounded-full bg-coral px-2 py-0.5 text-[11px] text-white">{unseen}</span>
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
  const chat = useChat(channelId);
  const [open, setOpen] = useState(readVoiceChatOpen);
  const { headingRef, triggerRef, pendingFocus } = useVoiceChatFocus(open);
  const unseen = useVoiceChatUnseen(channelId, open, chat.messages, chat.status);

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
