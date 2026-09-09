import { describe, expect, it } from "vitest";
import { shouldSubmitOnEnter } from "./composerKeys.ts";

describe("shouldSubmitOnEnter", () => {
  it("submits Enter on a fine pointer", () => {
    const matchMedia = () => ({ matches: false }) as MediaQueryList;
    expect(shouldSubmitOnEnter({ key: "Enter", shiftKey: false }, matchMedia)).toBe(true);
  });

  it("keeps a new line on coarse pointer", () => {
    const matchMedia = () => ({ matches: true }) as MediaQueryList;
    expect(shouldSubmitOnEnter({ key: "Enter", shiftKey: false }, matchMedia)).toBe(false);
  });

  it("never submits Shift+Enter", () => {
    expect(shouldSubmitOnEnter({ key: "Enter", shiftKey: true })).toBe(false);
  });
});
