import { describe, expect, it } from "vitest";
import {
  parseChannelName,
  parseCommunityName,
  parseMessageText,
} from "./community.ts";

describe("parseCommunityName", () => {
  it("trims and collapses repeated whitespace", () => {
    expect(parseCommunityName("  Minha   Turma ")).toEqual({
      ok: true,
      value: "Minha Turma",
    });
  });

  it("preserves accents", () => {
    expect(parseCommunityName("São Paulo")).toEqual({
      ok: true,
      value: "São Paulo",
    });
  });

  it("rejects empty values", () => {
    expect(parseCommunityName("")).toEqual({
      ok: false,
      error: "Digite um nome com pelo menos 2 caracteres.",
    });
    expect(parseCommunityName("   ")).toEqual({
      ok: false,
      error: "Digite um nome com pelo menos 2 caracteres.",
    });
  });

  it("rejects names shorter than 2 characters", () => {
    expect(parseCommunityName("A")).toEqual({
      ok: false,
      error: "Digite um nome com pelo menos 2 caracteres.",
    });
  });

  it("rejects names longer than 48 characters", () => {
    expect(parseCommunityName("n".repeat(49))).toEqual({
      ok: false,
      error: "O nome pode ter no máximo 48 caracteres.",
    });
  });

  it("accepts names at the length bounds", () => {
    expect(parseCommunityName("AB")).toEqual({ ok: true, value: "AB" });
    expect(parseCommunityName("n".repeat(48))).toEqual({
      ok: true,
      value: "n".repeat(48),
    });
  });

  it("rejects markup and control characters", () => {
    expect(parseCommunityName("<script>")).toEqual({
      ok: false,
      error: "O nome contém caracteres inválidos.",
    });
    expect(parseCommunityName("ok>no")).toEqual({
      ok: false,
      error: "O nome contém caracteres inválidos.",
    });
    expect(parseCommunityName("ok\u0007no")).toEqual({
      ok: false,
      error: "O nome contém caracteres inválidos.",
    });
  });
});

describe("parseChannelName", () => {
  it("replaces spaces with hyphens", () => {
    expect(parseChannelName("dev front")).toEqual({
      ok: true,
      value: "dev-front",
    });
  });

  it("trims and collapses repeated whitespace before hyphenating", () => {
    expect(parseChannelName("  chat   geral  ")).toEqual({
      ok: true,
      value: "chat-geral",
    });
  });

  it("preserves accents", () => {
    expect(parseChannelName("reunião")).toEqual({
      ok: true,
      value: "reunião",
    });
  });

  it("rejects empty values", () => {
    expect(parseChannelName("")).toEqual({
      ok: false,
      error: "Digite um nome de canal.",
    });
    expect(parseChannelName("   ")).toEqual({
      ok: false,
      error: "Digite um nome de canal.",
    });
  });

  it("rejects names longer than 48 characters", () => {
    expect(parseChannelName("n".repeat(49))).toEqual({
      ok: false,
      error: "O nome pode ter no máximo 48 caracteres.",
    });
  });

  it("accepts names at the length bounds", () => {
    expect(parseChannelName("a")).toEqual({ ok: true, value: "a" });
    expect(parseChannelName("n".repeat(48))).toEqual({
      ok: true,
      value: "n".repeat(48),
    });
  });

  it("rejects markup and control characters", () => {
    expect(parseChannelName("<geral>")).toEqual({
      ok: false,
      error: "O nome contém caracteres inválidos.",
    });
    expect(parseChannelName("ok>no")).toEqual({
      ok: false,
      error: "O nome contém caracteres inválidos.",
    });
    expect(parseChannelName("ok\u0007no")).toEqual({
      ok: false,
      error: "O nome contém caracteres inválidos.",
    });
  });
});

describe("parseMessageText", () => {
  it("preserves accents, markup, emoji and newlines", () => {
    expect(parseMessageText("  Olá   mundo ")).toEqual({
      ok: true,
      value: "Olá mundo",
    });
    expect(parseMessageText("Reunião às 10h 🎮")).toEqual({
      ok: true,
      value: "Reunião às 10h 🎮",
    });
    expect(parseMessageText("<script>oi</script>")).toEqual({
      ok: true,
      value: "<script>oi</script>",
    });
    expect(parseMessageText("linha1\n\nlinha2")).toEqual({
      ok: true,
      value: "linha1\n\nlinha2",
    });
  });

  it("rejects empty values", () => {
    expect(parseMessageText("")).toEqual({
      ok: false,
      error: "Digite uma mensagem.",
    });
    expect(parseMessageText("   ")).toEqual({
      ok: false,
      error: "Digite uma mensagem.",
    });
  });

  it("rejects messages longer than 500 characters", () => {
    expect(parseMessageText("x".repeat(501))).toEqual({
      ok: false,
      error: "A mensagem pode ter no máximo 500 caracteres.",
    });
  });

  it("accepts messages at the maximum length", () => {
    expect(parseMessageText("x".repeat(500))).toEqual({
      ok: true,
      value: "x".repeat(500),
    });
  });

  it("strips control characters but keeps text", () => {
    expect(parseMessageText("ok\u0007no")).toEqual({
      ok: true,
      value: "okno",
    });
  });
});
