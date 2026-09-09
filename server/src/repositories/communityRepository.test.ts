import { describe, expect, it, vi } from "vitest";
import { createCommunityRepository } from "./communityRepository.ts";

describe("createCommunityRepository", () => {
  it("maps unexpected throws to INTERNAL without user data", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const repo = createCommunityRepository({
      from() {
        throw new Error("connection failed for user-1@example.test");
      },
    } as never);

    await expect(repo.listCommunities("user-1")).resolves.toEqual({
      ok: false,
      error: {
        code: "INTERNAL",
        message: "Não foi possível concluir a operação.",
      },
    });
  });
});
