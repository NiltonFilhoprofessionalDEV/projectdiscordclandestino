// @vitest-environment happy-dom
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChannelId } from "../../../shared/community.ts";
import type { MessageRecord } from "../chat/query.ts";

const auth = vi.hoisted(() => ({
  session: null,
  user: { id: "user-1" },
  profile: {
    id: "user-1",
    display_name: "Ana",
    avatar_url: null,
    created_at: "2026-09-09T00:00:00.000Z",
    updated_at: "2026-09-09T00:00:00.000Z",
  },
  loading: false,
  error: null,
  signOut: async () => undefined,
  updateProfile: async () => null,
}));

const fetchMessagePage = vi.hoisted(() => vi.fn());
const insertChannelMessage = vi.hoisted(() => vi.fn());
const subscribeMessageInserts = vi.hoisted(() => vi.fn(() => () => undefined));
const fetchDisplayNames = vi.hoisted(() =>
  vi.fn(async (_authorIds: string[], cache: Map<string, string>) => cache),
);

vi.mock("../services/supabase.ts", async () => await import("../test/supabase.stub.ts"));

vi.mock("../auth/useAuth.ts", () => ({
  useAuth: () => auth,
}));

vi.mock("../chat/query.ts", () => ({
  toChatMessage: (
    row: MessageRecord,
    displayName: string,
    delivery: "sending" | "sent" | "failed" = "sent",
  ) => ({
    id: row.id,
    channelId: row.channel_id,
    authorId: row.author_id,
    displayName,
    content: row.content,
    createdAt: row.created_at,
    clientNonce: row.client_nonce,
    delivery,
  }),
  fetchMessagePage,
  insertChannelMessage,
  subscribeMessageInserts,
  fetchDisplayNames,
}));

import { useChat } from "./useChat.ts";

const CHANNEL_A = "chan-a" as ChannelId;
const CHANNEL_B = "chan-b" as ChannelId;

function record(id: string, channelId: string, content: string): MessageRecord {
  return {
    id,
    channel_id: channelId,
    author_id: "user-1",
    content,
    client_nonce: id,
    created_at: "2026-09-09T12:00:00.000Z",
    deleted_at: null,
    edited_at: null,
  };
}

function ChatProbe({ channelId }: { channelId: ChannelId }) {
  const chat = useChat(channelId);
  return (
    <div>
      <p>{chat.status}</p>
      <p>{chat.olderError ?? ""}</p>
      <ul>
        {chat.messages.map((message) => (
          <li key={message.id}>{message.content}</li>
        ))}
      </ul>
      <button type="button" onClick={() => void chat.send("msg-a")}>
        send
      </button>
      <button type="button" onClick={() => void chat.loadOlder()}>
        older
      </button>
    </div>
  );
}

function ChannelSwitch() {
  const [channelId, setChannelId] = useState(CHANNEL_A);
  return (
    <>
      <ChatProbe channelId={channelId} />
      <button type="button" onClick={() => setChannelId(CHANNEL_B)}>
        switch
      </button>
    </>
  );
}

describe("useChat", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    fetchMessagePage.mockReset();
    insertChannelMessage.mockReset();
    subscribeMessageInserts.mockReset();
    subscribeMessageInserts.mockReturnValue(() => undefined);
    fetchDisplayNames.mockReset();
    fetchDisplayNames.mockImplementation(async (_authorIds, cache) => cache);
  });

  it("does not show a sent message from the previous channel after switch", async () => {
    let finishInsert: (value: { ok: true; data: MessageRecord }) => void = () => undefined;
    const insertGate = new Promise<{ ok: true; data: MessageRecord }>((resolve) => {
      finishInsert = resolve;
    });
    let insertCalled = false;

    fetchMessagePage.mockImplementation(async (channelId: ChannelId) => {
      if (channelId === CHANNEL_B) {
        return { ok: true, data: [record("b1", CHANNEL_B, "hist-b")] };
      }
      return { ok: true, data: [record("a1", CHANNEL_A, "hist-a")] };
    });
    insertChannelMessage.mockImplementation(async () => {
      insertCalled = true;
      return insertGate;
    });

    render(<ChannelSwitch />);
    await waitFor(() => expect(screen.getByText("hist-a")).toBeTruthy());
    await act(async () => {
      screen.getByRole("button", { name: "send" }).click();
    });
    await waitFor(() => expect(screen.getByText("msg-a")).toBeTruthy());
    await waitFor(() => expect(insertCalled).toBe(true));
    await act(async () => {
      screen.getByRole("button", { name: "switch" }).click();
    });
    await waitFor(() => expect(screen.getByText("hist-b")).toBeTruthy());
    await act(async () => {
      finishInsert({ ok: true, data: record("persisted-a", CHANNEL_A, "msg-a") });
    });
    expect(screen.getByText("hist-b")).toBeTruthy();
    expect(screen.queryByText("msg-a")).toBeNull();
  });

  it("keeps visible history when loadOlder fails", async () => {
    fetchMessagePage.mockImplementation(async (_channelId: ChannelId, cursor: unknown) => {
      if (!cursor) {
        return { ok: true, data: [record("a1", CHANNEL_A, "hist-a")] };
      }
      return { ok: false, error: { message: "timeout" } };
    });

    render(<ChatProbe channelId={CHANNEL_A} />);
    await waitFor(() => expect(screen.getByText("hist-a")).toBeTruthy());
    expect(screen.getByText("ready")).toBeTruthy();
    await act(async () => {
      screen.getByRole("button", { name: "older" }).click();
    });
    await waitFor(() =>
      expect(screen.getByText("Não foi possível carregar mensagens anteriores.")).toBeTruthy(),
    );
    expect(screen.getByText("hist-a")).toBeTruthy();
    expect(screen.getByText("ready")).toBeTruthy();
    expect(screen.queryByText("Não foi possível carregar as mensagens.")).toBeNull();
  });
});
