import { describe, expect, it } from "vitest";
import { splitMessageLinks } from "./messageLinks.ts";

describe("splitMessageLinks", () => {
  it("keeps plain text alone", () => {
    expect(splitMessageLinks("opa e aí")).toEqual([{ type: "text", value: "opa e aí" }]);
  });

  it("extracts https links", () => {
    expect(splitMessageLinks("veja https://example.com/path agora")).toEqual([
      { type: "text", value: "veja " },
      { type: "link", value: "https://example.com/path", href: "https://example.com/path" },
      { type: "text", value: " agora" },
    ]);
  });

  it("adds https to www links", () => {
    expect(splitMessageLinks("www.google.com")).toEqual([
      { type: "link", value: "www.google.com", href: "https://www.google.com/" },
    ]);
  });
});
