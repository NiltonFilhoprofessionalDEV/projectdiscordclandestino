// @vitest-environment happy-dom
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChannelId } from "../../../../shared/community.ts";

const chat = vi.hoisted(() => ({
  messages: [] as { id: string }[],
  status: "ready" as const,
  hasMore: false,
  olderError: null as string | null,
  loadOlder: async () => undefined,
  send: async () => ({ ok: true as const, data: undefined }),
  retry: async () => ({ ok: true as const, data: undefined }),
}));

vi.mock("../../hooks/useChat.ts", () => ({
  useChat: () => chat,
}));

vi.mock("../../auth/useAuth.ts", () => ({
  useAuth: () => ({ user: { id: "viewer-1" } }),
}));

import { VoiceChatDrawer } from "./VoiceChatDrawer.tsx";

describe("VoiceChatDrawer", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    localStorage.clear();
  });

  it("opens from the floating button and closes with the header control", async () => {
    render(<VoiceChatDrawer channelId={"companion-1" as ChannelId} />);
    const trigger = screen.getByRole("button", { name: "Abrir chat" });
    expect(screen.queryByRole("heading", { name: "Chat" })).toBeNull();

    await act(async () => {
      trigger.click();
    });
    const heading = screen.getByRole("heading", { name: "Chat" });
    expect(screen.getByRole("button", { name: "Fechar chat" })).toBeTruthy();

    await waitFor(() => {
      expect(document.activeElement).toBe(heading);
    });

    await act(async () => {
      screen.getByRole("button", { name: "Fechar chat" }).click();
    });
    expect(screen.queryByRole("heading", { name: "Chat" })).toBeNull();
    expect(screen.getByRole("button", { name: "Abrir chat" })).toBeTruthy();
  });
});
