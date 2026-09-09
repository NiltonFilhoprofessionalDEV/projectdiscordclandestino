import { describe, expect, it } from "vitest";
import { createRequestGuard } from "./requestGuard.ts";

describe("createRequestGuard", () => {
  it("ignores a stale ticket after a newer request starts", () => {
    const guard = createRequestGuard();
    const first = guard.next();
    const second = guard.next();

    expect(first.isCurrent()).toBe(false);
    expect(second.isCurrent()).toBe(true);
  });
});
