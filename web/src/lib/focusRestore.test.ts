import { describe, expect, it } from "vitest";
import { pickFocusTarget } from "./focusRestore.ts";

describe("pickFocusTarget", () => {
  it("uses the fallback when the trigger is not displayed", () => {
    const trigger = { id: "hidden" };
    const fallback = { id: "menu" };
    expect(pickFocusTarget(trigger, fallback, false)).toBe(fallback);
  });

  it("uses the trigger when it is displayed", () => {
    const trigger = { id: "create" };
    const fallback = { id: "menu" };
    expect(pickFocusTarget(trigger, fallback, true)).toBe(trigger);
  });
});
