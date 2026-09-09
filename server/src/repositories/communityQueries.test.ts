import { describe, expect, it, vi } from "vitest";
import { listCommunities } from "./communityQueries.ts";

describe("listCommunities", () => {
  it("maps membership query errors instead of ignoring them", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const client = {
      from(table: string) {
        if (table === "communities") {
          return {
            select() {
              return {
                order() {
                  return Promise.resolve({ data: [], error: null });
                },
              };
            },
          };
        }
        return {
          select() {
            return {
              eq() {
                return Promise.resolve({
                  data: null,
                  error: { code: "XX000", message: "memberships failed" },
                });
              },
            };
          },
        };
      },
    };

    await expect(listCommunities(client as never, "user-1")).resolves.toEqual({
      ok: false,
      error: {
        code: "INTERNAL",
        message: "Não foi possível concluir a operação.",
      },
    });
  });
});
