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

import { VoiceChatDrawer } from "./VoiceChatDrawer.tsx";

describe("VoiceChatDrawer", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    localStorage.clear();
  });

  it("focuses the heading after the drawer has opened, not from a closed ref snapshot", async () => {
    render(<VoiceChatDrawer channelId={"companion-1" as ChannelId} />);
    const trigger = screen.getByRole("button", { name: "Chat" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("heading", { name: "Chat" })).toBeNull();

    await act(async () => {
      trigger.click();
    });
    const heading = screen.getByRole("heading", { name: "Chat" });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    await waitFor(() => {
      expect(document.activeElement).toBe(heading);
    });
  });
});
