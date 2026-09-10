import { describe, expect, it } from "vitest";
import type { ChannelId } from "../../../shared/community.ts";
import type { ChatMessage } from "./messages.ts";
import { persistOptimistic } from "./persist.ts";
import type { MessageRecord } from "./query.ts";

function optimistic(channelId: string): ChatMessage {
  return {
    id: "optimistic:n1",
    channelId: channelId as ChannelId,
    authorId: "u1",
    displayName: "Ana",
    avatarUrl: null,
    content: "oi",
    createdAt: "2026-09-09T12:00:00.000Z",
    clientNonce: "n1",
    delivery: "sending",
  };
}

const persisted: MessageRecord = {
  id: "db-1",
  channel_id: "chan-a",
  author_id: "u1",
  content: "oi",
  client_nonce: "n1",
  created_at: "2026-09-09T12:00:00.000Z",
  deleted_at: null,
  edited_at: null,
};

describe("persistOptimistic", () => {
  it("does not merge the result into another channel after switch", async () => {
    const updates: ChatMessage[][] = [];
    let active = "chan-a";
    const result = await persistOptimistic(
      optimistic("chan-a"),
      (update) => {
        updates.push(update([]));
      },
      () => active === "chan-a",
      async () => {
        active = "chan-b";
        return { ok: true, data: persisted };
      },
    );
    expect(result).toEqual({ ok: true, data: undefined });
    expect(updates).toEqual([]);
  });

  it("marks the optimistic row sent when still on the same channel", async () => {
    const updates: ChatMessage[][] = [];
    await persistOptimistic(
      optimistic("chan-a"),
      (update) => {
        updates.push(update([optimistic("chan-a")]));
      },
      () => true,
      async () => ({ ok: true, data: persisted }),
    );
    expect(updates[0]?.map((message) => message.id)).toEqual(["db-1"]);
    expect(updates[0]?.[0]?.delivery).toBe("sent");
  });
});
