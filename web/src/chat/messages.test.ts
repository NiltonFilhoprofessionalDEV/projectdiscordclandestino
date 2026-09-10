import { describe, expect, it } from "vitest";
import type { ChannelId } from "../../../shared/community.ts";
import { reverseNewestFirst, upsertMessages, type ChatMessage } from "./messages.ts";

const channel = "channel-1" as ChannelId;

function msg(partial: Partial<ChatMessage> & Pick<ChatMessage, "id">): ChatMessage {
  return {
    channelId: channel,
    authorId: "user-1",
    displayName: "Ana",
    avatarUrl: null,
    content: "oi",
    createdAt: "2026-09-09T12:00:00.000Z",
    clientNonce: partial.id,
    delivery: "sent",
    ...partial,
  };
}

describe("reverseNewestFirst", () => {
  it("reverses a newest-first query so the list renders oldest to newest", () => {
    const newestFirst = [msg({ id: "b", createdAt: "2026-09-09T13:00:00.000Z" }), msg({ id: "a" })];
    expect(reverseNewestFirst(newestFirst).map((item) => item.id)).toEqual(["a", "b"]);
  });
});

describe("upsertMessages", () => {
  it("deduplicates by message id when realtime repeats an insert", () => {
    const first = msg({ id: "m1", content: "hello" });
    const merged = upsertMessages([first], [msg({ id: "m1", content: "hello" })]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.id).toBe("m1");
  });

  it("replaces an optimistic row with the persisted id using author+nonce", () => {
    const optimistic = msg({
      id: "optimistic:nonce-1",
      clientNonce: "nonce-1",
      delivery: "sending",
    });
    const persisted = msg({
      id: "db-1",
      clientNonce: "nonce-1",
      delivery: "sent",
    });
    const merged = upsertMessages([optimistic], [persisted]);
    expect(merged.map((item) => item.id)).toEqual(["db-1"]);
    expect(merged[0]?.delivery).toBe("sent");
  });

  it("keeps sent when a later sending echo arrives for the same id", () => {
    const sent = msg({ id: "m1", delivery: "sent" });
    const echo = msg({ id: "m1", delivery: "sending" });
    expect(upsertMessages([sent], [echo])[0]?.delivery).toBe("sent");
  });

  it("sorts by created_at then id so equal timestamps stay stable", () => {
    const later = msg({ id: "z", createdAt: "2026-09-09T12:00:00.000Z" });
    const earlier = msg({ id: "a", createdAt: "2026-09-09T12:00:00.000Z" });
    expect(upsertMessages([later], [earlier]).map((item) => item.id)).toEqual(["a", "z"]);
  });
});
