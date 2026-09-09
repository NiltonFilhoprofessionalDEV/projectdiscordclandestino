import { describe, expect, it } from "vitest";
import { parseInviteBody } from "./inviteInput.ts";

describe("parseInviteBody", () => {
  it("treats a missing body as an empty invite", () => {
    expect(parseInviteBody(null)).toEqual({ ok: true, data: {} });
    expect(parseInviteBody(undefined)).toEqual({ ok: true, data: {} });
  });

  it("rejects a non-ISO expiresAt", () => {
    expect(parseInviteBody({ expiresAt: "amanhã" })).toEqual({
      ok: false,
      error: { code: "VALIDATION", message: "Data de expiração inválida." },
    });
  });

  it("rejects a non-positive or non-integer maxUses", () => {
    expect(parseInviteBody({ maxUses: 0 })).toEqual({
      ok: false,
      error: { code: "VALIDATION", message: "Limite de usos inválido." },
    });
    expect(parseInviteBody({ maxUses: 1.5 })).toEqual({
      ok: false,
      error: { code: "VALIDATION", message: "Limite de usos inválido." },
    });
  });

  it("accepts an ISO expiresAt and a positive integer maxUses", () => {
    expect(
      parseInviteBody({
        expiresAt: "2026-12-01T00:00:00.000Z",
        maxUses: 3,
      }),
    ).toEqual({
      ok: true,
      data: { expiresAt: "2026-12-01T00:00:00.000Z", maxUses: 3 },
    });
  });
});
