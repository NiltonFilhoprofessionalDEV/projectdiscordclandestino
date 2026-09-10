// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { registerServiceWorker } from "./registerServiceWorker.ts";

describe("registerServiceWorker", () => {
  it("does not register during tests (non-production)", () => {
    const register = vi.fn();
    Object.defineProperty(navigator, "serviceWorker", {
      value: { register },
      configurable: true,
    });
    registerServiceWorker();
    expect(register).not.toHaveBeenCalled();
  });
});
