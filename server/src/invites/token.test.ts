import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { generateInviteToken, hashInviteToken } from "./token.ts";

describe("invite tokens", () => {
  it("returns 32 random bytes as base64url and a sha256 hash of the raw token", () => {
    const { raw, hash } = generateInviteToken();
    const bytes = Buffer.from(raw, "base64url");

    expect(bytes.length).toBe(32);
    expect(raw).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(hash).toBe(createHash("sha256").update(raw).digest("base64url"));
    expect(hash).not.toBe(raw);
  });

  it("hashes the same raw token to the same digest", () => {
    expect(hashInviteToken("invite-raw")).toBe(
      createHash("sha256").update("invite-raw").digest("base64url"),
    );
  });
});
