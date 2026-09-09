import { describe, expect, it, vi } from "vitest";
import { createChannel } from "./channelCommands.ts";

const voiceRow = {
  id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
  community_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  name: "dev",
  type: "voice" as const,
  position: 1,
  companion_text_channel_id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
  created_by: "11111111-1111-1111-1111-111111111111",
  created_at: "2026-09-09T00:00:00.000Z",
};

describe("createChannel", () => {
  it("creates a voice channel through a single create_channel RPC", async () => {
    const from = vi.fn();
    const rpc = vi.fn(async (fn: string) => {
      if (fn === "can_manage_community") {
        return { data: true, error: null };
      }
      if (fn === "create_channel") {
        return { data: voiceRow, error: null };
      }
      return { data: null, error: { code: "PGRST202", message: "unknown" } };
    });

    const result = await createChannel(
      { rpc, from } as never,
      "11111111-1111-1111-1111-111111111111",
      "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      { name: "dev", type: "voice" },
    );

    expect(result.ok).toBe(true);
    expect(rpc).toHaveBeenCalledWith("create_channel", {
      community_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      name: "dev",
      type: "voice",
    });
    expect(from).not.toHaveBeenCalled();
  });
});
