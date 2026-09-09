// @vitest-environment happy-dom
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CommunityId } from "../../../shared/community.ts";
import { useCommunities } from "./useCommunities.ts";

const fetchCommunities = vi.hoisted(() => vi.fn());

vi.mock("../services/api.ts", () => ({
  fetchCommunities: (...args: unknown[]) => fetchCommunities(...args),
  createCommunity: vi.fn(),
  updateCommunity: vi.fn(),
}));

function Probe({ token }: { token: string | null }) {
  const communities = useCommunities(token);
  return (
    <div>
      <span data-testid="status">{communities.status}</span>
      <span data-testid="count">{communities.communities.length}</span>
    </div>
  );
}

describe("useCommunities", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    fetchCommunities.mockReset();
    fetchCommunities.mockResolvedValue({
      ok: true,
      data: [
        {
          id: "c1" as CommunityId,
          name: "Arena",
          slug: "arena",
          visibility: "public",
          role: "owner",
          avatarUrl: null,
          onlineCount: 0,
          activeRooms: [],
        },
      ],
    });
  });

  it("does not fetch until an access token exists after session restore", async () => {
    const { rerender } = render(<Probe token={null} />);
    expect(fetchCommunities).not.toHaveBeenCalled();
    expect(document.querySelector("[data-testid=status]")?.textContent).toBe("idle");

    rerender(<Probe token="tok_restored" />);
    await waitFor(() => {
      expect(fetchCommunities).toHaveBeenCalledTimes(1);
      expect(document.querySelector("[data-testid=status]")?.textContent).toBe("ready");
      expect(document.querySelector("[data-testid=count]")?.textContent).toBe("1");
    });
  });
});
