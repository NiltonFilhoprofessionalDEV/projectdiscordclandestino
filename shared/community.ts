import type { ParseResult } from "./displayName.ts";

export type CommunityId = string & { readonly __brand: "CommunityId" };
export type ChannelId = string & { readonly __brand: "ChannelId" };
export type CommunityRole = "owner" | "admin" | "member";
export type ChannelType = "text" | "voice";

const COMMUNITY_MIN_LENGTH = 2;
const COMMUNITY_MAX_LENGTH = 48;
const CHANNEL_MAX_LENGTH = 48;
const MESSAGE_MAX_LENGTH = 2000;

const INVALID_MARKUP = /[<>]/;
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;
const MESSAGE_CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

function normalizeWhitespace(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function normalizeMessageText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(MESSAGE_CONTROL_CHARS, "")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function hasInvalidChars(value: string): boolean {
  return INVALID_MARKUP.test(value) || CONTROL_CHARS.test(value);
}

export function parseCommunityName(raw: string): ParseResult {
  const value = normalizeWhitespace(raw);

  if (value.length < COMMUNITY_MIN_LENGTH) {
    return {
      ok: false,
      error: "Digite um nome com pelo menos 2 caracteres.",
    };
  }

  if (value.length > COMMUNITY_MAX_LENGTH) {
    return {
      ok: false,
      error: "O nome pode ter no máximo 48 caracteres.",
    };
  }

  if (hasInvalidChars(value)) {
    return { ok: false, error: "O nome contém caracteres inválidos." };
  }

  return { ok: true, value };
}

export function parseChannelName(raw: string): ParseResult {
  const value = normalizeWhitespace(raw).replaceAll(" ", "-");

  if (!value) {
    return { ok: false, error: "Digite um nome de canal." };
  }

  if (value.length > CHANNEL_MAX_LENGTH) {
    return {
      ok: false,
      error: "O nome pode ter no máximo 48 caracteres.",
    };
  }

  if (hasInvalidChars(value)) {
    return { ok: false, error: "O nome contém caracteres inválidos." };
  }

  return { ok: true, value };
}

export function parseMessageText(raw: string): ParseResult {
  const value = normalizeMessageText(raw);

  if (!value) {
    return { ok: false, error: "Digite uma mensagem." };
  }

  if (value.length > MESSAGE_MAX_LENGTH) {
    return {
      ok: false,
      error: "A mensagem pode ter no máximo 2000 caracteres.",
    };
  }

  return { ok: true, value };
}
