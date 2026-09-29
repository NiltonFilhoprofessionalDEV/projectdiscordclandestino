import { describe, expect, it } from "vitest";
import { resolveFocusedShare } from "./screenFocus.ts";

function share(identity: string, isLocal = false) {
  return { identity, isLocal };
}

describe("resolveFocusedShare", () => {
  it("returns null when nobody is sharing", () => {
    expect(resolveFocusedShare([], null)).toBeNull();
  });

  it("keeps the share the user picked", () => {
    const shares = [share("ana"), share("bia")];
    expect(resolveFocusedShare(shares, "bia")?.identity).toBe("bia");
  });

  it("prefers a remote share over the local one by default", () => {
    const shares = [share("me", true), share("ana")];
    expect(resolveFocusedShare(shares, null)?.identity).toBe("ana");
  });

  it("falls back when the picked share has ended", () => {
    const shares = [share("me", true), share("bia")];
    expect(resolveFocusedShare(shares, "ana")?.identity).toBe("bia");
  });

  it("shows the local share when it is the only one", () => {
    expect(resolveFocusedShare([share("me", true)], null)?.identity).toBe("me");
  });
});
