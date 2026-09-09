import { describe, expect, it, vi } from "vitest";
import { mapRepositoryError } from "./errors.ts";

describe("mapRepositoryError", () => {
  it("maps unexpected postgres errors to INTERNAL without leaking details", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(mapRepositoryError({ code: "XX000", message: "secret user@host" })).toEqual({
      ok: false,
      error: {
        code: "INTERNAL",
        message: "Não foi possível concluir a operação.",
      },
    });
  });
});
