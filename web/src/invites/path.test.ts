import { describe, expect, it } from "vitest";
import { inviteUrl } from "./path.ts";

describe("invite path helpers", () => {
  it("builds an invite URL with encoded token", () => {
    expect(inviteUrl("abc+def", "https://app.example")).toBe(
      "https://app.example/invite/abc%2Bdef",
    );
  });
});
