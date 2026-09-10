import { describe, expect, it } from "vitest";
import type { ChannelId } from "../../../shared/community.ts";
import type { ChatMessage } from "./messages.ts";
import { loadOlderMessages } from "./older.ts";

const existing: ChatMessage = {
  id: "m1",
  channelId: "chan-a" as ChannelId,
  authorId: "u1",
  displayName: "Ana",
  avatarUrl: null,
  content: "oi",
  createdAt: "2026-09-09T12:00:00.000Z",
  clientNonce: "n1",
  delivery: "sent",
};

describe("loadOlderMessages", () => {
  it("keeps the loaded history when the older page fails", async () => {
    let status: string | null = null;
    let olderError: string | null = null;
    let messages = [existing];
    await loadOlderMessages({
      channelId: "chan-a" as ChannelId,
      messages,
      stillOnChannel: () => true,
      setMessages: (update) => {
        messages = update(messages);
      },
      setHasMore: () => {
        throw new Error("hasMore should stay unchanged on failure");
      },
      setStatus: (value) => {
        status = value;
      },
      setOlderError: (value) => {
        olderError = value;
      },
      fetchPage: async () => ({ ok: false, error: { message: "timeout" } }),
      resolveNames: async () => new Map(),
    });
    expect(status).toBeNull();
    expect(messages).toEqual([existing]);
    expect(olderError).toBe("Não foi possível carregar mensagens anteriores.");
  });
});
