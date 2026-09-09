import { describe, expect, it } from "vitest";
import { insertEmojiAt } from "./emojis.ts";

describe("insertEmojiAt", () => {
  it("inserts at the caret", () => {
    expect(insertEmojiAt("oi ", "🔥", 3)).toEqual({ value: "oi 🔥", caret: 5 });
  });

  it("replaces the current selection", () => {
    expect(insertEmojiAt("ola mundo", "👋", 0, 3)).toEqual({
      value: "👋 mundo",
      caret: 2,
    });
  });
});
