import { describe, expect, it } from "vitest";
import type { ChannelId } from "../../../shared/community.ts";
import type { ChatMessage } from "./messages.ts";
import { countUnseen, seenIdsFrom } from "./unseen.ts";

function msg(id: string, delivery: ChatMessage["delivery"] = "sent"): ChatMessage {
  return {
    id,
    channelId: "c" as ChannelId,
    authorId: "u",
    displayName: "Ana",
    content: "oi",
    createdAt: "2026-09-09T12:00:00.000Z",
    clientNonce: id,
    delivery,
  };
}

describe("countUnseen", () => {
  it("is zero while the drawer is open", () => {
    expect(countUnseen([msg("a"), msg("b")], new Set(), false)).toBe(0);
  });

  it("counts sent realtime messages that arrived while closed", () => {
    const seen = new Set(["a"]);
    expect(countUnseen([msg("a"), msg("b"), msg("c")], seen, true)).toBe(2);
  });

  it("ignores optimistic sending rows while closed", () => {
    expect(countUnseen([msg("temp", "sending")], new Set(), true)).toBe(0);
  });
});

describe("seenIdsFrom", () => {
  it("snapshots current message ids when the drawer is opened", () => {
    expect(seenIdsFrom([msg("a"), msg("b")])).toEqual(new Set(["a", "b"]));
  });
});
