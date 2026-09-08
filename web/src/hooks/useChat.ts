import { useCallback, useEffect, useState } from "react";
import { RoomEvent, type Room } from "livekit-client";
import { parseChatPayload, parseChatText, type ChatPayload } from "../../../shared/chat.ts";

export type ChatMessage = ChatPayload & { id: string; at: number };

const decoder = new TextDecoder();
const encoder = new TextEncoder();

export function useChat(room: Room | null, displayName: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!room) {
      setMessages([]);
      return;
    }

    const onData = (payload: Uint8Array) => {
      try {
        const parsed = parseChatPayload(JSON.parse(decoder.decode(payload)));
        if (!parsed) {
          return;
        }
        setMessages((current) => [
          ...current,
          { ...parsed, id: crypto.randomUUID(), at: Date.now() },
        ]);
      } catch {
        /* ignore malformed packets */
      }
    };

    room.on(RoomEvent.DataReceived, onData);
    return () => {
      room.off(RoomEvent.DataReceived, onData);
    };
  }, [room]);

  const send = useCallback(
    async (raw: string) => {
      if (!room) {
        return;
      }
      const parsed = parseChatText(raw);
      if (!parsed.ok) {
        return parsed.error;
      }
      const payload: ChatPayload = {
        type: "chat",
        text: parsed.value,
        displayName,
      };
      await room.localParticipant.publishData(encoder.encode(JSON.stringify(payload)), {
        reliable: true,
      });
      setMessages((current) => [
        ...current,
        { ...payload, id: crypto.randomUUID(), at: Date.now() },
      ]);
      return null;
    },
    [displayName, room],
  );

  return { messages, send };
}
