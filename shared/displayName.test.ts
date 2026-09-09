import { describe, expect, it } from "vitest";
import { parseDisplayName, slugFromName } from "./displayName.ts";
import { parseChatText } from "./chat.ts";

describe("parseDisplayName", () => {
  it("accepts a normal name", () => {
    expect(parseDisplayName("Nilton")).toEqual({ ok: true, value: "Nilton" });
  });

  it("trims and collapses spaces", () => {
    expect(parseDisplayName("  João   Pedro  ")).toEqual({
      ok: true,
      value: "João Pedro",
    });
  });

  it("rejects short names", () => {
    expect(parseDisplayName("A").ok).toBe(false);
    expect(parseDisplayName("   ").ok).toBe(false);
  });

  it("rejects names longer than 32", () => {
    expect(parseDisplayName("n".repeat(33)).ok).toBe(false);
  });

  it("rejects markup characters", () => {
    expect(parseDisplayName("<script>").ok).toBe(false);
    expect(parseDisplayName("ok>no").ok).toBe(false);
  });
});

describe("slugFromName", () => {
  it("strips accents", () => {
    expect(slugFromName("João")).toBe("joao");
  });
});

describe("parseChatText", () => {
  it("accepts a short message", () => {
    expect(parseChatText("Olha isso aqui.")).toEqual({
      ok: true,
      value: "Olha isso aqui.",
    });
  });

  it("rejects empty and oversized text", () => {
    expect(parseChatText("  ").ok).toBe(false);
    expect(parseChatText("x".repeat(2001)).ok).toBe(false);
  });
});
