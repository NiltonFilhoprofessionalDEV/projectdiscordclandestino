import { describe, expect, it, vi } from "vitest";
import { focusVoiceChatDrawer } from "./drawerFocus.ts";

describe("focusVoiceChatDrawer", () => {
  it("focuses the heading from the live ref after open, not a closed snapshot", () => {
    const heading = { current: null as { focus: () => void } | null };
    const trigger = { current: { focus: vi.fn() } };
    const closedSnapshot = heading.current;
    heading.current = { focus: vi.fn() };
    focusVoiceChatDrawer(true, heading, trigger, (callback) => callback());
    expect(closedSnapshot).toBeNull();
    expect(heading.current.focus).toHaveBeenCalledTimes(1);
    expect(trigger.current.focus).not.toHaveBeenCalled();
  });

  it("restores focus to the trigger when the drawer closes", () => {
    const heading = { current: { focus: vi.fn() } };
    const trigger = { current: { focus: vi.fn() } };
    focusVoiceChatDrawer(false, heading, trigger, (callback) => callback());
    expect(trigger.current.focus).toHaveBeenCalledTimes(1);
    expect(heading.current.focus).not.toHaveBeenCalled();
  });
});
